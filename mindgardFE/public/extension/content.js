(function init() {
  var youtubeDebounceTimer = null;
  var aiCache = {};
  var apiCooldownUntil = 0; // Timestamp to skip API calls if rate limited

  function collect() {
    var title = document.title || "";
    var desc = "";
    try { desc = document.querySelector('meta[name="description"]')?.content || ""; } catch (e) { }
    return { url: location.href, title: title, description: desc };
  }

  function requestClassify() {
    var data = collect();
    try {
      chrome.runtime.sendMessage({ type: "classify", payload: data });
    } catch (e) { }
  }

  // --- AI FOCUS: Direct Gemini Classification from Content Script ---
  async function checkAIFocus() {
    var url = location.href;
    var title = document.title || "";

    console.log('[AI-FOCUS] checkAIFocus called | URL:', url, '| Title:', title);

    // Only check YouTube watch URLs
    if (!/youtube\.com\/watch/.test(url)) {
      console.log('[AI-FOCUS] Not a YouTube watch URL, skipping.');
      return;
    }

    // Check if focus session is active (using local storage for cross-script reliability)
    try {
      var localData = await chrome.storage.local.get(['focusSessionActive', 'focusMode', 'currentFocusTopic', 'geminiApiKey']);
      console.log('[AI-FOCUS] focusSessionActive:', localData.focusSessionActive);
      if (typeof localData.focusSessionActive === 'undefined') {
        console.log('[AI-FOCUS] focusSessionActive is UNDEFINED. Keys present in storage.local:', Object.keys(localData));
      }

      if (!localData.focusSessionActive) {
        console.log('[AI-FOCUS] Focus session not active, skipping. (Start the timer first!)');
        return;
      }

      console.log('[AI-FOCUS] focusMode:', localData.focusMode, '| topic:', localData.currentFocusTopic, '| hasApiKey:', !!localData.geminiApiKey);

      if (localData.focusMode !== 'ai') {
        console.log('[AI-FOCUS] Not in AI mode, skipping.');
        return;
      }
      if (!localData.geminiApiKey) {
        console.log('[AI-FOCUS] No Gemini API key, skipping.');
        return;
      }

      var topic = localData.currentFocusTopic || 'Focus';
      var apiKey = localData.geminiApiKey;

      // Check API cooldown (Skip if we hit a rate limit recently)
      if (Date.now() < apiCooldownUntil) {
        console.log('[AI-FOCUS] API is on cooldown due to rate limit. Skipping check.');
        return;
      }

      // Check cache (10 minutes)
      var cacheKey = url;
      if (aiCache[cacheKey] && (Date.now() - aiCache[cacheKey].time < 600000)) {
        console.log('[AI-FOCUS] Cache hit:', aiCache[cacheKey].verdict);
        if (aiCache[cacheKey].verdict === 'unrelated') {
          showDistractionAlert(topic);
        }
        return;
      }

      // Call Gemini API directly
      console.log('[AI-FOCUS] Calling Gemini API...');
      console.log('[AI-FOCUS] Topic:', topic);
      console.log('[AI-FOCUS] Video title:', title);

      var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
      var prompt = 'You are an AI focus assistant. The user is studying: "' + topic + '".\n' +
        'They are watching a YouTube video with:\n' +
        '- Title: "' + title + '"\n' +
        '- URL: ' + url + '\n\n' +
        'Is this video related to their study topic? Consider that tutorial videos, lectures, documentation walkthroughs, and educational content about the topic are related. Music videos, gaming, vlogs, entertainment, and unrelated topics are NOT related.\n\n' +
        'Respond with ONLY one word: "related" or "unrelated".';

      var response = await fetch(endpoint + '?key=' + encodeURIComponent(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error('[AI-FOCUS] Gemini API Quota Exceeded (429). Setting 1-minute cooldown.');
          apiCooldownUntil = Date.now() + 60000; // 1 minute cooldown
        } else {
          var errText = await response.text();
          console.error('[AI-FOCUS] Gemini API error:', response.status, errText);
        }
        return;
      }

      var data = await response.json();
      var rawText = '';
      try { rawText = data.candidates[0].content.parts[0].text; } catch (e) { }
      console.log('[AI-FOCUS] Gemini raw response:', rawText);

      var verdict = 'related';
      if (/unrelated/i.test(rawText)) {
        verdict = 'unrelated';
      } else if (/related/i.test(rawText)) {
        verdict = 'related';
      }

      // Cache result
      aiCache[cacheKey] = { time: Date.now(), verdict: verdict };

      console.log('[AI-FOCUS] ===== AI VERDICT:', verdict, '| Topic:', topic, '| Video Title:', title, '=====');

      if (verdict === 'unrelated') {
        console.log('[AI-FOCUS] >>> RESULT: UNRELATED! Showing alert...');
        showDistractionAlert(topic);
      } else {
        console.log('[AI-FOCUS] >>> RESULT: RELATED. Enjoy watching.');
      }

    } catch (e) {
      console.error('[AI-FOCUS] Error:', e);
    }
  }

  function showDistractionAlert(topic) {
    var existing = document.getElementById("__ai_focus_overlay__");
    if (existing) return;

    var overlay = document.createElement("div");
    overlay.id = "__ai_focus_overlay__";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(15px);display:flex;align-items:center;justify-content:center;z-index:2147483647;font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;animation: fadeIn 0.4s ease-out;color:#fff;";

    // Inject animation
    var style = document.createElement("style");
    style.innerHTML = "@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }";
    document.head.appendChild(style);

    var container = document.createElement("div");
    container.style.cssText = "background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);padding:40px;border-radius:24px;text-align:center;max-width:500px;width:90%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);animation: slideUp 0.5s ease-out;backdrop-filter:blur(10px);";

    container.innerHTML =
      '<div style="font-size:60px;margin-bottom:20px;">⚠️</div>' +
      '<h2 style="font-size:28px;font-weight:700;margin-bottom:12px;color:#fff;">Ban đang mất tập trung!</h2>' +
      '<p style="font-size:18px;opacity:0.9;margin-bottom:24px;line-height:1.6;">' +
      'Video này không liên quan đến chủ đề học tập: <br>' +
      '<strong style="color:#60a5fa;font-size:20px;">' + topic + '</strong>' +
      '</p>' +
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<button id="__ai_focus_back__" style="background:#2563eb;color:#fff;border:0;padding:16px;border-radius:12px;font-size:18px;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">Quay lại học ngay</button>' +
      '<button id="__ai_focus_continue__" style="background:transparent;color:rgba(255,255,255,0.6);border:0;padding:12px;border-radius:12px;font-size:15px;cursor:pointer;transition:all 0.2s;">Tôi vẫn muốn xem tiếp</button>' +
      '</div>';

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    document.getElementById("__ai_focus_back__").onclick = function () {
      overlay.remove();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'https://www.google.com';
      }
    };

    document.getElementById("__ai_focus_continue__").onclick = function () {
      if (confirm("Chắc chắn chứ? Sự tập trung là chìa khóa thành công!")) {
        overlay.remove();
      }
    };
  }

  // --- SPA Detection ---
  var _push = history.pushState;
  history.pushState = function () {
    _push.apply(this, arguments);
    setTimeout(requestClassify, 100);
    // Also trigger AI focus check after a delay for title update
    setTimeout(checkAIFocus, 2000);
  };
  window.addEventListener("popstate", function () {
    requestClassify();
    setTimeout(checkAIFocus, 2000);
  });

  // YouTube-specific SPA navigation event
  if (/youtube\.com/.test(location.hostname)) {
    console.log('[AI-FOCUS] YouTube detected, adding yt-navigate-finish listener');
    window.addEventListener("yt-navigate-finish", function () {
      console.log('[AI-FOCUS] yt-navigate-finish fired! Scheduling AI check in 2s...');
      setTimeout(checkAIFocus, 2000);
    });
  }

  // Initial load
  console.log('[AI-FOCUS] Content script loaded on', location.href);
  requestClassify();
  // Also check AI focus on initial load (with delay for title)
  setTimeout(checkAIFocus, 2000);

  // --- Original classification message handler (for manual mode blocking) ---
  chrome.runtime.onMessage.addListener(function (msg) {
    if (!msg || msg.type !== "classification") return;
    var result = msg.payload || {};
    if (result.url !== location.href) return;

    chrome.storage.local.get(["blockList", "allowList"], function (conf) {
      var hostname = location.hostname.replace(/^www\./, "");
      var blockedByList = (conf.blockList || []).some(function (p) { return hostname.includes(p); });
      var allowedByList = (conf.allowList || []).some(function (p) { return hostname.includes(p); });
      var isEntertainment = result.label === "entertainment";
      if (!isEntertainment && !blockedByList) return;

      chrome.storage.local.get(["focusWarnings", "focusSessionActive"], function (session) {
        if (!session.focusSessionActive) return;
        if (allowedByList) return;

        var now = Date.now();
        var list = (session.focusWarnings || []).filter(function (t) { return now - t < 300000; });
        list.push(now);
        chrome.storage.local.set({ focusWarnings: list });
        if (list.length >= 3) {
          showBlockOverlay();
        } else {
          showToast("Ban dang trong phien tap trung. Noi dung nay co the gay xao nhang.");
        }
      });
    });
  });

  function showToast(text) {
    var el = document.getElementById("__focus_toast__");
    if (!el) {
      el = document.createElement("div");
      el.id = "__focus_toast__";
      el.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:rgba(0,0,0,0.8);color:#fff;padding:12px 16px;border-radius:8px;z-index:2147483647;font-family:sans-serif;";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 3000);
  }

  function showBlockOverlay() {
    var el = document.getElementById("__focus_block__");
    if (el) return;
    el = document.createElement("div");
    el.id = "__focus_block__";
    el.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.95);color:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:2147483647;font-family:sans-serif;";
    el.innerHTML = '<div style="font-size:20px;font-weight:700;margin-bottom:12px;">Che do tap trung dang bat</div><div style="opacity:.85;margin-bottom:16px;">Noi dung bi chan den khi ket thuc phien.</div>';
    var btn = document.createElement("button");
    btn.textContent = "Toi hieu";
    btn.style.cssText = "background:#2563eb;border:0;color:#fff;padding:10px 16px;border-radius:8px;cursor:pointer;";
    btn.onclick = function () { };
    el.appendChild(btn);
    document.body.appendChild(el);
  }
})();
