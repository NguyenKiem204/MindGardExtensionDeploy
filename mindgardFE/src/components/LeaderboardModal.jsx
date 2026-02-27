import { useState, useEffect } from "react";
import { X, Globe, Users, ChevronLeft, ChevronRight, Info, Clock, Gift, Loader2, ArrowUp, ArrowDown, Minus } from "lucide-react";
import LeaderProfileModal from "./LeaderProfileModal";
import { leaderboardService } from "../services/leaderboardService";
import { api } from "../utils/api";

export default function LeaderboardModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("global"); // 'global' | 'friends'
  const [activeFilter, setActiveFilter] = useState("daily"); // 'daily' | 'weekly' | 'monthly'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load leaderboard data
  useEffect(() => {
    if (!isOpen) return;
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab, activeFilter, currentDate]);

  const loadLeaderboard = async () => {
    console.log("[LeaderboardModal] loadLeaderboard() called", {
      activeTab,
      activeFilter,
      currentDate: currentDate.toISOString(),
    });
    setLoading(true);
    setError("");
    try {
      console.log("[LeaderboardModal] Calling API...");
      const entries = await leaderboardService.getRealLeaderboard(
        activeFilter,
        currentDate,
        activeTab
      );
      console.log("[LeaderboardModal] API response:", {
        entriesCount: entries?.length || 0,
        entries: entries,
      });
      setData(entries || []);
    } catch (err) {
      console.error("[LeaderboardModal] Error loading leaderboard:", {
        error: err,
        response: err?.response?.data,
        status: err?.response?.status,
        message: err?.message,
      });
      setError(err?.response?.data?.message || err?.message || "Failed to load leaderboard");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Mock dataset for Global/Friends x Daily/Weekly/Monthly (fallback)
  const MOCK = {
    global: {
      daily: [
        { rank: 1, name: "PH Ri", country: "PH", avatar: "R", time: "6h 40m", gifts: 4 },
        { rank: 2, name: "IN Rosie", country: "IN", avatar: "R", time: "6h 36m", gifts: 0, description: "IIT JEE aspirant", trend: "up" },
        { rank: 3, name: "BD rin", country: "BD", avatar: "R", time: "6h 20m", gifts: 0, trend: "up" },
        { rank: 4, name: "Anonymous", country: "", avatar: "A", time: "5h 30m", gifts: 1 },
        { rank: 5, name: "TW Amaya", country: "TW", avatar: "A", time: "5h 0m", gifts: 3, description: "preparing for university entering exam", trend: "up" },
        { rank: 6, name: "VN Khánh", country: "VN", avatar: "K", time: "4h 16m", gifts: 0, description: "My blog: khanhdaily.site Keep it up" },
        { rank: 7, name: "IN Anish Jha", country: "IN", avatar: "A", time: "4h 0m", gifts: 0, description: "THE LAST CHANCE", trend: "up" },
        { rank: 8, name: "VN Mai Dang Huy", country: "VN", avatar: "M", time: "3h 45m", gifts: 0, trend: "up" },
        { rank: 9, name: "VN Bảo Ngọc ^^", country: "VN", avatar: "B", time: "3h 30m", gifts: 0 },
      ],
      weekly: [
        { rank: 1, name: "PH Ri", country: "PH", avatar: "R", time: "42h 10m", gifts: 9 },
        { rank: 2, name: "IN Rosie", country: "IN", avatar: "R", time: "40h 25m", gifts: 3, trend: "up" },
        { rank: 3, name: "BD rin", country: "BD", avatar: "R", time: "39h 40m", gifts: 2 },
        { rank: 4, name: "Anonymous", avatar: "A", time: "35h 00m", gifts: 1 },
        { rank: 5, name: "TW Amaya", country: "TW", avatar: "A", time: "33h 15m", gifts: 0 },
      ],
      monthly: [
        { rank: 1, name: "PH Ri", country: "PH", avatar: "R", time: "168h 00m", gifts: 20 },
        { rank: 2, name: "IN Rosie", country: "IN", avatar: "R", time: "160h 35m", gifts: 11 },
        { rank: 3, name: "BD rin", country: "BD", avatar: "R", time: "158h 20m", gifts: 7 },
        { rank: 4, name: "Anonymous", avatar: "A", time: "150h 10m", gifts: 5 },
        { rank: 5, name: "TW Amaya", country: "TW", avatar: "A", time: "144h 55m", gifts: 4 },
      ],
    },
    friends: {
      daily: [
        { rank: 1, name: "You", country: "VN", avatar: "Y", time: "5h 15m", gifts: 1, trend: "up" },
        { rank: 2, name: "An", country: "VN", avatar: "A", time: "4h 50m", gifts: 0 },
        { rank: 3, name: "Huy", country: "VN", avatar: "H", time: "3h 20m", gifts: 0 },
        { rank: 4, name: "Linh", country: "VN", avatar: "L", time: "2h 45m", gifts: 0 },
        { rank: 5, name: "Minh", country: "VN", avatar: "M", time: "1h 10m", gifts: 0 },
      ],
      weekly: [
        { rank: 1, name: "You", country: "VN", avatar: "Y", time: "30h 40m", gifts: 3 },
        { rank: 2, name: "An", country: "VN", avatar: "A", time: "27h 10m", gifts: 2 },
        { rank: 3, name: "Huy", country: "VN", avatar: "H", time: "22h 05m", gifts: 0 },
        { rank: 4, name: "Linh", country: "VN", avatar: "L", time: "19h 20m", gifts: 0 },
        { rank: 5, name: "Minh", country: "VN", avatar: "M", time: "10h 15m", gifts: 0 },
      ],
      monthly: [
        { rank: 1, name: "You", country: "VN", avatar: "Y", time: "120h 00m", gifts: 8 },
        { rank: 2, name: "An", country: "VN", avatar: "A", time: "110h 45m", gifts: 5 },
        { rank: 3, name: "Huy", country: "VN", avatar: "H", time: "95h 20m", gifts: 2 },
        { rank: 4, name: "Linh", country: "VN", avatar: "L", time: "80h 10m", gifts: 1 },
        { rank: 5, name: "Minh", country: "VN", avatar: "M", time: "52h 30m", gifts: 0 },
      ],
    },
  };

  const [profileUser, setProfileUser] = useState(null);

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatDate = (date) => {
    if (activeFilter === 'daily') {
      const options = { day: "2-digit", month: "short", year: "numeric" };
      return date.toLocaleDateString("en-GB", options);
    }
    if (activeFilter === 'weekly') {
      const d = new Date(date);
      const day = d.getDay(); // 0-6
      const diffToMonday = (day + 6) % 7; // Monday start
      const start = new Date(d); start.setDate(d.getDate() - diffToMonday);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      const fmt = (x) => x.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return `${fmt(start)} - ${fmt(end)}`;
    }
    // monthly
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const changeDate = (direction) => {
    const newDate = new Date(currentDate);
    if (activeFilter === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
    } else if (activeFilter === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    }
    setCurrentDate(newDate);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div 
        className={`absolute inset-0 backdrop-blur-sm transition-all ${
          profileUser ? 'bg-black/20 pointer-events-none' : 'bg-black/60'
        }`} 
        onClick={profileUser ? undefined : onClose} 
      />
      <div className="relative w-full max-w-4xl bg-black/30 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("global")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "global"
                    ? "bg-white/20 text-white border-b-2 border-white"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                <Globe className="w-4 h-4" />
                Global
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "friends"
                    ? "bg-white/20 text-white border-b-2 border-white"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                <Users className="w-4 h-4" />
                Friends
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeDate("prev")}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white text-sm font-medium min-w-[120px] text-center">
                {formatDate(currentDate)}
              </span>
              <button
                onClick={() => changeDate("next")}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Info Icon */}
            <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Info className="w-4 h-4 text-white/80" />
            </button>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {["daily", "weekly", "monthly"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                    activeFilter === filter
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>

        {/* Leaderboard Content */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : error ? (
            <div className="text-red-300 text-sm text-center py-12">{error}</div>
          ) : data.length === 0 ? (
            <div className="text-white/60 text-sm text-center py-12">No data available</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 text-xs font-medium uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-4 text-white/60 text-xs font-medium uppercase tracking-wider">User</th>
                  <th className="text-center py-3 px-4 text-white/60 text-xs font-medium uppercase tracking-wider">
                    <Clock className="w-4 h-4 inline" />
                  </th>
                  <th className="text-center py-3 px-4 text-white/60 text-xs font-medium uppercase tracking-wider">
                    <Gift className="w-4 h-4 inline" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => {
                  const avatarValue = entry.avatarUrl;
                  const displayName = entry.displayName || entry.username || "User";
                  const avatarDisplay = typeof avatarValue === "string" && (avatarValue.startsWith("http") || avatarValue.startsWith("data:") || avatarValue.startsWith("/"))
                    ? avatarValue
                    : String(displayName).charAt(0).toUpperCase();
                  return (
                    <tr
                      key={entry.userId}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={async () => {
                        // Load full profile
                        try {
                          const res = await api.get(`/users/${entry.userId}/public-profile`);
                          if (res.data?.success) {
                            setProfileUser(res.data.data);
                          }
                        } catch (err) {
                          console.warn("Failed to load profile:", err);
                        }
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{entry.rank}</span>
                          {entry.trend && (
                            <span className="flex items-center" title={
                              entry.previousRank 
                                ? `Previous rank: ${entry.previousRank}` 
                                : "New entry"
                            }>
                              {entry.trend === "up" && (
                                <ArrowUp className="w-4 h-4 text-green-400" />
                              )}
                              {entry.trend === "down" && (
                                <ArrowDown className="w-4 h-4 text-red-400" />
                              )}
                              {entry.trend === "stable" && (
                                <Minus className="w-4 h-4 text-gray-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 overflow-hidden flex items-center justify-center text-white font-semibold text-sm">
                            {typeof avatarValue === "string" && (avatarValue.startsWith("http") || avatarValue.startsWith("data:") || avatarValue.startsWith("/")) ? (
                              <img src={avatarValue} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{avatarDisplay}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium text-sm">{displayName}</span>
                              {entry.level && (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-white/10 text-white/80">LV.{entry.level}</span>
                              )}
                            </div>
                            {entry.bio && (
                              <div className="text-white/50 text-xs mt-0.5 line-clamp-1">{entry.bio}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-white text-sm">{formatTime(entry.totalMinutes || 0)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-white/30 text-sm">-</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Custom Scrollbar Styling */}
        <style>{`
          .custom-scroll::-webkit-scrollbar{width:8px;height:8px}
          .custom-scroll::-webkit-scrollbar-track{background:transparent}
          .custom-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:8px}
          .custom-scroll:hover::-webkit-scrollbar-thumb{background:rgba(255,255,255,.3)}
          .custom-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}
        `}</style>
      </div>
      {profileUser && (
        <LeaderProfileModal
          isOpen={!!profileUser}
          onClose={() => setProfileUser(null)}
          user={profileUser}
          year={new Date().getFullYear()}
          onYearChange={() => {}}
        />
      )}
    </div>
  );
}

