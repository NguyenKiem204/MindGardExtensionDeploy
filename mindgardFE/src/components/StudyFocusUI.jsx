import { useState, useEffect, useRef } from "react";
import SceneModal from "./SceneModal";
import SoundsModal from "./SoundsModal";
import TimerSettingsModal from "./TimerSettingsModal";
import UserProfileModal from "./UserProfileModal";
import FocusModeModal from "./FocusModeModal";
import LeaderboardModal from "./LeaderboardModal";
import LoginModal from "./LoginModal";
import SubscriptionModal from "./SubscriptionModal";
import { Play, Pause, SkipForward, Settings, Volume2, Image, MessageCircle, Zap, Clock, Music, Video, Grid3x3, Cloud, BarChart3, MoreHorizontal, Minus, Maximize2, Square, X } from "lucide-react";
import { authService } from "../services/authService";
import { pomodoroService } from "../services/pomodoroService";

export default function StudyFocusUI({ forceShowLogin = false }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [selectedSounds, setSelectedSounds] = useState([]);
  const [breakTime, setBreakTime] = useState(0);
  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [isSoundsModalOpen, setIsSoundsModalOpen] = useState(false);
  const [isTimerSettingsModalOpen, setIsTimerSettingsModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isFocusModeModalOpen, setIsFocusModeModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModalOnly, setShowLoginModalOnly] = useState(false);
  const [focusModeSetting, setFocusModeSetting] = useState('manual'); // 'manual' | 'ai'
  const [focusTopic, setFocusTopic] = useState('Focus');
  const [backgroundType, setBackgroundType] = useState("room"); // "room", "video", "image"
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [showSettingsButton, setShowSettingsButton] = useState(false);
  const [settingsButtonPosition, setSettingsButtonPosition] = useState({ x: 0, y: 0 });
  const [isFocusMode, setIsFocusMode] = useState(true); // true = focus, false = break
  const [focusDuration, setFocusDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userName, setUserName] = useState("kiem");
  const [accountType, setAccountType] = useState("Guest Account");
  const [avatarError, setAvatarError] = useState(false);

  // Check authentication on mount and when auth changes
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      // If forceShowLogin is true and not authenticated, open login modal only (not full UserProfileModal)
      if (forceShowLogin && !authenticated && !showLoginModalOnly) {
        setShowLoginModalOnly(true);
      }
      // If authenticated, close login modal
      if (authenticated) {
        setShowLoginModalOnly(false);
      }
    };

    checkAuth();
    const onAuthChanged = () => checkAuth();
    window.addEventListener("mindgard_auth_cleared", onAuthChanged);
    window.addEventListener("mindgard_auth_expired", onAuthChanged);
    window.addEventListener("mindgard_auth_changed", onAuthChanged);

    return () => {
      window.removeEventListener("mindgard_auth_cleared", onAuthChanged);
      window.removeEventListener("mindgard_auth_expired", onAuthChanged);
      window.removeEventListener("mindgard_auth_changed", onAuthChanged);
    };
  }, [forceShowLogin, showLoginModalOnly]);

  // Listen for global subscription modal trigger
  useEffect(() => {
    const handleOpenSubscription = () => setIsSubscriptionModalOpen(true);
    window.addEventListener('mindgard_open_subscription', handleOpenSubscription);
    return () => window.removeEventListener('mindgard_open_subscription', handleOpenSubscription);
  }, []);

  const isFocusing = isRunning && isFocusMode;
  const pipVideoRef = useRef(null);
  const pipCanvasRef = useRef(null);
  const pipRenderIntervalRef = useRef(null);
  const docPipWindowRef = useRef(null);
  const isDocPipActiveRef = useRef(false);
  // Refs to keep latest state for PiP renderer without re-creating PiP
  const timeLeftRef = useRef(timeLeft);
  const isRunningRef = useRef(isRunning);
  const isFocusModeRef = useRef(isFocusMode);
  const taskInputRef = useRef(taskInput);
  const backgroundTypeRef = useRef(backgroundType);
  const backgroundUrlRef = useRef(backgroundUrl);
  const pipBgImageRef = useRef(null);

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { isFocusModeRef.current = isFocusMode; }, [isFocusMode]);
  useEffect(() => { taskInputRef.current = taskInput; }, [taskInput]);
  useEffect(() => { backgroundTypeRef.current = backgroundType; }, [backgroundType]);
  useEffect(() => { backgroundUrlRef.current = backgroundUrl; }, [backgroundUrl]);

  // Load focus mode settings from chrome.storage
  useEffect(() => {
    (async () => {
      try {
        if (!window.chrome?.storage?.local) return;
        const data = await window.chrome.storage.local.get(['focusMode', 'currentFocusTopic']);
        if (data.focusMode) setFocusModeSetting(data.focusMode);
        if (data.currentFocusTopic) setFocusTopic(data.currentFocusTopic);
      } catch { }
    })();
  }, []);

  // Load user info from auth service
  useEffect(() => {
    const checkAuth = () => {
      const cached = authService.getCachedAuth();
      if (cached?.user && authService.isAuthenticated()) {
        setUserAvatar(cached.user.avatarUrl || null);
        setUserName(cached.user.username || cached.user.email || "kiem");
        setAccountType(
          (Array.isArray(cached.user.roles) && cached.user.roles.join(", ")) ||
          cached.user.roleName ||
          "Guest Account"
        );
        setAvatarError(false);
      } else {
        setUserAvatar(null);
        setUserName("kiem");
        setAccountType("Guest Account");
        setAvatarError(false);
      }
    };
    checkAuth();
    // Listen for auth cleared/expired/changed events
    const onAuthChanged = () => checkAuth();
    window.addEventListener("mindgard_auth_cleared", onAuthChanged);
    window.addEventListener("mindgard_auth_expired", onAuthChanged);
    window.addEventListener("mindgard_auth_changed", onAuthChanged);
    return () => {
      window.removeEventListener("mindgard_auth_cleared", onAuthChanged);
      window.removeEventListener("mindgard_auth_expired", onAuthChanged);
      window.removeEventListener("mindgard_auth_changed", onAuthChanged);
    };
  }, [isUserProfileModalOpen]); // Also reload when modal opens

  // Save focus mode settings
  useEffect(() => {
    try {
      if (!window.chrome?.storage?.local) return;
      window.chrome.storage.local.set({ focusMode: focusModeSetting, currentFocusTopic: focusTopic });
    } catch { }
  }, [focusModeSetting, focusTopic]);

  // Listen for changes from UserProfileModal save action
  useEffect(() => {
    const handler = async () => {
      try {
        if (!window.chrome?.storage?.local) return;
        const d = await window.chrome.storage.local.get(['focusMode', 'currentFocusTopic']);
        if (d.focusMode) setFocusModeSetting(d.focusMode);
        if (d.currentFocusTopic) setFocusTopic(d.currentFocusTopic);
      } catch { }
    };
    window.addEventListener('mindgard_focus_settings_changed', handler);
    return () => window.removeEventListener('mindgard_focus_settings_changed', handler);
  }, []);

  // Handle messages from Doc-PiP window (toggle, mode, close)
  useEffect(() => {
    const onMessage = (e) => {
      if (!e?.data || e.data.ns !== 'docpip') return;
      const { type } = e.data;
      if (type === 'docpip:toggle') {
        setIsRunning((prev) => !prev);
      } else if (type === 'docpip:mode') {
        handleModeSwitch();
      } else if (type === 'docpip:close') {
        try { docPipWindowRef.current?.close(); } catch { }
        isDocPipActiveRef.current = false;
        setIsPipActive(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Send state to Doc-PiP when changes
  useEffect(() => {
    const win = docPipWindowRef.current;
    if (!win || win.closed) return;
    const payload = {
      ns: 'docpip',
      type: 'docpip:state',
      timeLeft,
      isRunning,
      isFocusMode,
      taskInput,
      backgroundType,
      backgroundUrl
    };
    try { win.postMessage(payload, '*'); } catch { }
  }, [timeLeft, isRunning, isFocusMode, taskInput, backgroundType, backgroundUrl]);

  // Open Document Picture-in-Picture window with responsive UI
  const openDocPiP = async () => {
    if (!('documentPictureInPicture' in window)) return false;
    try {
      const pipWin = await window.documentPictureInPicture.requestWindow({ width: 290, height: 230 });
      isDocPipActiveRef.current = true;
      setIsPipActive(true);
      docPipWindowRef.current = pipWin;

      // Base styles
      const d = pipWin.document;
      d.open();
      d.write(`<!doctype html><html><head><meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <style>
        :root { color-scheme: dark; }
        html,body { margin:0; padding:0; width:100%; height:100%; background: transparent; overflow:hidden; }
        body { background:transparent; }
        .root { position:absolute; inset:0; }
        .bg { position:absolute; inset:0; background-size:cover; background-position:center; filter:none; }
        /* Ensure motion/video background covers and responds to resize */
        #bgvid { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
        .overlay { position:absolute; inset:0; background: rgba(0,0,0,0.25); }
        .stage { position:absolute; left:50%; top:50%; width:360px; height:420px; transform-origin:center center; }
        .content { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:14px; }
        .mode { display:flex; gap:18px; font:600 16px/1.2 system-ui; letter-spacing:1px; }
        .mode span.active { color:#fff } .mode span.inactive { color:rgba(255,255,255,0.5) }
        .timer { font: 700 64px/1 system-ui; color:#fff; text-shadow: 0 2px 8px rgba(0,0,0,0.4); }
        .task { font: 16px/1.3 system-ui; color: rgba(255,255,255,0.95); text-align:center; max-width: 90%; }
        .controls { display:flex; gap:10px; }
        .circle { width:44px; height:44px; border-radius:999px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.35); background:rgba(0,0,0,0.35); cursor:pointer; }
        .circle:hover { background: rgba(255,255,255,0.18); }
        .icon { width:18px; height:18px; }
      </style></head><body>
        <div id="root" class="root">
          <div class="bg" id="bg"></div>
          <video id="bgvid" class="bg" autoplay loop muted playsinline style="display:none"></video>
          <div class="overlay"></div>
          <div class="stage" id="stage">
            <div class="content">
            <div class="mode"><span id="mFocus" class="active">FOCUS</span><span id="mBreak" class="inactive">BREAK</span></div>
            <div id="time" class="timer">25:00</div>
            <div id="task" class="task">I will focus on...</div>
            <div class="controls">
              <button id="toggle" class="circle" aria-label="Start/Pause">
                <svg id="iconPlay" class="icon" viewBox="0 0 24 24"><path fill="#fff" d="M8 5v14l11-7z"/></svg>
                <svg id="iconPause" class="icon" viewBox="0 0 24 24" style="display:none"><path fill="#fff" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
              </button>
              <button id="switch" class="circle" aria-label="Switch mode">
                <svg class="icon" viewBox="0 0 24 24"><path fill="#fff" d="M7 7h10v2H7zm0 4h10v2H7zm0 4h10v2H7z"/></svg>
              </button>
            </div>
            </div>
          </div>
        </div>
      </body></html>`);
      d.close();

      // CSP-safe setup from opener
      const pw = pipWin;
      const pd = pw.document;
      const root = pd.getElementById('root');
      const stage = pd.getElementById('stage');
      const toggleBtn = pd.getElementById('toggle');
      const switchBtn = pd.getElementById('switch');
      const mF = pd.getElementById('mFocus');
      const mB = pd.getElementById('mBreak');
      const timeEl = pd.getElementById('time');
      const taskEl = pd.getElementById('task');
      const bgEl = pd.getElementById('bg');
      const bgVid = pd.getElementById('bgvid');
      const iconPlay = pd.getElementById('iconPlay');
      const iconPause = pd.getElementById('iconPause');

      const fit = () => {
        const sw = pw.innerWidth, sh = pw.innerHeight;
        const w = 360, h = 420;
        const s = Math.min(sw / w, sh / h);
        stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
      };
      pw.addEventListener('resize', fit);
      fit();

      const postOpener = (msg) => { try { window.postMessage({ ns: 'docpip', ...msg }, '*'); } catch { } };
      toggleBtn.addEventListener('click', () => postOpener({ type: 'docpip:toggle' }));
      switchBtn.addEventListener('click', () => postOpener({ type: 'docpip:mode' }));
      pw.addEventListener('pagehide', () => postOpener({ type: 'docpip:close' }));

      const onPiPMessage = (e) => {
        const data = e?.data; if (!data || data.ns !== 'docpip' || data.type !== 'docpip:state') return;
        const { timeLeft, isRunning, isFocusMode, taskInput, backgroundType, backgroundUrl } = data;
        mF.className = isFocusMode ? 'active' : 'inactive';
        mB.className = !isFocusMode ? 'active' : 'inactive';
        const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        timeEl.textContent = mins + ':' + secs;
        taskEl.textContent = taskInput || 'I will focus on...';
        if (backgroundType === 'image' && backgroundUrl) {
          bgVid.style.display = 'none';
          bgVid.removeAttribute('src');
          bgEl.style.backgroundImage = 'url(' + backgroundUrl + ')';
        } else if ((backgroundType === 'video' || backgroundType === 'motion') && backgroundUrl) {
          bgEl.style.backgroundImage = '';
          bgVid.style.display = 'block';
          if (bgVid.src !== backgroundUrl) {
            try { bgVid.src = backgroundUrl; } catch { }
          }
        } else {
          bgVid.style.display = 'none';
          bgVid.removeAttribute('src');
          bgEl.style.backgroundImage = 'linear-gradient(180deg, rgba(59,130,246,0.95), rgba(34,197,94,0.95))';
        }
        if (isRunning) { iconPlay.style.display = 'none'; iconPause.style.display = 'block'; }
        else { iconPlay.style.display = 'block'; iconPause.style.display = 'none'; }
      };
      pw.addEventListener('message', onPiPMessage);

      // Send initial state immediately
      const init = {
        ns: 'docpip',
        type: 'docpip:state',
        timeLeft: timeLeftRef.current,
        isRunning: isRunningRef.current,
        isFocusMode: isFocusModeRef.current,
        taskInput: taskInputRef.current,
        backgroundType: backgroundTypeRef.current,
        backgroundUrl: backgroundUrlRef.current
      };
      try { pipWin.postMessage(init, '*'); } catch { }

      return true;
    } catch (e) {
      console.error('Doc-PiP error:', e);
      return false;
    }
  };

  // Check fullscreen state on mount and listen for changes
  useEffect(() => {
    const checkFullscreen = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    checkFullscreen();

    // Listen for fullscreen changes
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    events.forEach(event => {
      document.addEventListener(event, checkFullscreen);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, checkFullscreen);
      });
    };
  }, []);

  const handleSettingsClick = () => {
    if (settingsButtonRef.current) {
      const rect = settingsButtonRef.current.getBoundingClientRect();
      setSettingsButtonPosition({
        x: rect.right, // Cạnh phải của nút 3 chấm
        y: rect.bottom + 10
      });
    }
    setIsTimerSettingsModalOpen(true);
  };

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const startTimeRef = useRef(null); // Track when timer started for partial session recording
  const settingsButtonRef = useRef(null);

  // Initialize and manage PiP video element
  useEffect(() => {
    if (!isPipActive) {
      // Cleanup when PiP is inactive
      if (pipRenderIntervalRef.current) {
        clearInterval(pipRenderIntervalRef.current);
        pipRenderIntervalRef.current = null;
      }
      if (pipVideoRef.current) {
        pipVideoRef.current.remove();
        pipVideoRef.current = null;
      }
      if (pipCanvasRef.current) {
        pipCanvasRef.current.remove();
        pipCanvasRef.current = null;
      }
      return;
    }

    // Create PiP video element
    const video = document.createElement('video');
    video.id = 'timer-pip-video';
    video.style.display = 'none';
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    document.body.appendChild(video);
    pipVideoRef.current = video;

    const canvas = document.createElement('canvas');
    // Smaller canvas to make PiP window appear minimized
    canvas.width = 320;
    canvas.height = 240;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    pipCanvasRef.current = canvas;

    const stream = canvas.captureStream(30);
    video.srcObject = stream;
    const ensurePlayAndPiP = async () => {
      try {
        await video.play();
      } catch { }
      // Small delay to ensure playback state before PiP
      setTimeout(() => {
        try {
          video.requestPictureInPicture()
            .catch(err => {
              console.error('PiP error:', err);
              setIsPipActive(false);
            });
        } catch (err) {
          console.error('PiP error:', err);
          setIsPipActive(false);
        }
      }, 0);
    };

    // Sync play/pause from PiP controls to timer state
    const onVideoPlay = () => setIsRunning(true);
    const onVideoPause = () => setIsRunning(false);
    video.addEventListener('play', onVideoPlay);
    video.addEventListener('pause', onVideoPause);

    // Media Session controls map to timer start/pause in PiP (guarded)
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator &&
      typeof navigator.mediaSession?.setActionHandler === 'function') {
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          isRunningRef.current = true;
          setIsRunning(true);
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          isRunningRef.current = false;
          setIsRunning(false);
        });
      } catch { }
    }

    // Render function
    const renderTimer = () => {
      if (!pipCanvasRef.current) return;

      const canvas = pipCanvasRef.current;
      const ctx = canvas.getContext('2d');

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background: sync with main background (image type), else gradient fallback
      const drawCoverImage = (img) => {
        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight;
        if (imgRatio > canvasRatio) {
          drawHeight = canvas.height;
          drawWidth = img.width * (canvas.height / img.height);
        } else {
          drawWidth = canvas.width;
          drawHeight = img.height * (canvas.width / img.width);
        }
        const dx = (canvas.width - drawWidth) / 2;
        const dy = (canvas.height - drawHeight) / 2;
        ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
        // darken overlay for contrast
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };

      if (backgroundTypeRef.current === 'image' && backgroundUrlRef.current) {
        const img = pipBgImageRef.current;
        if (img && img.complete) {
          try { drawCoverImage(img); } catch { }
        } else {
          // fallback gradient while image loads
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.95)');
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.95)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.95)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // FOCUS/BREAK
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = isFocusModeRef.current ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('FOCUS', canvas.width / 2 - 50, 35);
      ctx.fillStyle = !isFocusModeRef.current ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('BREAK', canvas.width / 2 + 50, 35);

      // Timer
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px Arial';
      ctx.fillText(formatTime(timeLeftRef.current), canvas.width / 2, canvas.height / 2 + 10);

      // Task text
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillText(taskInputRef.current || "I will focus on...", canvas.width / 2, canvas.height / 2 + 70);

      // No interactive controls in PiP; control from main tab
    };

    // Initial render and interval
    renderTimer();
    pipRenderIntervalRef.current = setInterval(renderTimer, 1000);

    // Cleanup on PiP close
    const handleLeavePiP = () => {
      if (pipRenderIntervalRef.current) {
        clearInterval(pipRenderIntervalRef.current);
        pipRenderIntervalRef.current = null;
      }
      if (video) video.remove();
      if (canvas) canvas.remove();
      pipVideoRef.current = null;
      pipCanvasRef.current = null;
      setIsPipActive(false);
    };

    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    // Preload background image for PiP if needed
    if (backgroundTypeRef.current === 'image' && backgroundUrlRef.current) {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.onload = () => { pipBgImageRef.current = img; };
      img.src = backgroundUrlRef.current;
    } else {
      pipBgImageRef.current = null;
    }

    // Start playback and then request PiP
    ensurePlayAndPiP();

    return () => {
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
      video.removeEventListener('play', onVideoPlay);
      video.removeEventListener('pause', onVideoPause);
      if (pipRenderIntervalRef.current) {
        clearInterval(pipRenderIntervalRef.current);
      }
    };
  }, [isPipActive]);

  const handleModeSwitch = () => {
    const nextIsFocus = !isFocusMode;
    setIsFocusMode(nextIsFocus);
    if (isFocusMode) {
      // Chuyển từ Focus sang Break
      const sec = breakDuration * 60;
      setTimeLeft(sec);
      if (isRunning) endTimeRef.current = Date.now() + sec * 1000;
    } else {
      // Chuyển từ Break sang Focus
      const sec = focusDuration * 60;
      setTimeLeft(sec);
      if (isRunning) endTimeRef.current = Date.now() + sec * 1000;
    }
  };

  // Load saved background on component mount
  useEffect(() => {
    const savedBackgroundType = localStorage.getItem('mindgard_background_type');
    const savedBackgroundUrl = localStorage.getItem('mindgard_background_url');

    if (savedBackgroundType && savedBackgroundUrl) {
      console.log('Loading saved background:', { type: savedBackgroundType, url: savedBackgroundUrl });
      setBackgroundType(savedBackgroundType);
      setBackgroundUrl(savedBackgroundUrl);
    }
  }, []);

  const tags = ["Work", "Study", "Exercise", "Reading", "Coding", "Writing"];
  const soundOptions = [
    { id: "rain", emoji: "🌧️", name: "Rain" },
    { id: "birds", emoji: "🐦", name: "Birds" },
    { id: "bubbles", emoji: "🫧", name: "Bubbles" },
    { id: "rooster", emoji: "🐓", name: "Rooster" },
    { id: "fire", emoji: "🔥", name: "Fire" },
    { id: "night", emoji: "🌘", name: "Night" },
    { id: "thunder", emoji: "⚡️", name: "Thunder" },
    { id: "tractor", emoji: "🚜", name: "Tractor" },
    { id: "water", emoji: "💦", name: "Water" },
    { id: "waves", emoji: "🌊", name: "Waves" },
    { id: "brown", emoji: "🤎", name: "Brown Noise" },
    { id: "pink", emoji: "🩷", name: "Pink Noise" },
    { id: "white", emoji: "🤍", name: "White Noise" },
    { id: "pencil", emoji: "✏️", name: "Pencil" },
    { id: "mouse", emoji: "🖱️", name: "Mouse" },
    { id: "keyboard", emoji: "⌨️", name: "Keyboard" },
    { id: "writing", emoji: "📝", name: "Writing" },
    { id: "plane", emoji: "✈️", name: "Plane" },
    { id: "city", emoji: "🏙️", name: "City" },
    { id: "coffee", emoji: "☕", name: "Coffee" },
    { id: "train", emoji: "🚆", name: "Train" },
    { id: "wind", emoji: "💨", name: "Wind" }
  ];

  // Sync timer state to chrome.storage for mini window (and listen for changes from mini window)
  useEffect(() => {
    if (window.chrome?.storage?.session) {
      window.chrome.storage.session.set({
        timerTimeLeft: timeLeft,
        timerRunning: isRunning,
        timerFocusMode: isFocusMode,
        timerFocusDuration: focusDuration,
        timerBreakDuration: breakDuration,
        timerTaskInput: taskInput,
        timerBackgroundUrl: backgroundUrl
      });
    }
  }, [timeLeft, isRunning, isFocusMode, focusDuration, breakDuration, taskInput, backgroundUrl]);

  // Listen for changes from mini window
  useEffect(() => {
    if (!window.chrome?.storage?.onChanged) return;

    const listener = (changes, areaName) => {
      if (areaName === 'session') {
        if (changes.timerRunning && changes.timerRunning.newValue !== isRunning) {
          setIsRunning(changes.timerRunning.newValue);
        }
        if (changes.timerFocusMode && changes.timerFocusMode.newValue !== isFocusMode) {
          setIsFocusMode(changes.timerFocusMode.newValue);
        }
        if (changes.timerTimeLeft && changes.timerTimeLeft.newValue !== timeLeft) {
          setTimeLeft(changes.timerTimeLeft.newValue);
        }
      }
    };

    window.chrome.storage.onChanged.addListener(listener);
    return () => window.chrome.storage.onChanged.removeListener(listener);
  }, [isRunning, isFocusMode, timeLeft]);

  useEffect(() => {
    if (isRunning) {
      // When starting, set target end time based on current remaining
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
        startTimeRef.current = Date.now(); // Track start time for partial session
        console.log("[StudyFocusUI] Timer started", {
          isFocusMode,
          startTime: startTimeRef.current,
          endTime: endTimeRef.current,
          timeLeft,
        });
      }
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remainingMs = Math.max(0, (endTimeRef.current || now) - now);
        const remainingSec = Math.max(0, Math.floor((remainingMs + 999) / 1000));
        setTimeLeft(remainingSec);
        if (remainingSec <= 0) {
          // Session finished → switch mode
          setIsRunning(false);
          const completedMin = isFocusMode ? focusDuration : breakDuration;

          // Record completed session if focus mode
          if (isFocusMode && authService.isAuthenticated()) {
            (async () => {
              try {
                const dateISO = new Date().toISOString();
                await pomodoroService.record({
                  dateISO,
                  durationMin: completedMin,
                  taskTitle: taskInput || "Deep work",
                  isPartial: false, // Completed session
                });
                console.log(`[StudyFocusUI] Recorded completed session: ${completedMin} minutes`);
              } catch (e) {
                console.error("[StudyFocusUI] Failed to record completed session:", e);
              }
            })();
          }

          endTimeRef.current = null;
          startTimeRef.current = null;
          if (isFocusMode) {
            setIsFocusMode(false);
            setTimeLeft(breakDuration * 60);
          } else {
            setIsFocusMode(true);
            setTimeLeft(focusDuration * 60);
          }
        }
      }, 250);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Don't clear endTimeRef on pause - we need it to calculate elapsed time
      // endTimeRef.current = null; // pause keeps current timeLeft
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isFocusMode, focusDuration, breakDuration]);

  // Debug state changes
  useEffect(() => {
    console.log('Background state changed:', { backgroundType, backgroundUrl });
  }, [backgroundType, backgroundUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress for circular arc (0..1) based on real time instead of rounded seconds
  const getProgress = () => {
    const totalSec = (isFocusMode ? focusDuration : breakDuration) * 60;
    if (totalSec <= 0) return 0;
    const remainingMs = endTimeRef.current ? Math.max(0, endTimeRef.current - Date.now()) : Math.max(0, timeLeft * 1000);
    const p = 1 - remainingMs / (totalSec * 1000);
    return Math.min(1, Math.max(0, p));
  };

  const toggleTimer = async () => {
    console.log("[StudyFocusUI] toggleTimer() called", {
      isRunning,
      isFocusMode,
      hasStartTime: !!startTimeRef.current,
      hasEndTime: !!endTimeRef.current,
      startTime: startTimeRef.current,
      endTime: endTimeRef.current,
      timeLeft,
    });

    if (!isRunning) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      startTimeRef.current = Date.now();
      setIsRunning(true);
      console.log("[StudyFocusUI] Timer started", {
        isFocusMode,
        startTime: startTimeRef.current,
        endTime: endTimeRef.current,
        timeLeft,
      });
    } else {
      // Pause: record partial session if focus mode and >= 1 minute
      console.log("[StudyFocusUI] Pausing...", {
        isFocusMode,
        hasStartTime: !!startTimeRef.current,
        hasEndTime: !!endTimeRef.current,
        isAuthenticated: authService.isAuthenticated(),
      });

      if (isFocusMode && startTimeRef.current && endTimeRef.current && authService.isAuthenticated()) {
        const elapsedMs = Date.now() - startTimeRef.current;
        const elapsedSec = Math.floor(elapsedMs / 1000);
        const elapsedMin = Math.floor(elapsedSec / 60);

        console.log(`[StudyFocusUI] Pause: elapsed=${elapsedMin} minutes (${elapsedSec} seconds), authenticated=${authService.isAuthenticated()}`);

        if (elapsedMin >= 1) {
          try {
            const dateISO = new Date().toISOString();
            console.log(`[StudyFocusUI] Calling API to record partial session: ${elapsedMin} minutes`);
            const result = await pomodoroService.record({
              dateISO,
              durationMin: elapsedMin,
              taskTitle: taskInput || "Deep work",
              isPartial: true,
            });
            console.log(`[StudyFocusUI] Successfully recorded partial session:`, result);
          } catch (err) {
            console.error("[StudyFocusUI] Failed to record partial session:", {
              error: err,
              response: err?.response?.data,
              status: err?.response?.status,
            });
          }
        } else {
          console.log(`[StudyFocusUI] Skipped recording: ${elapsedMin} minutes (< 1 minute threshold)`);
        }
      } else {
        console.log(`[StudyFocusUI] Pause conditions not met:`, {
          isFocusMode,
          hasStartTime: !!startTimeRef.current,
          hasEndTime: !!endTimeRef.current,
          isAuthenticated: authService.isAuthenticated(),
        });
      }
      setIsRunning(false);
      // Keep endTimeRef for resume, but reset startTimeRef
      startTimeRef.current = null;
    }
  };

  const toggleSound = (soundId) => {
    setSelectedSounds(prev =>
      prev.includes(soundId)
        ? prev.filter(id => id !== soundId)
        : [...prev, soundId]
    );
  };

  const handleBackgroundSelect = (url, type) => {
    console.log('Background selected:', { url, type });
    setBackgroundUrl(url);
    setBackgroundType(type);

    // Save to localStorage
    localStorage.setItem('mindgard_background_type', type);
    localStorage.setItem('mindgard_background_url', url);
    console.log('Background saved to localStorage:', { type, url });

    console.log('State updated - backgroundType:', type, 'backgroundUrl:', url);
  };

  const resetToDefaultBackground = () => {
    console.log('Resetting to default room background');
    setBackgroundType("room");
    setBackgroundUrl("");
    localStorage.removeItem('mindgard_background_type');
    localStorage.removeItem('mindgard_background_url');
  };

  const handleFocusTimeChange = (newFocusTime) => {
    setFocusDuration(newFocusTime);
    if (isFocusMode) {
      setTimeLeft(newFocusTime * 60);
      if (isRunning) {
        endTimeRef.current = Date.now() + newFocusTime * 60 * 1000;
      }
    }
  };

  const handleBreakTimeChange = (newBreakTime) => {
    setBreakDuration(newBreakTime);
    if (!isFocusMode) {
      setTimeLeft(newBreakTime * 60);
      if (isRunning) {
        endTimeRef.current = Date.now() + newBreakTime * 60 * 1000;
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hide Chrome's Focus Dashboard bar */}
      <style>{`
        /* Hide Chrome's Focus Dashboard bar */
        [data-testid="focus-dashboard"], 
        [aria-label*="Focus Dashboard"],
        .focus-dashboard,
        div[style*="background-color: rgb(60, 64, 67)"],
        div[style*="background-color: #3c4043"] {
          display: none !important;
        }
        
        /* Ensure video backgrounds are crisp */
        video {
          filter: none !important;
          opacity: 1 !important;
        }
        
        /* Remove any blur effects on video */
        .video-background {
          filter: none !important;
          backdrop-filter: none !important;
        }
      `}</style>
      {/* Default Background - only show when backgroundType is room */}
      {backgroundType === "room" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-400 to-cyan-500" />
          {/* Background with subtle pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/30 via-blue-300/20 to-cyan-400/30" />

          {/* Decorative blurred circles */}
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
        </>
      )}

      {/* Background */}
      {backgroundType === "room" ? (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900">
          {/* Main Window View */}
          <div className="absolute inset-0">
            {/* Large Window Frame */}
            <div className="absolute top-12 left-12 right-12 bottom-12 border-4 border-amber-700 rounded-lg">
              {/* Rain streaks on window */}
              <div className="absolute inset-0 opacity-40">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 bg-blue-200 opacity-70"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      height: `${15 + Math.random() * 25}px`,
                      transform: `rotate(${-10 + Math.random() * 5}deg)`
                    }}
                  />
                ))}
              </div>

              {/* Outside Landscape */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700">
                {/* Sky gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600"></div>

                {/* Mountains in background */}
                <div className="absolute bottom-0 w-full h-2/3 bg-slate-700 rounded-t-full"></div>
                <div className="absolute bottom-0 left-1/4 w-1/2 h-1/2 bg-slate-600 rounded-t-full"></div>
                <div className="absolute bottom-0 right-1/4 w-1/3 h-1/3 bg-slate-500 rounded-t-full"></div>

                {/* Lake/Water */}
                <div className="absolute bottom-0 left-1/3 w-1/3 h-1/4 bg-slate-500 rounded-t-full"></div>

                {/* Pine Trees */}
                <div className="absolute bottom-1/3 left-1/6 w-3 h-12 bg-green-800 transform rotate-12"></div>
                <div className="absolute bottom-1/3 left-1/4 w-3 h-10 bg-green-800 transform -rotate-6"></div>
                <div className="absolute bottom-1/3 right-1/4 w-3 h-14 bg-green-800 transform rotate-6"></div>
                <div className="absolute bottom-1/3 right-1/6 w-3 h-11 bg-green-800 transform -rotate-12"></div>

                {/* Mist/Fog */}
                <div className="absolute bottom-1/2 left-0 right-0 h-1/4 bg-gradient-to-t from-slate-400/30 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Room Interior Elements */}

          {/* Left side - Piano with sleeping cat */}
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
            {/* Piano */}
            <div className="w-40 h-20 bg-amber-800 rounded-lg relative shadow-lg">
              <div className="absolute inset-1 bg-amber-900 rounded"></div>
              {/* Piano keys */}
              <div className="absolute bottom-2 left-3 right-3 h-3 bg-white rounded-sm"></div>
              <div className="absolute bottom-2 left-4 right-4 h-1.5 bg-black rounded-sm"></div>
              {/* Piano legs */}
              <div className="absolute -bottom-2 left-2 w-2 h-4 bg-amber-900"></div>
              <div className="absolute -bottom-2 right-2 w-2 h-4 bg-amber-900"></div>
            </div>

            {/* Sleeping Cat on piano */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="w-10 h-7 bg-orange-300 rounded-full relative">
                <div className="absolute top-1 left-1.5 w-1 h-1 bg-black rounded-full"></div>
                <div className="absolute top-1 right-1.5 w-1 h-1 bg-black rounded-full"></div>
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-full"></div>
                {/* Cat ears */}
                <div className="absolute -top-1 left-2 w-2 h-2 bg-orange-300 transform rotate-45"></div>
                <div className="absolute -top-1 right-2 w-2 h-2 bg-orange-300 transform rotate-45"></div>
              </div>
            </div>

            {/* Desk Lamp */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <div className="w-1 h-6 bg-amber-600"></div>
              <div className="w-8 h-5 bg-orange-200 rounded-full opacity-90 shadow-lg"></div>
            </div>

            {/* Large Plant */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="w-12 h-16 bg-green-600 rounded-full"></div>
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-green-500 rounded-full"></div>
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-6 h-8 bg-green-400 rounded-full"></div>
            </div>
          </div>

          {/* Center-left - Speakers */}
          <div className="absolute left-1/3 top-1/2 transform -translate-y-1/2">
            {/* Speaker stack */}
            <div className="space-y-2">
              <div className="w-16 h-20 bg-gray-800 rounded-lg relative">
                <div className="absolute inset-2 bg-gray-700 rounded"></div>
                <div className="absolute inset-3 bg-gray-600 rounded"></div>
              </div>
              <div className="w-16 h-20 bg-gray-800 rounded-lg relative">
                <div className="absolute inset-2 bg-gray-700 rounded"></div>
                <div className="absolute inset-3 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>

          {/* Center - Bench */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="w-32 h-10 bg-amber-700 rounded-lg shadow-lg"></div>
            <div className="absolute top-0 left-3 right-3 h-6 bg-amber-600 rounded-t-lg"></div>
            {/* Bench legs */}
            <div className="absolute -bottom-2 left-3 w-2 h-4 bg-amber-800"></div>
            <div className="absolute -bottom-2 right-3 w-2 h-4 bg-amber-800"></div>
          </div>

          {/* Center-right - Large Plant */}
          <div className="absolute right-1/3 top-1/2 transform -translate-y-1/2">
            <div className="w-16 h-20 bg-green-600 rounded-full"></div>
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-green-500 rounded-full"></div>
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-green-400 rounded-full"></div>
          </div>

          {/* Right side - Fireplace, guitar, lava lamp */}
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            {/* Modern Fireplace */}
            <div className="w-20 h-24 bg-gray-900 rounded-lg relative shadow-lg">
              <div className="absolute inset-2 bg-gray-800 rounded"></div>
              {/* Fire */}
              <div className="absolute bottom-3 left-3 right-3 h-16 bg-orange-500 rounded opacity-90">
                <div className="absolute inset-1 bg-yellow-400 rounded opacity-70"></div>
                <div className="absolute inset-2 bg-orange-300 rounded opacity-50"></div>
              </div>
            </div>

            {/* Logs next to fireplace */}
            <div className="absolute bottom-0 right-10 w-16 h-6 bg-amber-700 rounded"></div>
            <div className="absolute bottom-2 right-12 w-12 h-4 bg-amber-600 rounded"></div>

            {/* Electric Guitar */}
            <div className="absolute -bottom-8 right-10 w-3 h-20 bg-blue-400 transform rotate-12"></div>
            <div className="absolute -bottom-6 right-8 w-8 h-3 bg-blue-300 rounded-full"></div>

            {/* Lava Lamp */}
            <div className="absolute top-1/2 right-12 w-6 h-12 bg-purple-600 rounded-full opacity-80">
              <div className="absolute inset-1 bg-purple-400 rounded-full"></div>
              <div className="absolute inset-2 bg-pink-400 rounded-full"></div>
            </div>

            {/* Small Plant */}
            <div className="absolute top-1/4 right-16 w-8 h-12 bg-green-600 rounded-full"></div>
          </div>

          {/* Hanging Elements */}
          {/* Pendant lights */}
          <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-orange-300 rounded-full opacity-90 shadow-lg"></div>
          <div className="absolute top-1/4 right-1/3 w-6 h-6 bg-orange-300 rounded-full opacity-90 shadow-lg"></div>
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-orange-300 rounded-full opacity-90 shadow-lg"></div>

          {/* Hanging plant */}
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2">
            <div className="w-8 h-10 bg-green-600 rounded-full"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-6 bg-amber-600"></div>
          </div>

          {/* Desk area with laptop and coffee */}
          <div className="absolute bottom-8 left-1/4">
            {/* Laptop */}
            <div className="w-16 h-10 bg-gray-300 rounded-lg relative">
              <div className="absolute inset-1 bg-gray-200 rounded"></div>
              <div className="absolute inset-2 bg-gray-100 rounded"></div>
            </div>

            {/* Coffee mug */}
            <div className="absolute -top-2 left-20 w-6 h-8 bg-white rounded-lg">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-orange-200 rounded-full"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-orange-800 font-bold">JAZZ</div>
            </div>

            {/* Calculator */}
            <div className="absolute top-2 left-28 w-8 h-6 bg-gray-200 rounded"></div>
          </div>

          {/* Roland Keyboard */}
          <div className="absolute bottom-8 right-1/4">
            <div className="w-24 h-8 bg-black rounded-lg relative">
              <div className="absolute inset-1 bg-gray-800 rounded"></div>
              <div className="absolute bottom-1 left-2 right-2 h-1 bg-white rounded-sm"></div>
              <div className="absolute bottom-1 left-3 right-3 h-0.5 bg-gray-400 rounded-sm"></div>
            </div>
          </div>
        </div>
      ) : backgroundType === "video" ? (
        <div className="absolute inset-0 video-background">
          <video
            key={backgroundUrl} // Force re-render when URL changes
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{
              filter: 'none',
              opacity: 1,
              zIndex: 1
            }}
            onError={(e) => {
              console.log('Video error:', e);
              console.log('Failed to load video:', backgroundUrl);
            }}
            onLoadStart={() => {
              console.log('Video loading started:', backgroundUrl);
            }}
            onCanPlay={() => {
              console.log('Video can play:', backgroundUrl);
            }}
          >
            <source src={backgroundUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${backgroundUrl})`,
            filter: 'none',
            opacity: 1,
            zIndex: 0
          }}
        >
        </div>
      )}

      {/* Header */}
      <header className={`relative flex items-center justify-between px-8 py-6 transition-all duration-300 z-50`}>
        <div className="flex items-center gap-4">
          <Clock className="w-7 h-7 text-white/90" />
          <h1 className="text-2xl font-semibold text-white/95">MindGard.vn</h1>
          {isFocusing && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/30 rounded-lg border border-blue-400/50">
              <Zap className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-medium text-white">Focusing</span>
            </div>
          )}

        </div>

        <div className="flex items-center gap-3 text-white relative">
          {/* Insert PiP + Fullscreen right before 0m block */}
          <button
            onClick={async () => {
              try {
                if ('documentPictureInPicture' in window) {
                  if (docPipWindowRef.current && !docPipWindowRef.current.closed) {
                    docPipWindowRef.current.close();
                    isDocPipActiveRef.current = false;
                    setIsPipActive(false);
                  } else {
                    const ok = await openDocPiP();
                    if (!ok) setIsPipActive(false);
                  }
                  return;
                }
                if (isPipActive && pipVideoRef.current && document.pictureInPictureElement) {
                  await document.exitPictureInPicture();
                  setIsPipActive(false);
                } else {
                  setIsPipActive(true);
                }
              } catch (error) {
                console.error('Error toggling Picture-in-Picture:', error);
                setIsPipActive(false);
              }
            }}
            className={`w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors ${isPipActive ? 'bg-blue-500/30' : ''
              }`}
            title={isPipActive ? "Exit Picture-in-Picture" : "Picture-in-Picture Timer"}
            disabled={!document.pictureInPictureEnabled}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M21.20 3.01C21.66 3.05 22.08 3.26 22.41 3.58C22.73 3.91 22.94 4.33 22.98 4.79L23 5V19C23.00 19.49 22.81 19.97 22.48 20.34C22.15 20.70 21.69 20.93 21.20 20.99L21 21H3L2.79 20.99C2.30 20.93 1.84 20.70 1.51 20.34C1.18 19.97 .99 19.49 1 19V13H3V19H21V5H11V3H21L21.20 3.01ZM1.29 3.29C1.10 3.48 1.00 3.73 1.00 4C1.00 4.26 1.10 4.51 1.29 4.70L5.58 9H3C2.73 9 2.48 9.10 2.29 9.29C2.10 9.48 2 9.73 2 10C2 10.26 2.10 10.51 2.29 10.70C2.48 10.89 2.73 11 3 11H9V5C9 4.73 8.89 4.48 8.70 4.29C8.51 4.10 8.26 4 8 4C7.73 4 7.48 4.10 7.29 4.29C7.10 4.48 7 4.73 7 5V7.58L2.70 3.29C2.51 3.10 2.26 3.00 2 3.00C1.73 3.00 1.48 3.10 1.29 3.29ZM19.10 11.00L19 11H12L11.89 11.00C11.66 11.02 11.45 11.13 11.29 11.29C11.13 11.45 11.02 11.66 11.00 11.89L11 12V17C10.99 17.24 11.09 17.48 11.25 17.67C11.42 17.85 11.65 17.96 11.89 17.99L12 18H19L19.10 17.99C19.34 17.96 19.57 17.85 19.74 17.67C19.90 17.48 20.00 17.24 20 17V12L19.99 11.89C19.97 11.66 19.87 11.45 19.70 11.29C19.54 11.13 19.33 11.02 19.10 11.00ZM13 16V13H18V16H13Z" fill="currentColor"></path>
            </svg>
          </button>
          <button
            onClick={async () => {
              try {
                if (isFullscreen) {
                  if (document.exitFullscreen) await document.exitFullscreen();
                  else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
                  else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
                  else if (document.msExitFullscreen) await document.msExitFullscreen();
                } else {
                  const element = document.documentElement;
                  if (element.requestFullscreen) await element.requestFullscreen();
                  else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen();
                  else if (element.mozRequestFullScreen) await element.mozRequestFullScreen();
                  else if (element.msRequestFullscreen) await element.msRequestFullscreen();
                }
              } catch (error) {
                console.error('Error toggling fullscreen:', error);
              }
            }}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={isFullscreen ? "Restore" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M3.29 3.29C3.11 3.46 3.01 3.70 3.00 3.94C2.98 4.19 3.06 4.43 3.22 4.63L3.29 4.70L7.58 8.99H5C4.73 8.99 4.48 9.10 4.29 9.29C4.10 9.47 4 9.73 4 9.99C4 10.26 4.10 10.51 4.29 10.70C4.48 10.89 4.73 10.99 5 10.99H11V4.99C11 4.73 10.89 4.47 10.70 4.29C10.51 4.10 10.26 3.99 10 3.99C9.73 3.99 9.48 4.10 9.29 4.29C9.10 4.47 9 4.73 9 4.99V7.58L4.70 3.29L4.63 3.22C4.43 3.06 4.19 2.98 3.94 3.00C3.70 3.01 3.46 3.11 3.29 3.29ZM19 13H13V19C13 19.26 13.10 19.51 13.29 19.70C13.48 19.89 13.73 20 14 20C14.26 20 14.51 19.89 14.70 19.70C14.89 19.51 15 19.26 15 19V16.41L19.29 20.70L19.36 20.77C19.56 20.92 19.80 21.00 20.04 20.99C20.29 20.98 20.52 20.87 20.70 20.70C20.87 20.52 20.98 20.29 20.99 20.04C21.00 19.80 20.92 19.56 20.77 19.36L20.70 19.29L16.41 15H19C19.26 15 19.51 14.89 19.70 14.70C19.89 14.51 20 14.26 20 14C20 13.73 19.89 13.48 19.70 13.29C19.51 13.10 19.26 13 19 13Z" fill="currentColor"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M10 3H3V10C3 10.26 3.10 10.51 3.29 10.70C3.48 10.89 3.73 11 4 11C4.26 11 4.51 10.89 4.70 10.70C4.89 10.51 5 10.26 5 10V6.41L9.29 10.70L9.36 10.77C9.56 10.92 9.80 11.00 10.04 10.99C10.29 10.98 10.52 10.87 10.70 10.70C10.87 10.52 10.98 10.29 10.99 10.04C11.00 9.80 10.92 9.56 10.77 9.36L10.70 9.29L6.41 5H10C10.26 5 10.51 4.89 10.70 4.70C10.89 4.51 11 4.26 11 4C11 3.73 10.89 3.48 10.70 3.29C10.51 3.10 10.26 3 10 3ZM20 13C19.73 13 19.48 13.10 19.29 13.29C19.10 13.48 19 13.73 19 14V17.58L14.70 13.29L14.63 13.22C14.43 13.07 14.19 12.99 13.95 13.00C13.70 13.01 13.47 13.12 13.29 13.29C13.12 13.47 13.01 13.70 13.00 13.95C12.99 14.19 13.07 14.43 13.22 14.63L13.29 14.70L17.58 19H14C13.73 19 13.48 19.10 13.29 19.29C13.10 19.48 13 19.73 13 20C13 20.26 13.10 20.51 13.29 20.70C13.48 20.89 13.73 21 14 21H21V14C21 13.73 20.89 13.48 20.70 13.29C20.51 13.10 20.26 13 20 13Z" fill="currentColor"></path>
              </svg>
            )}
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg backdrop-blur-md border border-white/30">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{breakTime}m</span>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setIsUserProfileModalOpen(true);
              } else {
                setIsLeaderboardModalOpen(true);
              }
            }}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition backdrop-blur-md border border-white/30"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button
            onClick={resetToDefaultBackground}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition backdrop-blur-md border border-white/30"
            title="Reset to default room"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              console.log('Opening scene modal...');
              setIsSceneModalOpen(true);
            }}
            className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-md border border-white/30 hover:bg-white/30 transition"
          >
            <span className="text-sm font-medium">{backgroundType === "room" ? "User's room" : "Custom scene"}</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setIsUserProfileModalOpen(true)}
              className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition cursor-pointer overflow-hidden"
            >
              {userAvatar && !avatarError ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {userName?.charAt(0)?.toUpperCase() || 'K'}
                </span>
              )}
            </button>

            {/* User Profile Modal - positioned relative to avatar */}
            <UserProfileModal
              isOpen={isUserProfileModalOpen}
              onClose={() => setIsUserProfileModalOpen(false)}
              userName={userName}
              accountType={accountType}
              onOpenFocusMode={() => setIsFocusModeModalOpen(true)}
            />
          </div>

          {/* Fullscreen Controls - moved to left; right cluster remains for other items */}
          <div className="flex items-center gap-2 ml-2 hidden">
            <button
              onClick={async () => {
                try {
                  // If Doc-PiP supported, toggle it
                  if ('documentPictureInPicture' in window) {
                    if (docPipWindowRef.current && !docPipWindowRef.current.closed) {
                      docPipWindowRef.current.close();
                      isDocPipActiveRef.current = false;
                      setIsPipActive(false);
                    } else {
                      const ok = await openDocPiP();
                      if (!ok) setIsPipActive(false);
                    }
                    return;
                  }

                  // Fallback: classic video PiP
                  if (isPipActive && pipVideoRef.current && document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                    setIsPipActive(false);
                  } else {
                    setIsPipActive(true);
                  }
                } catch (error) {
                  console.error('Error toggling Picture-in-Picture:', error);
                  setIsPipActive(false);
                }
              }}
              className={`w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors ${isPipActive ? 'bg-blue-500/30' : ''
                }`}
              title={isPipActive ? "Exit Picture-in-Picture" : "Picture-in-Picture Timer"}
              disabled={!document.pictureInPictureEnabled}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {/* Large rectangle */}
                <rect x="3" y="3" width="16" height="16" rx="1" strokeWidth="1.5" stroke="currentColor" />
                {/* Small rectangle in top-left */}
                <rect x="5" y="5" width="8" height="8" rx="1" fill="currentColor" />
              </svg>
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={async () => {
                try {
                  if (isFullscreen) {
                    // Exit fullscreen
                    if (document.exitFullscreen) {
                      await document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                      await document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                      await document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                      await document.msExitFullscreen();
                    }
                  } else {
                    // Enter fullscreen
                    const element = document.documentElement;
                    if (element.requestFullscreen) {
                      await element.requestFullscreen();
                    } else if (element.webkitRequestFullscreen) {
                      await element.webkitRequestFullscreen();
                    } else if (element.mozRequestFullScreen) {
                      await element.mozRequestFullScreen();
                    } else if (element.msRequestFullscreen) {
                      await element.msRequestFullscreen();
                    }
                  }
                } catch (error) {
                  console.error('Error toggling fullscreen:', error);
                }
              }}
              className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                // Restore icon when fullscreen
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="16" height="16" rx="1" strokeWidth="1.5" stroke="currentColor" />
                  <rect x="5" y="5" width="8" height="8" rx="1" fill="currentColor" />
                </svg>
              ) : (
                // Fullscreen icon when not fullscreen
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">

        {/* Timer Display with Progress Circle */}
        <div className="relative mb-10">
          {/* Progress Circle */}
          <div
            className="relative w-[500px] h-[500px] mx-auto"
            onMouseEnter={() => setShowSettingsButton(true)}
            onMouseLeave={() => setShowSettingsButton(false)}
          >

            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle with 300 degree arc (gap at bottom) */}
              <path
                d="M 14.64,85.36 A 45,45 0 1,1 85.36,85.36"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2.5"
                fill="none"
              />
              {/* Progress circle with 300 degree arc */}
              <path
                d="M 14.64,85.36 A 45,45 0 1,1 85.36,85.36"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45 * (300 / 360)}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (300 / 360) * (1 - getProgress())}`}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            {/* Timer Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Mode Indicator */}
              <div className="mb-4 flex items-center gap-6">
                <button
                  onClick={handleModeSwitch}
                  className={`text-2xl font-medium transition-colors ${isFocusMode ? 'text-white' : 'text-white/50'}`}
                >
                  FOCUS
                </button>
                <button
                  onClick={handleModeSwitch}
                  className={`text-2xl font-medium transition-colors ${!isFocusMode ? 'text-white' : 'text-white/50'}`}
                >
                  BREAK
                </button>
              </div>

              {/* Timer */}
              <div className="relative flex items-center justify-center mb-6">
                <div className="text-8xl font-bold text-white leading-none tracking-tight drop-shadow-lg">
                  {formatTime(timeLeft)}
                </div>
                {/* Settings Button - appears on hover */}
                {showSettingsButton && (
                  <button
                    ref={settingsButtonRef}
                    onClick={handleSettingsClick}
                    className="absolute left-full ml-4 w-8 h-8 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-all duration-200"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Task Input inside circle */}
              <div className="w-80 text-center mb-4">
                {!showTaskInput ? (
                  <button
                    onClick={() => setShowTaskInput(true)}
                    className="text-white/90 hover:text-white transition text-xl underline decoration-white/30 hover:decoration-white/60"
                  >
                    I will focus on...
                  </button>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      placeholder="I will focus on..."
                      className="bg-transparent text-white text-xl text-center outline-none border-none w-full placeholder:text-white/60 underline decoration-white/30 focus:decoration-white/60"
                      autoFocus
                      onBlur={() => setShowTaskInput(false)}
                    />
                  </div>
                )}
              </div>

              {/* Play/Pause/Stop Button */}
              <button
                onClick={toggleTimer}
                className={`p-4 rounded-full text-white transition shadow-lg flex items-center justify-center ${isRunning
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                  }`}
              >
                {isRunning ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Bottom Left Navigation */}
      <nav className="absolute bottom-8 left-8 flex gap-3">
        <button className="p-4 bg-slate-500/60 hover:bg-slate-500/70 rounded-2xl backdrop-blur-md transition">
          <Cloud className="w-5 h-5 text-white/90" />
        </button>
        <button
          onClick={() => setIsSoundsModalOpen(true)}
          className="p-4 bg-slate-500/60 hover:bg-slate-500/70 rounded-2xl backdrop-blur-md transition"
        >
          <Music className="w-5 h-5 text-white/90" />
        </button>
        <button
          onClick={() => {
            console.log('Opening scene modal from bottom left...');
            setIsSceneModalOpen(true);
          }}
          className="p-4 bg-slate-500/60 hover:bg-slate-500/70 rounded-2xl backdrop-blur-md transition"
        >
          <Image className="w-5 h-5 text-white/90" />
        </button>
        <button className="p-4 bg-slate-500/60 hover:bg-slate-500/70 rounded-2xl backdrop-blur-md transition">
          <MessageCircle className="w-5 h-5 text-white/90" />
        </button>
        <button className="p-4 bg-slate-500/60 hover:bg-slate-500/70 rounded-2xl backdrop-blur-md transition">
          <Grid3x3 className="w-5 h-5 text-white/90" />
        </button>
      </nav>

      {/* Bottom Right Actions */}
      <div className="absolute bottom-8 right-8 flex gap-3">
        <button className="p-3.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-md transition border border-white/30">
          <MessageCircle className="w-5 h-5 text-white" />
        </button>
        <button className="p-3.5 bg-pink-500 hover:bg-pink-600 rounded-xl backdrop-blur-md transition shadow-lg">
          <Zap className="w-5 h-5 text-white" />
        </button>
        <button className="p-3.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-md transition border border-white/30">
          <Clock className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Scene Selection Modal */}
      <SceneModal
        isOpen={isSceneModalOpen}
        onClose={() => setIsSceneModalOpen(false)}
        onSelectBackground={handleBackgroundSelect}
      />

      {/* Sounds Modal */}
      <SoundsModal
        isOpen={isSoundsModalOpen}
        onClose={() => setIsSoundsModalOpen(false)}
      />

      {/* Timer Settings Modal */}
      <TimerSettingsModal
        isOpen={isTimerSettingsModalOpen}
        onClose={() => setIsTimerSettingsModalOpen(false)}
        position={settingsButtonPosition}
        focusTime={focusDuration}
        breakTime={breakDuration}
        onFocusTimeChange={handleFocusTimeChange}
        onBreakTimeChange={handleBreakTimeChange}
      />

      {/* Focus Mode Modal - large centered */}
      <FocusModeModal
        isOpen={isFocusModeModalOpen}
        onClose={() => setIsFocusModeModalOpen(false)}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
      />

      {/* Login Modal (standalone, when forceShowLogin) */}
      <LoginModal
        isOpen={showLoginModalOnly}
        onClose={() => setShowLoginModalOnly(false)}
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setShowLoginModalOnly(false);
        }}
      />

      {/* Global Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onUpgradeSuccess={async () => {
          await authService.refreshMe();
          window.dispatchEvent(new CustomEvent("mindgard_auth_changed"));
        }}
      />

    </div>
  );
}
