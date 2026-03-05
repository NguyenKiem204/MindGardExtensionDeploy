import { useState, useEffect, useRef } from "react";
import { X, Plus, Play, Pause, Upload, Trash2, Lock, Music } from "lucide-react";
import { useAudio } from "../context/AudioContext";
import { soundService } from "../services/soundService";
import { authService } from "../services/authService";

export default function SoundsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("Soundscapes");
  const [musicList, setMusicList] = useState([]);
  const [userMusicList, setUserMusicList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const {
    activeMusic, playMusic, isPlaying,
    toggleSoundscape, activeSoundscapes
  } = useAudio();

  const [isPlusUser, setIsPlusUser] = useState(false);

  useEffect(() => {
    const checkPlus = () => {
      const auth = authService.getCachedAuth();
      setIsPlusUser(auth?.user?.roles?.includes("ROLE_PLUS") || false);
    };
    checkPlus();
    window.addEventListener("mindgard_auth_changed", checkPlus);
    return () => window.removeEventListener("mindgard_auth_changed", checkPlus);
  }, []);

  const tabs = ["Soundscapes", "Music"];

  // Fetch predefined music
  useEffect(() => {
    if (isOpen && activeTab === "Music" && musicList.length === 0) {
      setLoading(true);
      soundService.getMusic()
        .then(data => setMusicList(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, activeTab, musicList.length]);

  // Fetch user's custom music
  useEffect(() => {
    if (isOpen && activeTab === "Music" && isPlusUser) {
      soundService.getUserMusic()
        .then(data => {
          // Map backend Sound entity to frontend format
          const mapped = data.map(s => ({
            id: s.id,
            name: s.name,
            thumbnail: s.thumbnail || null,
            src: s.srcUrl,
            type: s.type || "MP3",
            category: s.category || "Custom",
            isCustom: true
          }));
          setUserMusicList(mapped);
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, activeTab, isPlusUser]);

  const allMusic = [...musicList, ...userMusicList];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const saved = await soundService.uploadMusic(file, file.name.replace(/\.[^.]+$/, ''));
      // Add to user list
      setUserMusicList(prev => [...prev, {
        id: saved.id,
        name: saved.name,
        thumbnail: saved.thumbnail || null,
        src: saved.srcUrl,
        type: saved.type || "MP3",
        category: "Custom",
        isCustom: true
      }]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteTrack = async (track) => {
    if (!confirm(`Xóa "${track.name}"?`)) return;
    try {
      await soundService.deleteUserMusic(track.id);
      setUserMusicList(prev => prev.filter(m => m.id !== track.id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const soundIcons = {
    rainfall: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
    noise: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="3" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="18" width="6" height="1" rx="0.5" />
        <g opacity="0.6">
          <circle cx="14" cy="7" r="0.8" />
          <circle cx="18" cy="7" r="0.8" />
          <circle cx="8" cy="11" r="0.8" />
          <circle cx="12" cy="11" r="0.8" />
          <circle cx="16" cy="11" r="0.8" />
          <circle cx="6" cy="14" r="0.8" />
          <circle cx="10" cy="14" r="0.8" />
          <circle cx="14" cy="14" r="0.8" />
          <circle cx="18" cy="14" r="0.8" />
        </g>
      </svg>
    ),
    binaural: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h2m14 0h2M6 8v8m12-8v8M9 5v14m6-14v14" strokeLinecap="round" />
      </svg>
    ),
    ocean: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v4m0 10v4M3 12h4m10 0h4" />
        <path d="M12 8l4 4m-4 0l4-4m-8 0l-4 4m4 0l-4-4" strokeLinecap="round" />
      </svg>
    ),
    campfire: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2s-4 3.5-4 7c0 2.2 1.8 4 4 4s4-1.8 4-4c0-3.5-4-7-4-7z" opacity="0.9" />
        <path d="M6 20l6-2 6 2v2H6v-2z" opacity="0.7" />
        <ellipse cx="12" cy="20" rx="8" ry="1" opacity="0.3" />
      </svg>
    ),
    beach: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v8m-4-6v4m8-4v4" />
        <circle cx="12" cy="14" r="3" fill="currentColor" opacity="0.3" />
        <path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round" />
        <path d="M3 21c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round" />
      </svg>
    ),
    train: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="12" rx="2" />
        <path d="M4 11h16" />
        <circle cx="8" cy="7.5" r="0.5" fill="currentColor" />
        <circle cx="16" cy="7.5" r="0.5" fill="currentColor" />
        <circle cx="8" cy="16" r="1.5" />
        <circle cx="16" cy="16" r="1.5" />
        <path d="M7 19l-2 2m12-2l2 2" />
      </svg>
    ),
    forest: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l-3 5h2l-2.5 5h2L8 17h8l-2.5-5h2l-2.5-5h2z" opacity="0.9" />
        <rect x="11" y="17" width="2" height="5" opacity="0.6" />
      </svg>
    ),
    garden: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3" />
        <path d="M12 11v11M9 15c-2 0-3.5 1-3.5 3M15 15c2 0 3.5 1 3.5 3" />
        <path d="M8 8c-1.5-1-3-1-4 0.5M16 8c1.5-1 3-1 4 0.5" strokeLinecap="round" />
        <circle cx="12" cy="8" r="1.5" fill="currentColor" />
      </svg>
    ),
    cafe: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
        <path d="M6 2v3M10 2v3M14 2v3" strokeLinecap="round" />
      </svg>
    ),
    thunderstorm: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" opacity="0.9" />
      </svg>
    ),
    creek: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round" />
        <path d="M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round" />
        <path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round" />
      </svg>
    ),
    office: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18M3 9h18M3 15h6" />
      </svg>
    ),
    custom: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    )
  };

  const soundOptions = [
    { id: "rainfall", name: "Rainfall", thumbnail: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "noise", name: "Noise", thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "binaural", name: "Binaural", thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "ocean", name: "Ocean", thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "campfire", name: "Campfire", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "beach", name: "Beach", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "train", name: "Train", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "forest", name: "Forest", thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "garden", name: "Garden", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "cafe", name: "Café", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "thunderstorm", name: "Thunderstorm", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "creek", name: "Creek", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "office", name: "Office", thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop&crop=center", category: "soundscapes" },
    { id: "custom", name: "Custom", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center", category: "custom" }
  ];

  const SOUNDSCAPE_SRC = {
    rainfall: "https://actions.google.com/sounds/v1/weather/light_rain.ogg",
    noise: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg",
    binaural: "https://actions.google.com/sounds/v1/ambiences/ambient_hum_air_conditioner.ogg",
    ocean: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg",
    campfire: "https://actions.google.com/sounds/v1/ambiences/fire.ogg",
    beach: "https://actions.google.com/sounds/v1/water/water_lapping_wind.ogg",
    train: "https://actions.google.com/sounds/v1/ambiences/subway_station_nyc.ogg",
    forest: "https://actions.google.com/sounds/v1/ambiences/summer_forest.ogg",
    garden: "https://actions.google.com/sounds/v1/ambiences/spring_day_forest.ogg",
    cafe: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    thunderstorm: "https://actions.google.com/sounds/v1/weather/thunderstorm.ogg",
    creek: "https://actions.google.com/sounds/v1/water/small_stream_flowing.ogg",
    office: "https://actions.google.com/sounds/v1/ambiences/retail_background_noises.ogg",
    custom: "https://actions.google.com/sounds/v1/weather/light_breeze.ogg",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start p-4" onClick={onClose}>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
      <div
        className="bg-[#2a2a2a] rounded-2xl w-full max-w-sm max-h-[50vh] overflow-hidden shadow-2xl mb-20 ml-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Sounds</h2>
          </div>
          {/* Upload button (only in Music tab for Plus users) */}
          {activeTab === "Music" && isPlusUser && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 rounded-lg text-white transition-all"
            >
              {uploading ? (
                <span className="text-xs font-medium">Đang tải...</span>
              ) : (
                <>
                  <Upload className="w-3 h-3" />
                  <span className="text-xs font-medium">Upload</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 pt-3">
          {tabs.map((tab) => {
            const isPremiumTab = tab === "Music";
            const isLocked = isPremiumTab && !isPlusUser;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-1 transition-all ${activeTab === tab
                  ? "bg-gray-600 text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                  }`}
              >
                {tab} {isLocked && <Lock className="w-3 h-3 text-orange-300" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-3 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(50vh - 140px)', minHeight: '300px' }}>

          {/* SOUNDSCAPES TAB */}
          {activeTab === 'Soundscapes' && (
            <div className="grid grid-cols-4 gap-3">
              {soundOptions.map((sound) => {
                const isActive = !!activeSoundscapes[sound.id];
                return (
                  <div
                    key={sound.id}
                    className="group cursor-pointer flex flex-col items-center gap-2"
                    onClick={() => toggleSoundscape({ ...sound, src: SOUNDSCAPE_SRC[sound.id] || SOUNDSCAPE_SRC.rainfall })}
                  >
                    <div className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all duration-300 ${isActive ? 'ring-2 ring-green-400 scale-105 shadow-lg shadow-green-500/20' : 'hover:scale-105'}`}>
                      <img
                        src={sound.thumbnail}
                        alt={sound.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                      />
                      <div className={`absolute inset-0 flex items-center justify-center bg-black/20 ${isActive ? 'bg-black/0' : ''}`}>
                        {soundIcons[sound.id]}
                      </div>
                    </div>
                    <h3 className={`text-[10px] font-medium text-center truncate w-full ${isActive ? 'text-green-400' : 'text-gray-300'}`}>{sound.name}</h3>
                  </div>
                )
              })}
            </div>
          )}

          {/* MUSIC TAB */}
          {activeTab === "Music" && (
            !isPlusUser ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold">Mở khóa Âm nhạc Cao cấp</h3>
                <p className="text-gray-400 text-xs max-w-[250px]">
                  Nâng cấp MindGard Plus để nghe nhạc và tải lên âm thanh của riêng bạn.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('mindgard_open_subscription'));
                  }}
                  className="px-4 py-2 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-bold rounded-lg text-white shadow-lg shadow-orange-500/30"
                >
                  Nâng cấp Plus
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {loading && <div className="text-white text-center py-4">Đang tải nhạc...</div>}
                {!loading && allMusic.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Music className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">Chưa có nhạc nào</p>
                    <p className="text-xs mt-1">Nhấn Upload để tải nhạc lên</p>
                  </div>
                )}
                {!loading && allMusic.length > 0 && (
                  <>
                    {/* Predefined section */}
                    {musicList.length > 0 && (
                      <>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nhạc có sẵn</p>
                        <div className="grid grid-cols-4 gap-3">
                          {musicList.map((item) => {
                            const isCurrent = activeMusic?.id === item.id;
                            const isPlayingItem = isCurrent && isPlaying;
                            return (
                              <div
                                key={item.id}
                                className="group cursor-pointer flex flex-col items-center gap-2"
                                onClick={() => playMusic(item)}
                              >
                                <div className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all duration-300 ${isCurrent ? "ring-2 ring-blue-400 scale-105 shadow-lg shadow-blue-500/20" : "hover:scale-105"}`}>
                                  {item.thumbnail ? (
                                    <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                      <Music className="w-6 h-6 text-white/70" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    {isPlayingItem ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                                  </div>
                                </div>
                                <h3 className={`text-[10px] font-medium text-center truncate w-full ${isCurrent ? "text-blue-400" : "text-gray-300"}`} title={item.name}>
                                  {item.name}
                                </h3>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Custom uploaded section */}
                    {userMusicList.length > 0 && (
                      <>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-3">Nhạc của bạn</p>
                        <div className="grid grid-cols-4 gap-3">
                          {userMusicList.map((item) => {
                            const isCurrent = activeMusic?.id === item.id;
                            const isPlayingItem = isCurrent && isPlaying;
                            return (
                              <div
                                key={item.id}
                                className="group cursor-pointer flex flex-col items-center gap-2 relative"
                              >
                                <div
                                  className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all duration-300 ${isCurrent ? "ring-2 ring-green-400 scale-105 shadow-lg shadow-green-500/20" : "hover:scale-105"}`}
                                  onClick={() => playMusic(item)}
                                >
                                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                                    <Music className="w-6 h-6 text-white/70" />
                                  </div>
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    {isPlayingItem ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                                  </div>
                                </div>
                                {/* Delete button */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteTrack(item); }}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-2.5 h-2.5 text-white" />
                                </button>
                                <h3 className={`text-[10px] font-medium text-center truncate w-full ${isCurrent ? "text-green-400" : "text-gray-300"}`} title={item.name}>
                                  {item.name}
                                </h3>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Now playing indicator */}
                {activeMusic?.src && (
                  <div className="mt-2 pt-2 border-t border-gray-700/50 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-[10px] text-gray-400 truncate">
                      {isPlaying ? 'Đang phát' : 'Tạm dừng'}: {activeMusic.name}
                    </span>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-700/50">
          <div className="flex gap-1.5 flex-wrap">
            {["Deep", "Focus", "Positive", "Classical"].map((tag) => (
              <button
                key={tag}
                className="px-2.5 py-1 bg-gray-700/50 hover:bg-gray-600 rounded-full text-white text-xs transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}