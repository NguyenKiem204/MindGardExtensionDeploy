import { useState, useEffect } from "react";
import { PEXELS_CONFIG } from "../config/pexels.js";
import { Lock } from "lucide-react";
import { authService } from "../services/authService";

export default function SceneModal({ isOpen, onClose, onSelectBackground }) {
  const [topTab, setTopTab] = useState("background"); // "background" or "weather"
  const [activeTab, setActiveTab] = useState("stills");
  const [motionScenes, setMotionScenes] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Reset to stills tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setTopTab("background");
      setActiveTab("stills");
      console.log('Modal opened, reset to stills tab');
    }
  }, [isOpen]);

  // Load motion videos from Pexels API
  useEffect(() => {
    const loadMotionVideos = async () => {
      if (motionScenes.length > 0) return; // Already loaded

      setLoading(true);
      try {
        console.log('🔧 Using PEXELS_CONFIG:');
        console.log('- PEXELS_CONFIG:', PEXELS_CONFIG);

        const apiKey = PEXELS_CONFIG.API_KEY;
        const videoIds = PEXELS_CONFIG.VIDEO_IDS;
        console.log('Loading videos from Pexels API...', { videoIds, apiKey: apiKey.substring(0, 10) + '...' });

        let results = [];

        // Try to load by video IDs first
        if (videoIds.length > 0) {
          console.log('🔍 Attempting to load videos by ID:', videoIds);

          results = await Promise.all(
            videoIds.map(async (id, index) => {
              console.log(`📹 Loading video ID ${id} (${index + 1}/${videoIds.length})`);

              try {
                const url = `https://api.pexels.com/videos/videos/${id}`;
                console.log(`🌐 Fetching URL: ${url}`);

                const response = await fetch(url, {
                  headers: {
                    Authorization: apiKey
                  },
                });

                console.log(`📊 Response status for ID ${id}:`, response.status, response.statusText);
                console.log(`📊 Response headers for ID ${id}:`, Object.fromEntries(response.headers.entries()));

                if (!response.ok) {
                  const errorText = await response.text();
                  console.error(`❌ HTTP error for ID ${id}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    errorText: errorText
                  });
                  throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const data = await response.json();
                console.log(`✅ Successfully loaded video ID ${id}:`, {
                  id: data.id,
                  duration: data.duration,
                  width: data.width,
                  height: data.height,
                  user: data.user?.name,
                  videoFilesCount: data.video_files?.length || 0,
                  hasImage: !!data.image
                });

                const file = data.video_files.find(f => f.quality === "hd") || data.video_files[0];
                console.log(`🎬 Video file for ID ${id}:`, {
                  quality: file?.quality,
                  fileType: file?.file_type,
                  width: file?.width,
                  height: file?.height,
                  hasLink: !!file?.link,
                  link: file?.link ? file.link.substring(0, 50) + '...' : 'NO LINK'
                });

                const result = {
                  id: `pexels-${id}`,
                  name: data.user?.name || `Motion ${index + 1}`,
                  thumbnail: data.image,
                  video: file?.link || '',
                  description: data.user?.name || `Focus motion video ${index + 1}`
                };

                console.log(`📋 Final result for ID ${id}:`, result);
                return result;

              } catch (error) {
                console.error(`❌ Error loading video ${id}:`, {
                  message: error.message,
                  stack: error.stack,
                  name: error.name
                });
                return null;
              }
            })
          );

          // Filter out null results
          const validResults = results.filter(result => result !== null);
          console.log(`📊 Video ID results: ${validResults.length}/${videoIds.length} successful`);
          results = validResults;
        }

        // If no videos loaded by ID, try searching by keywords
        if (results.length === 0) {
          console.log('No videos found by ID, searching by keywords...');
          const searchQueries = ['focus study', 'concentration', 'meditation', 'nature', 'rain', 'forest'];

          for (const query of searchQueries) {
            try {
              const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1`, {
                headers: {
                  Authorization: apiKey
                },
              });

              if (response.ok) {
                const data = await response.json();
                if (data.videos && data.videos.length > 0) {
                  const video = data.videos[0];
                  const file = video.video_files.find(f => f.quality === "hd") || video.video_files[0];

                  results.push({
                    id: `pexels-search-${video.id}`,
                    name: video.user?.name || `Focus ${query}`,
                    thumbnail: video.image,
                    video: file?.link || '',
                    description: `Focus motion: ${query}`
                  });

                  if (results.length >= 6) break; // Limit to 6 videos
                }
              }
            } catch (error) {
              console.error(`Error searching for ${query}:`, error);
            }
          }
        }

        // If still no videos, use fallback
        if (results.length === 0) {
          console.log('No videos found, using fallback');
          results = getFallbackMotionScenes();
        }

        setMotionScenes(results);
        console.log('Motion videos loaded:', results);
      } catch (error) {
        console.error('Error loading motion videos:', error);
        // Fallback to static videos
        setMotionScenes(getFallbackMotionScenes());
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && activeTab === "motion") {
      loadMotionVideos();
    }
  }, [isOpen, activeTab, motionScenes.length]);

  // Fallback motion scenes
  const getFallbackMotionScenes = () => [
    {
      id: "cafe-rain",
      name: "Cafe Rain",
      thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop&crop=center",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      description: "Cozy cafe with rain outside"
    },
    {
      id: "forest-sunlight",
      name: "Forest Sunlight",
      thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      description: "Peaceful forest with sunlight"
    },
    {
      id: "beach-shells",
      name: "Beach Shells",
      thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&crop=center",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      description: "Calm beach with shells"
    }
  ];


  const stillScenes = [
    {
      id: "pexels-417074",
      name: "Pexels Still 1",
      thumbnail: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      image: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
    },
    {
      id: "pexels-1743381",
      name: "Pexels Still 2",
      thumbnail: "https://images.pexels.com/photos/1743381/pexels-photo-1743381.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      image: "https://images.pexels.com/photos/1743381/pexels-photo-1743381.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
    },
    {
      id: "mountain-lake",
      name: "Mountain Lake",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center"
    },
    {
      id: "desert-dunes",
      name: "Desert Dunes",
      thumbnail: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&h=300&fit=crop&crop=center",
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1920&h=1080&fit=crop&crop=center"
    },
    {
      id: "autumn-forest",
      name: "Autumn Forest",
      thumbnail: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=300&fit=crop&crop=center",
      image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop&crop=center"
    },
    {
      id: "ocean-waves",
      name: "Ocean Waves",
      thumbnail: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop&crop=center",
      image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&h=1080&fit=crop&crop=center"
    },
    {
      id: "library-books",
      name: "Library Books",
      thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&h=1080&fit=crop&crop=center"
    },
    {
      id: "cozy-room",
      name: "Cozy Room",
      thumbnail: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&crop=center",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop&crop=center"
    }
  ];

  const handleSceneSelect = (scene) => {
    console.log('Selecting scene:', scene);
    if (activeTab === "motion") {
      onSelectBackground(scene.video, "video");
    } else {
      onSelectBackground(scene.image, "image");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-black/90 text-white rounded-2xl p-6 w-[800px] max-w-[90%] max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg sm:text-2xl font-bold">Set your focus scene</h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-white/60 hover:text-white text-xl cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Top Toggle: Background / Weather */}
          <div className="flex p-1 gap-1 mb-6 justify-center bg-white/10 w-fit mx-auto rounded-xl">
            <button
              onClick={() => setTopTab("background")}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${topTab === "background" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Background
            </button>
            <button
              onClick={() => setTopTab("weather")}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${topTab === "weather" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Weather
            </button>
          </div>

          {topTab === "background" && (
            <>
              {/* Background Sub-tabs */}
              <div className="flex mb-6 border-b border-white/10">
                {["motion", "stills", "personalize"].map((tab) => {
                  const isPremiumTab = ["stills", "personalize"].includes(tab);
                  const isLocked = isPremiumTab && !isPlusUser;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 sm:px-6 py-3 font-medium text-sm border-b-[2px] transition-colors capitalize flex items-center justify-center gap-2 ${activeTab === tab
                        ? "border-white text-white font-bold"
                        : "border-transparent text-white/50 hover:text-white font-medium"
                        }`}
                    >
                      {tab} {isLocked && <Lock className="w-3 h-3 text-orange-300" />}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scroll pb-2">
                {activeTab === "motion" && (
                  <div>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                          <p className="text-white/70">Đang tải motion videos...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {motionScenes.map((scene) => (
                          <div
                            key={scene.id}
                            onClick={() => handleSceneSelect(scene)}
                            className="group relative aspect-video rounded-lg cursor-pointer overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-gray-800"
                          >
                            <img
                              src={scene.thumbnail}
                              alt={scene.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute top-2 right-2">
                              <div className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "stills" && (
                  !isPlusUser ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-white text-xl font-bold">Mở khóa Hình nền Tĩnh Chất lượng Cao</h3>
                      <p className="text-gray-400 text-sm max-w-sm">
                        Truy cập kho hình nền độ phân giải siêu nét (1080p) không giới hạn.
                      </p>
                      <button
                        onClick={() => {
                          onClose();
                          window.dispatchEvent(new CustomEvent('mindgard_open_subscription'));
                        }}
                        className="px-6 py-2.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold rounded-lg text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
                      >
                        Nâng cấp MindGard Plus
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {stillScenes.map((scene) => (
                        <div
                          key={scene.id}
                          onClick={() => handleSceneSelect(scene)}
                          className="group relative aspect-video rounded-lg cursor-pointer overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-gray-800"
                        >
                          <img
                            src={scene.thumbnail}
                            alt={scene.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )
                )}

                {activeTab === "personalize" && (
                  !isPlusUser ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-white text-xl font-bold">Cá nhân hóa Góc Học Tập</h3>
                      <p className="text-gray-400 text-sm max-w-sm">
                        Tải lên ảnh và video của riêng bạn làm hình nền cho không gian tập trung.
                      </p>
                      <button
                        onClick={() => {
                          onClose();
                          window.dispatchEvent(new CustomEvent('mindgard_open_subscription'));
                        }}
                        className="px-6 py-2.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold rounded-lg text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
                      >
                        Nâng cấp MindGard Plus
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-white text-lg font-medium mb-2">Upload Your Own</h3>
                      <p className="text-gray-400 mb-6 text-sm">Upload your own background images or videos</p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors text-sm">
                          Upload Image
                        </button>
                        <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors text-sm">
                          Upload Video
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {topTab === "weather" && (
            <div className="flex-1 overflow-y-auto flex items-center justify-center text-white/50">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <p>Weather effects coming soon...</p>
              </div>
            </div>
          )}
        </div>
        <style>{`
          .custom-scroll::-webkit-scrollbar { width: 6px; }
          .custom-scroll::-webkit-scrollbar-track { background: transparent; }
          .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 6px; }
          .custom-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); }
        `}</style>
      </div>
    </div>
  );
}
