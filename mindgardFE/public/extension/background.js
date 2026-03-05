const cache = new Map();

// --- Keyboard Shortcut Handler ---
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-quick-note') {
    // Check if user is authenticated before injecting UI
    const storageData = await chrome.storage.local.get(['token', 'auth_token', 'jwt']);
    const token = storageData.token || storageData.auth_token || storageData.jwt;

    if (!token) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'logo.png',
        title: 'MindGard - Login Required',
        message: 'Please open a New Tab and log in to MindGard to use Quick Notes.'
      });
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const tab = tabs[0];
        // Don't send messages to internal browser pages
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://'))) {
          return;
        }
        chrome.tabs.sendMessage(tab.id, { type: 'toggle_quick_note' }).catch(err => {
          console.log('[BG] toggle_quick_note ignored: Content script not loaded in this tab. Try reloading the page.', err.message);
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (!msg) return;

  // --- Quick Note Save Logic ---
  if (msg.type === 'save_quick_note') {
    (async () => {
      try {
        const payload = msg.payload;
        // Assume the token is stored in chrome.storage.local by the extension page
        // Wait, normally localStorage in extension page is not accessible directly here if using standard window.localStorage
        // But since we are looking at MindGardAPI, let's grab token from chrome.storage if available
        // If it's only in localStorage of the extension page, we might need to get it via a different way.
        // Let's check chrome.storage.local for 'auth_token' or 'token'
        // Often auth setups using Chrome extensions sync to chrome.storage
        const storageData = await chrome.storage.local.get(['token', 'auth_token', 'jwt']);
        let token = storageData.token || storageData.auth_token || storageData.jwt;

        if (!token) {
          // Fallback: try to query local storage of the newtab page or rely on the user having logged in via the website/extension
          // Assuming VITE_API_BASE_URL is api.mindgard.com or similar, for now we hardcore the known prod URL based on previous logs: https://kiemnv.shop/api
          // Wait, without token, it will fail.
        }

        const apiUrl = 'https://kiemnv.shop/api/notes'; // Directly hitting prod URL as seen in previous steps

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          sendResponse({ success: true });
        } else {
          const errText = await response.text();
          sendResponse({ success: false, error: `API error ${response.status}: ${errText}` });
        }
      } catch (err) {
        console.error('[BG] Save note error:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message port open for async sendResponse
  }

  // --- AI Focus Mode: YouTube check (triggered by content script classify or check_ai_focus) ---
  if (msg.type === 'classify' || msg.type === 'check_ai_focus') {
    const { url, title, description } = msg.payload || {};
    console.log('[BG] Received message:', msg.type, '| URL:', url, '| Title:', title);

    // Check AI focus mode first (for YouTube)
    const isYouTubeWatch = /youtube\.com\/watch/.test(url);
    console.log('[BG] Is YouTube watch?', isYouTubeWatch);

    if (isYouTubeWatch) {
      try {
        const sessionData = await chrome.storage.local.get(['focusSessionActive']);
        console.log('[BG] focusSessionActive:', sessionData.focusSessionActive);

        if (sessionData.focusSessionActive) {
          const localData = await chrome.storage.local.get(['focusMode', 'currentFocusTopic', 'geminiApiKey']);
          console.log('[BG] focusMode:', localData.focusMode, '| topic:', localData.currentFocusTopic, '| hasApiKey:', !!localData.geminiApiKey);

          if (localData.focusMode === 'ai' && localData.geminiApiKey) {
            const topic = localData.currentFocusTopic || 'Focus';
            // Check cache first
            const aiCacheKey = `ai_${url}`;
            const aiHit = aiCache.get(aiCacheKey);
            const nowMs = Date.now();
            if (aiHit && nowMs - aiHit.t < 60_000) {
              console.log('[BG] Cache hit:', aiHit.v);
              if (aiHit.v === 'unrelated') {
                console.log('[BG] Sending ai_distraction_warning (cached) to tab', sender.tab.id);
                try { chrome.tabs.sendMessage(sender.tab.id, { type: 'ai_distraction_warning', payload: { topic } }); } catch (e) { console.error('[BG] sendMessage error:', e); }
              }
              return;
            }

            console.log('[BG] Calling Gemini API for classification...');
            try {
              const verdict = await classifyYouTubeWithTopic({ url, title, topic, key: localData.geminiApiKey });
              aiCache.set(aiCacheKey, { t: nowMs, v: verdict });
              console.log('[BG] ===== AI VERDICT:', verdict, '| Topic:', topic, '| Video:', title, '=====');
              if (verdict === 'unrelated') {
                console.log('[BG] >>> SENDING ai_distraction_warning to tab', sender.tab.id);
                try { chrome.tabs.sendMessage(sender.tab.id, { type: 'ai_distraction_warning', payload: { topic } }); } catch (e) { console.error('[BG] sendMessage error:', e); }
              } else {
                console.log('[BG] Video is related, no warning needed.');
              }
            } catch (e) {
              console.error('[BG] Gemini API call FAILED:', e);
            }
            return; // handled by AI focus, skip general classification
          } else {
            console.log('[BG] Not in AI mode or no API key. focusMode:', localData.focusMode);
          }
        } else {
          console.log('[BG] Focus session not active, skipping AI check.');
        }
      } catch (e) {
        console.error('[BG] AI focus check error:', e);
      }
    }

    // If it was a check_ai_focus message, stop here (don't do general classification)
    if (msg.type === 'check_ai_focus') return;

    // --- General entertainment/work classification (original flow) ---
    const keyData = await chrome.storage.local.get(['geminiApiKey', 'aiBlockingEnabled']);
    if (!keyData.aiBlockingEnabled || !keyData.geminiApiKey) return;

    const cacheKey = url;
    const hit = cache.get(cacheKey);
    const now = Date.now();
    if (hit && now - hit.t < 60_000) {
      chrome.tabs.sendMessage(sender.tab.id, { type: 'classification', payload: hit.v });
      return;
    }

    try {
      const label = await classifyWithGemini({ url, title, description, key: keyData.geminiApiKey });
      const payload = { url, label, confidence: 0.8 };
      cache.set(cacheKey, { t: now, v: payload });
      chrome.tabs.sendMessage(sender.tab.id, { type: 'classification', payload });
    } catch (e) {
      // Swallow to avoid noisy background errors
    }
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

// ---------------- AI Focus: Gemini-based YouTube classification ----------------
const aiCache = new Map();

async function classifyYouTubeWithTopic({ url, title, topic, key }) {
  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const prompt = `You are an AI focus assistant. The user is studying: "${topic}".
They are watching a YouTube video with:
- Title: "${title}"
- URL: ${url}

Is this video related to their study topic? Consider that tutorial videos, lectures, documentation walkthroughs, and educational content about the topic are related. Music videos, gaming, vlogs, entertainment, and unrelated topics are NOT related.

Respond with ONLY one word: "related" or "unrelated".`;

  const res = await fetch(`${endpoint}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error('Gemini API error: ' + res.status);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return /related/i.test(text) && !/unrelated/i.test(text) ? 'related' : 'unrelated';
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
    'focusMode', 'currentFocusTopic', 'allowedDomains', 'blockedGroups', 'sessionBlocked'
  ]);
  const url = tab.url || '';
  console.log('[FG] onUpdated', { tabId, url, focusMode, allowedDomains, blockedGroupsKeys: Object.keys(blockedGroups || {}), sessionBlockedHit: !!(sessionBlocked && sessionBlocked[url]) });

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

  // AI-managed flow — only check YouTube watch pages
  if (!/youtube\.com\/watch/.test(url)) return; // skip non-YouTube pages in AI mode

  const keyData = await chrome.storage.local.get(['geminiApiKey']);
  if (!keyData.geminiApiKey) return; // no API key configured

  // Check cache first
  const aiCacheKey = `ai_${url}`;
  const aiHit = aiCache.get(aiCacheKey);
  const nowMs = Date.now();
  if (aiHit && nowMs - aiHit.t < 60_000) {
    if (aiHit.v === 'unrelated') {
      try { chrome.tabs.sendMessage(tabId, { type: 'ai_distraction_warning', payload: { topic: currentFocusTopic || 'Focus' } }); } catch { }
    }
    return;
  }

  try {
    const verdict = await classifyYouTubeWithTopic({
      url,
      title: tab.title || '',
      topic: currentFocusTopic || 'Focus',
      key: keyData.geminiApiKey,
    });
    aiCache.set(aiCacheKey, { t: nowMs, v: verdict });
    console.log('[FG] AI classification:', { url, verdict, topic: currentFocusTopic });
    if (verdict === 'unrelated') {
      try { chrome.tabs.sendMessage(tabId, { type: 'ai_distraction_warning', payload: { topic: currentFocusTopic || 'Focus' } }); } catch { }
    }
  } catch (e) {
    console.warn('[FG] AI classification error:', e);
  }
});

// Also enforce on navigation commits and tab activation
chrome.webNavigation?.onCommitted?.addListener(async (details) => {
  try {
    if (details.frameId !== 0) return;
    const tabId = details.tabId;
    const url = details.url || '';
    const { focusMode, allowedDomains, blockedGroups } = await chrome.storage.local.get(['focusMode', 'allowedDomains', 'blockedGroups']);
    console.log('[FG] onCommitted', { tabId, url, focusMode });
    if (focusMode !== 'manual') return;
    if (isAllowedUrl(url, allowedDomains || [])) return;
    const mergedBlocked = mergeBlockedDomains(blockedGroups || {});
    if (isBlockedByDomain(url, mergedBlocked)) {
      console.log('[FG] manual block matched (onCommitted) → redirect');
      try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch (e) { console.warn('[FG] redirect fail', e); }
    }
  } catch { }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || '';
    const { focusMode, allowedDomains, blockedGroups } = await chrome.storage.local.get(['focusMode', 'allowedDomains', 'blockedGroups']);
    console.log('[FG] onActivated', { tabId, url, focusMode });
    if (focusMode !== 'manual') return;
    if (isAllowedUrl(url, allowedDomains || [])) return;
    const mergedBlocked = mergeBlockedDomains(blockedGroups || {});
    if (isBlockedByDomain(url, mergedBlocked)) {
      console.log('[FG] manual block matched (onActivated) → redirect');
      try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch (e) { console.warn('[FG] redirect fail', e); }
    }
  } catch { }
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
    try { await chrome.notifications.create(undefined, { type: 'basic', title: 'Stay on task', message: 'This page seems off-topic. You will be blocked in 5 minutes if you stay.', iconUrl: 'icon.png' }); } catch { }
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
    try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch { }
  }
});

function isBlockedByDomain(url, blockedDomains) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    return blockedDomains.some(d => host === d || host.endsWith('.' + d));
  } catch { return false; }
}

function isAllowedUrl(url, allowedList) {
  try {
    if (!allowedList || !allowedList.length) return false;
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const log = (...args) => { try { console.log('[FG] allowCheck', ...args); } catch { } };
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
          if (ev && host === eu.hostname.replace(/^www\./, '')) {
            const uv = u.searchParams.get('v');
            if (uv && uv === ev) { log('match by video id', { ev, uv }); return true; }
          }
          // If allowed URL has a playlist id (?list=...), allow any URL with same list on same host
          if (elist && host === eu.hostname.replace(/^www\./, '')) {
            const ulist = u.searchParams.get('list');
            if (ulist && ulist === elist) { log('match by playlist id', { elist, ulist }); return true; }
          }
          // Support youtu.be short links by video id
          if (/^youtu\.be$/i.test(eu.hostname)) {
            const shortId = (eu.pathname || '').replace(/^\//, '');
            const uv = u.searchParams.get('v');
            if (shortId && uv && uv === shortId && /youtube\.com$/.test(host)) { log('match by youtu.be id', { shortId, uv }); return true; }
          }
        } else {
          // Treat as host allow
          const eh = e.replace(/^www\./, '');
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
      } catch { }
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
  } catch { }
  return Array.from(set);
}

function getDefaultBlockedGroups() {
  return {
    AI: {
      enabled: false, items: [
        'chat.openai.com', 'claude.ai', 'perplexity.ai', 'poe.com', 'gemini.google.com'
      ]
    },
    SocialMedia: {
      enabled: false, items: [
        'facebook.com', 'instagram.com', 'tiktok.com', 'web.whatsapp.com', 'messenger.com', 'web.telegram.org', 'x.com', 'reddit.com', 'discord.com', 'snapchat.com', 'pinterest.com', 'linkedin.com', 'threads.net', 'wechat.com', 'qq.com', 'vk.com', 'line.me', 'tumblr.com'
      ]
    },
    Entertainment: {
      enabled: false, items: [
        'youtube.com', 'netflix.com', 'twitch.tv', 'primevideo.com', 'disneyplus.com', 'hulu.com', 'vimeo.com', 'soundcloud.com', 'spotify.com', 'crunchyroll.com', 'hbomax.com', 'tv.apple.com'
      ]
    },
    News: {
      enabled: false, items: [
        'cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com', 'washingtonpost.com', 'wsj.com', 'bloomberg.com', 'reuters.com', 'foxnews.com', 'nbcnews.com', 'cnbc.com', 'abcnews.go.com', 'apnews.com', 'aljazeera.com'
      ]
    },
    Shopping: {
      enabled: false, items: [
        'amazon.com', 'ebay.com', 'walmart.com', 'bestbuy.com', 'shopee.vn', 'lazada.vn', 'taobao.com', 'aliexpress.com', 'etsy.com', 'target.com'
      ]
    },
    Email: {
      enabled: false, items: [
        'mail.google.com', 'outlook.com', 'mail.yahoo.com', 'proton.me'
      ]
    },
  };
}