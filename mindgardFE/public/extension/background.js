const cache = new Map();

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (!msg || msg.type !== "classify") return;
  const { url, title, description } = msg.payload || {};
  const keyData = await chrome.storage.local.get([
    "geminiApiKey",
    "aiBlockingEnabled",
  ]);
  if (!keyData.aiBlockingEnabled || !keyData.geminiApiKey) return;

  const cacheKey = url;
  const hit = cache.get(cacheKey);
  const now = Date.now();
  if (hit && now - hit.t < 60_000) {
    chrome.tabs.sendMessage(sender.tab.id, {
      type: "classification",
      payload: hit.v,
    });
    return;
  }

  try {
    const label = await classifyWithGemini({
      url,
      title,
      description,
      key: keyData.geminiApiKey,
    });
    const payload = { url, label, confidence: 0.8 };
    cache.set(cacheKey, { t: now, v: payload });
    chrome.tabs.sendMessage(sender.tab.id, { type: "classification", payload });
  } catch (e) {
    // Swallow to avoid noisy background errors
  }
});

async function classifyWithGemini({ url, title, description, key }) {
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  const prompt = `Classify this page as work_or_study or entertainment. Return just one word.\nURL: ${url}\nTITLE: ${title}\nDESCRIPTION: ${description}`;
  const res = await fetch(`${endpoint}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error("Gemini API error");
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const normalized = /work|study/i.test(text) ? "work" : "entertainment";
  return normalized;
}

// ---------------- Mock AI Focus modes and blocking flow ----------------
const AI_MOCK_RESULTS = { RELATED: 'related', UNRELATED: 'unrelated' };

function mockAIAnalysis(currentFocusTopic, pageTitle, pageUrl) {
  try {
    const focusKeywords = (currentFocusTopic || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const textToAnalyze = ((pageTitle || '') + ' ' + (pageUrl || '')).toLowerCase();

    if (/youtube\.com|facebook\.com|tiktok\.com/.test(pageUrl || '')) {
      if (focusKeywords.some(k => textToAnalyze.includes(k))) return AI_MOCK_RESULTS.RELATED;
      if ((pageUrl || '').includes('youtube.com') && /video game|music video|trailer/i.test(pageTitle || '')) return AI_MOCK_RESULTS.UNRELATED;
      return AI_MOCK_RESULTS.RELATED; // default lenient
    }
    if (/stackoverflow\.com|aws\.amazon\.com/.test(pageUrl || '')) return AI_MOCK_RESULTS.RELATED;
    return AI_MOCK_RESULTS.UNRELATED;
  } catch {
    return AI_MOCK_RESULTS.RELATED;
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {
    focusMode: 'manual', // 'manual' | 'ai'
    currentFocusTopic: 'Focus',
    blockedDomains: ['facebook.com', 'tiktok.com'],
    allowedDomains: [],
    blockedGroups: getDefaultBlockedGroups(),
    warnMinutes: 5,
    hardBlockMinutes: 5,
    sessionBlocked: {},
  };
  const existing = await chrome.storage.local.get(Object.keys(defaults));
  const toSet = {};
  for (const k of Object.keys(defaults)) if (existing[k] === undefined) toSet[k] = defaults[k];
  if (Object.keys(toSet).length) await chrome.storage.local.set(toSet);
  // migrate legacy blockedDomains into Custom group
  if (Array.isArray(existing.blockedDomains) && existing.blockedDomains.length) {
    const groups = existing.blockedGroups || getDefaultBlockedGroups();
    groups.Custom = groups.Custom || { enabled: true, items: [] };
    for (const d of existing.blockedDomains) if (d) groups.Custom.items.push(String(d).toLowerCase());
    await chrome.storage.local.set({ blockedGroups: groups, blockedDomains: [] });
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab || !tab.active) return;
  const { focusMode, currentFocusTopic, allowedDomains, blockedGroups, sessionBlocked } = await chrome.storage.local.get([
    'focusMode','currentFocusTopic','allowedDomains','blockedGroups','sessionBlocked'
  ]);
  const url = tab.url || '';
  console.log('[FG] onUpdated', { tabId, url, focusMode, allowedDomains, blockedGroupsKeys: Object.keys(blockedGroups||{}), sessionBlockedHit: !!(sessionBlocked && sessionBlocked[url]) });

  // If already session-blocked, redirect immediately
  if (sessionBlocked && sessionBlocked[url]) {
    console.log('[FG] sessionBlocked redirect');
    try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch (e) { console.warn('[FG] redirect fail', e); }
    return;
  }

  if (focusMode === 'manual') {
    if (isAllowedUrl(url, allowedDomains || [])) {
      console.log('[FG] manual allow matched');
      return; // explicit allow wins
    }
    const mergedBlocked = mergeBlockedDomains(blockedGroups || {});
    if (isBlockedByDomain(url, mergedBlocked)) {
      console.log('[FG] manual block matched → redirect');
      try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch (e) { console.warn('[FG] redirect fail', e); }
    }
    return;
  }

  // AI-managed flow
  const verdict = mockAIAnalysis(currentFocusTopic || '', tab.title || '', url);
  if (verdict === AI_MOCK_RESULTS.UNRELATED) {
    // create warning alarm
    const warnName = alarmName('warn', tabId, url);
    await chrome.alarms.clear(warnName);
    await chrome.alarms.create(warnName, { delayInMinutes: (await getNumber('warnMinutes', 5)) });
  } else {
    // clear any pending alarms
    await clearAllAlarmsForTab(tabId, url);
  }
});

// Also enforce on navigation commits and tab activation
chrome.webNavigation?.onCommitted?.addListener(async (details) => {
  try {
    if (details.frameId !== 0) return;
    const tabId = details.tabId;
    const url = details.url || '';
    const { focusMode, allowedDomains, blockedGroups } = await chrome.storage.local.get(['focusMode','allowedDomains','blockedGroups']);
    console.log('[FG] onCommitted', { tabId, url, focusMode });
    if (focusMode !== 'manual') return;
    if (isAllowedUrl(url, allowedDomains || [])) return;
    const mergedBlocked = mergeBlockedDomains(blockedGroups || {});
    if (isBlockedByDomain(url, mergedBlocked)) {
      console.log('[FG] manual block matched (onCommitted) → redirect');
      try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch (e) { console.warn('[FG] redirect fail', e); }
    }
  } catch {}
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || '';
    const { focusMode, allowedDomains, blockedGroups } = await chrome.storage.local.get(['focusMode','allowedDomains','blockedGroups']);
    console.log('[FG] onActivated', { tabId, url, focusMode });
    if (focusMode !== 'manual') return;
    if (isAllowedUrl(url, allowedDomains || [])) return;
    const mergedBlocked = mergeBlockedDomains(blockedGroups || {});
    if (isBlockedByDomain(url, mergedBlocked)) {
      console.log('[FG] manual block matched (onActivated) → redirect');
      try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch (e) { console.warn('[FG] redirect fail', e); }
    }
  } catch {}
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const info = parseAlarmName(alarm.name);
  if (!info) return;
  const { type, tabId, url } = info;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || tab.url !== url) return; // user navigated away
  } catch { return; }

  if (type === 'warn') {
    // Show warning notification and schedule hard block
    try { await chrome.notifications.create(undefined, { type: 'basic', title: 'Stay on task', message: 'This page seems off-topic. You will be blocked in 5 minutes if you stay.', iconUrl: 'icon.png' }); } catch {}
    const hardName = alarmName('hard', tabId, url);
    await chrome.alarms.clear(hardName);
    const mins = await getNumber('hardBlockMinutes', 5);
    await chrome.alarms.create(hardName, { delayInMinutes: mins });
  }

  if (type === 'hard') {
    // Block for the rest of the focus session (store sessionBlocked)
    const data = await chrome.storage.local.get(['sessionBlocked']);
    const sessionBlocked = data.sessionBlocked || {};
    sessionBlocked[url] = true;
    await chrome.storage.local.set({ sessionBlocked });
    try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch {}
  }
});

function isBlockedByDomain(url, blockedDomains) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./,'');
    return blockedDomains.some(d => host === d || host.endsWith('.' + d));
  } catch { return false; }
}

function isAllowedUrl(url, allowedList) {
  try {
    if (!allowedList || !allowedList.length) return false;
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./,'');
    const log = (...args) => { try { console.log('[FG] allowCheck', ...args); } catch {} };
    for (const entry of allowedList) {
      if (!entry) continue;
      // Support object { name, url }
      let raw = entry;
      if (typeof entry === 'object') raw = entry.url || entry.host || '';
      let e = String(raw).trim();
      try {
        // If entry is a full URL, compare as prefix
        if (/^https?:\/\//i.test(e)) {
          if (url.startsWith(e)) return true;
          // If allowed URL has a specific video id (?v=...), allow any variant with same v regardless of extra params
          const eu = new URL(e);
          const ev = eu.searchParams.get('v');
          const elist = eu.searchParams.get('list');
          if (ev && host === eu.hostname.replace(/^www\./,'')) {
            const uv = u.searchParams.get('v');
            if (uv && uv === ev) { log('match by video id', { ev, uv }); return true; }
          }
          // If allowed URL has a playlist id (?list=...), allow any URL with same list on same host
          if (elist && host === eu.hostname.replace(/^www\./,'')) {
            const ulist = u.searchParams.get('list');
            if (ulist && ulist === elist) { log('match by playlist id', { elist, ulist }); return true; }
          }
          // Support youtu.be short links by video id
          if (/^youtu\.be$/i.test(eu.hostname)) {
            const shortId = (eu.pathname || '').replace(/^\//,'');
            const uv = u.searchParams.get('v');
            if (shortId && uv && uv === shortId && /youtube\.com$/.test(host)) { log('match by youtu.be id', { shortId, uv }); return true; }
          }
        } else {
          // Treat as host allow
          const eh = e.replace(/^www\./,'');
          if (host === eh || host.endsWith('.' + eh)) { log('match by host', { host, eh }); return true; }

          // Treat bare playlist id (e.g., RD..., PL...) as allow-by-list for YouTube hosts
          if (/^(RD|PL|LL|OL)[A-Za-z0-9_-]+$/.test(eh)) {
            if (/youtube\.com$/.test(host)) {
              const ulist = u.searchParams.get('list');
              if (ulist && ulist === eh) { log('match by bare playlist id', { eh, ulist }); return true; }
            }
          }

          // If entry is a YouTube path without protocol, try to parse v/list from it
          if (/youtube\.com/i.test(e)) {
            const query = e.split('?')[1] || '';
            const sp = new URLSearchParams(query);
            const ev = sp.get('v');
            const elist = sp.get('list');
            if (/youtube\.com$/.test(host)) {
              const uv = u.searchParams.get('v');
              const ulist = u.searchParams.get('list');
              if (ev && uv && ev === uv) { log('match by path video id', { ev, uv }); return true; }
              if (elist && ulist && elist === ulist) { log('match by path playlist id', { elist, ulist }); return true; }
            }
          }
        }
      } catch {}
    }
    return false;
  } catch { return false; }
}

function alarmName(type, tabId, url) {
  return `focus_${type}_${tabId}_${url}`;
}
function parseAlarmName(name) {
  const m = /^focus_(warn|hard)_(\d+)_(.*)$/.exec(name);
  if (!m) return null;
  return { type: m[1], tabId: Number(m[2]), url: m[3] };
}
async function getNumber(key, def) {
  const v = (await chrome.storage.local.get([key]))[key];
  return typeof v === 'number' && !Number.isNaN(v) ? v : def;
}
async function clearAllAlarmsForTab(tabId, url) {
  await chrome.alarms.clear(alarmName('warn', tabId, url));
  await chrome.alarms.clear(alarmName('hard', tabId, url));
}

// Merge base blocked domains with enabled groups
function mergeBlockedDomains(groups) {
  const set = new Set();
  try {
    for (const key of Object.keys(groups || {})) {
      const g = groups[key];
      if (!g || g.enabled !== true || !Array.isArray(g.items)) continue;
      for (const d of g.items) {
        if (!d) continue;
        // support string or object { name, host, enabled }
        if (typeof d === 'string') { set.add(String(d).toLowerCase()); continue; }
        if (typeof d === 'object') {
          if (d.enabled === false) continue;
          const host = (d.host || d.url || '').toLowerCase();
          if (host) set.add(host);
        }
      }
    }
  } catch {}
  return Array.from(set);
}

function getDefaultBlockedGroups() {
  return {
    AI: { enabled: false, items: [
      'chat.openai.com','claude.ai','perplexity.ai','poe.com','gemini.google.com'
    ]},
    SocialMedia: { enabled: false, items: [
      'facebook.com','instagram.com','tiktok.com','web.whatsapp.com','messenger.com','web.telegram.org','x.com','reddit.com','discord.com','snapchat.com','pinterest.com','linkedin.com','threads.net','wechat.com','qq.com','vk.com','line.me','tumblr.com'
    ]},
    Entertainment: { enabled: false, items: [
      'youtube.com','netflix.com','twitch.tv','primevideo.com','disneyplus.com','hulu.com','vimeo.com','soundcloud.com','spotify.com','crunchyroll.com','hbomax.com','tv.apple.com'
    ]},
    News: { enabled: false, items: [
      'cnn.com','bbc.com','nytimes.com','theguardian.com','washingtonpost.com','wsj.com','bloomberg.com','reuters.com','foxnews.com','nbcnews.com','cnbc.com','abcnews.go.com','apnews.com','aljazeera.com'
    ]},
    Shopping: { enabled: false, items: [
      'amazon.com','ebay.com','walmart.com','bestbuy.com','shopee.vn','lazada.vn','taobao.com','aliexpress.com','etsy.com','target.com'
    ]},
    Email: { enabled: false, items: [
      'mail.google.com','outlook.com','mail.yahoo.com','proton.me'
    ]},
  };
}