(function init() {
  const warnKey = "focusWarnings";

  function collect() {
    const title = document.title || "";
    const desc =
      document.querySelector('meta[name="description"]')?.content || "";
    return { url: location.href, title, description: desc };
  }

  function requestClassify() {
    chrome.runtime.sendMessage({ type: "classify", payload: collect() });
  }

  const _push = history.pushState;
  history.pushState = function () {
    _push.apply(this, arguments);
    setTimeout(requestClassify, 0);
  };
  window.addEventListener("popstate", requestClassify);
  new MutationObserver((m) => {
    if (m.some((x) => x.addedNodes && x.addedNodes.length)) requestClassify();
  }).observe(document, { childList: true, subtree: true });
  requestClassify();

  chrome.runtime.onMessage.addListener(async (msg) => {
    if (!msg || msg.type !== "classification") return;
    const { url, label } = msg.payload || {};
    if (url !== location.href) return;

    // Lists
    const conf = await chrome.storage.local.get(["blockList", "allowList"]);
    const hostname = location.hostname.replace(/^www\./, "");
    const blockedByList = (conf.blockList || []).some((p) =>
      hostname.includes(p)
    );
    const allowedByList = (conf.allowList || []).some((p) =>
      hostname.includes(p)
    );

    const isEntertainment = label === "entertainment";
    if (!isEntertainment && !blockedByList) return;

    const session = await chrome.storage.session.get([
      "focusWarnings",
      "focusSessionActive",
    ]);
    if (!session.focusSessionActive) return;
    if (allowedByList) return; // explicitly allowed while focusing

    const now = Date.now();
    const list = (session["focusWarnings"] ?? []).filter(
      (t) => now - t < 5 * 60_000
    );
    list.push(now);
    await chrome.storage.session.set({ ["focusWarnings"]: list });
    if (list.length >= 3) {
      showBlockOverlay();
    } else {
      showToast(
        "Bạn đang trong phiên tập trung. Nội dung này có thể gây xao nhãng."
      );
    }
  });

  function showToast(text) {
    let el = document.getElementById("__focus_toast__");
    if (!el) {
      el = document.createElement("div");
      el.id = "__focus_toast__";
      el.style.position = "fixed";
      el.style.left = "50%";
      el.style.transform = "translateX(-50%)";
      el.style.bottom = "24px";
      el.style.background = "rgba(0,0,0,0.8)";
      el.style.color = "#fff";
      el.style.padding = "12px 16px";
      el.style.borderRadius = "8px";
      el.style.zIndex = "2147483647";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.display = "block";
    setTimeout(() => {
      el.style.display = "none";
    }, 3000);
  }

  function showBlockOverlay() {
    let el = document.getElementById("__focus_block__");
    if (el) return;
    el = document.createElement("div");
    el.id = "__focus_block__";
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.background = "rgba(15,23,42,0.95)";
    el.style.color = "#fff";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.flexDirection = "column";
    el.style.zIndex = "2147483647";
    el.innerHTML =
      '<div style="font-size:20px;font-weight:700;margin-bottom:12px;">Chế độ tập trung đang bật</div><div style="opacity:.85;margin-bottom:16px;">Nội dung bị chặn đến khi kết thúc phiên.</div>';
    const btn = document.createElement("button");
    btn.textContent = "Tôi hiểu";
    btn.style.background = "#2563eb";
    btn.style.border = "0";
    btn.style.color = "#fff";
    btn.style.padding = "10px 16px";
    btn.style.borderRadius = "8px";
    btn.style.cursor = "pointer";
    btn.onclick = () => {
      /* stay blocked */
    };
    el.appendChild(btn);
    document.body.appendChild(el);
  }
})();
