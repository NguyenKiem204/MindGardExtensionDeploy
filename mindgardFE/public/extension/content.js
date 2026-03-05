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

  // --- Quick Note UI ---
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.type === "toggle_quick_note") {
      toggleQuickNoteUI();
    }
  });

  function toggleQuickNoteUI() {
    var existing = document.getElementById("__mindgard_quick_note__");
    if (existing) {
      existing.remove();
      return;
    }

    // Inject styles
    if (!document.getElementById("__mindgard_quick_note_style__")) {
      var style = document.createElement("style");
      style.id = "__mindgard_quick_note_style__";
      style.innerHTML = `
        #__mindgard_quick_note__ {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 350px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          z-index: 2147483647;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          animation: slideInUp 0.3s ease-out;
          color: #1e293b;
        }
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        #__mindgard_quick_note_header__ {
          background: #f8fafc;
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: grab;
          user-select: none;
        }
        #__mindgard_quick_note_header__:active {
          cursor: grabbing;
        }
        #__mindgard_quick_note_title__ {
          font-weight: 600;
          font-size: 14px;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        #__mindgard_quick_note_close__ {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #__mindgard_quick_note_close__:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        #__mindgard_quick_note_body__ {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        #__mindgard_quick_note_page_title_input__ {
          font-size: 13px;
          color: #0f172a;
          width: 100%;
          background: #f1f5f9;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid transparent;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
        }
        #__mindgard_quick_note_page_title_input__:focus {
          border-color: #cbd5e1;
          background: #fff;
        }
        #__mindgard_quick_note_textarea__ {
          width: 100%;
          min-height: 100px;
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          outline: none;
          box-sizing: border-box;
          color: #0f172a;
          background: #fff;
        }
        #__mindgard_quick_note_textarea__:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        #__mindgard_quick_note_footer__ {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 0 16px 16px 16px;
        }
        .mg-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .mg-btn-secondary {
          background: #fff;
          border-color: #cbd5e1;
          color: #64748b;
        }
        .mg-btn-secondary:hover {
          background: #f8fafc;
          color: #0f172a;
        }
        .mg-btn-primary {
          background: #3b82f6;
          color: #fff;
        }
        .mg-btn-primary:hover {
          background: #2563eb;
        }
        #__mindgard_quick_note_loading__ {
          display: none;
          font-size: 12px;
          color: #64748b;
          align-self: center;
          margin-right: auto;
        }
      `;
      document.head.appendChild(style);
    }

    var container = document.createElement("div");
    container.id = "__mindgard_quick_note__";

    var pageTitle = document.title || "Untitled Page";
    var pageUrl = window.location.href;

    container.innerHTML = `
      <div id="__mindgard_quick_note_header__">
        <h3 id="__mindgard_quick_note_title__">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Quick Note
        </h3>
        <button id="__mindgard_quick_note_close__">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div id="__mindgard_quick_note_body__">
        <input type="text" id="__mindgard_quick_note_page_title_input__" value="${pageTitle.replace(/"/g, '&quot;')}" title="Edit title" placeholder="Note Title" />
        <textarea id="__mindgard_quick_note_textarea__" placeholder="Start typing your note... (Press Ctrl+Enter to save)"></textarea>
      </div>
      <div id="__mindgard_quick_note_footer__">
        <span id="__mindgard_quick_note_loading__">Saving...</span>
        <button class="mg-btn mg-btn-secondary" id="__mindgard_quick_note_cancel__">Cancel</button>
        <button class="mg-btn mg-btn-primary" id="__mindgard_quick_note_save__">Save Note</button>
      </div>
    `;

    document.body.appendChild(container);

    // DOM Elements
    var header = document.getElementById("__mindgard_quick_note_header__");
    var closeBtn = document.getElementById("__mindgard_quick_note_close__");
    var cancelBtn = document.getElementById("__mindgard_quick_note_cancel__");
    var saveBtn = document.getElementById("__mindgard_quick_note_save__");
    var titleInput = document.getElementById("__mindgard_quick_note_page_title_input__");
    var textarea = document.getElementById("__mindgard_quick_note_textarea__");
    var loadingText = document.getElementById("__mindgard_quick_note_loading__");

    // Focus textarea automatically
    textarea.focus();

    // Event Listeners
    closeBtn.onclick = () => container.remove();
    cancelBtn.onclick = () => container.remove();

    // Keyboard shortcuts within UI
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        container.remove();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        saveBtn.click();
      }
    });

    // Save action
    saveBtn.onclick = async () => {
      var content = textarea.value.trim();
      if (!content) {
        textarea.focus();
        return;
      }

      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      textarea.disabled = true;
      loadingText.style.display = "inline-block";

      try {
        var finalTitle = titleInput.value.trim() || pageTitle;
        // Find token from MindGard's localStorage if we are on the extension page
        // Otherwise, ask background script to get it from storage
        chrome.runtime.sendMessage({
          type: "save_quick_note",
          payload: {
            title: finalTitle,
            content: content,
            url: pageUrl,
            tags: "Quick Note",
            pinned: false
          }
        }, function (response) {
          if (chrome.runtime.lastError) {
            console.error("Save error:", chrome.runtime.lastError);
            alert("MindGard: Could not connect to background script.");
            resetUI();
            return;
          }
          if (response && response.success) {
            showToast("Note saved successfully! ✅");
            container.remove();
          } else {
            alert("Failed to save note: " + (response?.error || "Unknown error"));
            resetUI();
          }
        });
      } catch (err) {
        console.error("Save error:", err);
        alert("Failed to save note.");
        resetUI();
      }
    };

    function resetUI() {
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
      textarea.disabled = false;
      titleInput.disabled = false;
      loadingText.style.display = "none";
      textarea.focus();
    }

    // --- Draggable Logic ---
    var isDragging = false;
    var currentX;
    var currentY;
    var initialX;
    var initialY;
    var xOffset = 0;
    var yOffset = 0;

    header.addEventListener("mousedown", dragStart);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("mousemove", drag);

    function dragStart(e) {
      // Get current position
      var rect = container.getBoundingClientRect();

      // Calculate offset differently for first drag vs subsequent drags
      // Because initially it's positioned by bottom/right, but we'll switch to transform
      if (xOffset === 0 && yOffset === 0) {
        xOffset = rect.left;
        yOffset = rect.top;
        container.style.bottom = 'auto';
        container.style.right = 'auto';
        container.style.left = '0px';
        container.style.top = '0px';
        container.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
      }

      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
      }
    }

    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Boundaries
        var rect = container.getBoundingClientRect();
        var maxX = window.innerWidth - rect.width;
        var maxY = window.innerHeight - rect.height;

        if (currentX < 0) currentX = 0;
        if (currentY < 0) currentY = 0;
        if (currentX > maxX) currentX = maxX;
        if (currentY > maxY) currentY = maxY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, container);
      }
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
  }

})();
