import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Cell
} from "recharts";
import { authService } from "../services/authService";
import { pomodoroService } from "../services/pomodoroService";

// Simple icon wrapper if needed, but let's use Lucide icons for consistency if possible
import {
    X,
    BarChart3,
    List,
    Gift,
    Clock,
    Flame,
    Check,
    Star,
    Globe,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Lock
} from "lucide-react";

export default function ActivitiesSummaryModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState("analytics");
    const [timeFilter, setTimeFilter] = useState("today");
    const [userData, setUserData] = useState(null);

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);

    const [aiReview, setAiReview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadUserData();
            loadSessions();
        }
    }, [isOpen, timeFilter]);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const res = await pomodoroService.getFocusSessions();
            // Backend returns ApiResponse<List<...>> so the actual list is in res.data
            setSessions(res?.data || []);
        } catch (err) {
            console.error("Failed to load sessions:", err);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const loadUserData = async () => {
        try {
            const auth = await authService.refreshMe();
            setUserData(auth.user);
        } catch (err) {
            console.error("Failed to load user data for summary:", err);
        }
    };

    const handleAnalyzeSessions = async () => {
        if (filteredSessions.length === 0) return;
        setIsAnalyzing(true);
        try {
            const payload = filteredSessions.map(s => ({
                date: s.createdAt || s.startTime || s.dateISO,
                duration: s.durationMin || s.duration,
                task: s.taskTitle || "N/A"
            }));
            const res = await pomodoroService.getAiReview(payload);
            if (res?.data) {
                setAiReview(res.data);
            }
        } catch (err) {
            console.error("Failed to analyze sessions:", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isOpen) return null;

    // Process data based on selected filter
    const now = new Date();
    // Use the timezone offset so "today" logic aligns with the user's local day
    const offset = now.getTimezoneOffset() * 60000;

    const isPlusUser = userData?.roles?.includes("ROLE_PLUS") || userData?.roles?.includes("ROLE_PREMIUM");

    const safeSessions = Array.isArray(sessions) ? sessions : [];
    const filteredSessions = safeSessions.filter(session => {
        // Assume session has a 'createdAt' or 'startTime' field
        const sessionDate = new Date(session.createdAt || session.startTime || session.dateISO);
        // Correct for timezone if the backend gives UTC
        const localSessionDate = new Date(sessionDate.getTime() - offset);
        const localNow = new Date(now.getTime() - offset);

        if (timeFilter === "today") {
            return localSessionDate.toDateString() === localNow.toDateString();
        } else if (timeFilter === "this week") {
            const firstDayOfWeek = new Date(localNow.setDate(localNow.getDate() - localNow.getDay()));
            return localSessionDate >= firstDayOfWeek;
        } else if (timeFilter === "this month") {
            return localSessionDate.getMonth() === localNow.getMonth() &&
                localSessionDate.getFullYear() === localNow.getFullYear();
        }
        return true;
    });

    // Calculate dynamic stats
    const totalSessionsFilter = filteredSessions.length;
    const focusedTimeFilter = filteredSessions.reduce((acc, curr) => acc + (curr.durationMin || curr.duration || 0), 0);
    const completedTasksFilter = filteredSessions.filter(s => s.taskTitle).length;

    // Prepare hourly data for "Today" filter, or aggregate differently if needed.
    // For simplicity, we stick to the hourly buckets for the current view.
    const calculatedHourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: i === 0 ? "12AM" : i === 4 ? "4AM" : i === 8 ? "8AM" : i === 12 ? "12PM" : i === 16 ? "4PM" : i === 20 ? "8PM" : "",
        hourIndex: i,
        minutes: 0,
    }));

    if (timeFilter === "today") {
        filteredSessions.forEach(session => {
            const sessionDate = new Date(session.createdAt || session.startTime || session.dateISO);
            // Convert to local time explicitly
            const localSessionDate = new Date(sessionDate.getTime() - offset);
            const hour = localSessionDate.getUTCHours(); // local relative to explicitly offset date
            if (hour >= 0 && hour < 24) {
                calculatedHourlyData[hour].minutes += (session.durationMin || session.duration || 0);
            }
        });
    }

    const stats = [
        {
            label: "Total Sessions",
            value: totalSessionsFilter,
            icon: <BarChart3 className="text-gray-400 w-5 h-5 sm:w-8 sm:h-8" />
        },
        {
            label: "Focused Time",
            value: `${focusedTimeFilter}m`,
            icon: <Clock className="text-gray-400 w-5 h-5 sm:w-8 sm:h-8" />
        },
        {
            label: "Tasks completed",
            value: completedTasksFilter,
            icon: <Check className="text-gray-400 w-5 h-5 sm:w-8 sm:h-8" />
        },
        {
            label: "Focus Score",
            value: "stars",
            icon: <TrendingUp className="text-gray-400 w-5 h-5 sm:w-8 sm:h-8" />
        },
    ];

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-black/90 text-white rounded-2xl p-6 w-[800px] max-w-[95%] max-h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg sm:text-2xl font-bold">Activities summary</h2>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {/* Tabs */}
                    <div className="flex border-b border-white/20 mb-6 sticky top-0 bg-black/90 z-10">
                        <button
                            onClick={() => setActiveTab("analytics")}
                            className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm sm:text-md font-medium border-b-2 transition-colors ${activeTab === "analytics" ? "border-white text-white" : "border-transparent text-white/50 hover:text-white"
                                }`}
                        >
                            <BarChart3 className={`w-5 h-5 ${activeTab === "analytics" ? "" : "hidden sm:block"}`} />
                            <span>Analytics</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("sessions")}
                            className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm sm:text-md font-medium border-b-2 transition-colors ${activeTab === "sessions" ? "border-white text-white" : "border-transparent text-white/50 hover:text-white"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <List className={`w-5 h-5 ${activeTab === "sessions" ? "" : "hidden sm:block"}`} />
                                Review Sessions
                                {!isPlusUser && <Lock className="w-3.5 h-3.5 text-yellow-500" />}
                            </span>
                        </button>
                    </div>

                    {activeTab === "analytics" ? (
                        <div className="space-y-6">
                            {/* Date Filters */}
                            <div className="flex items-center gap-4 text-sm mb-3">
                                {["Today", "This week", "This month"].map((filter) => {
                                    const isPremiumFilter = filter === "This week" || filter === "This month";
                                    const isLocked = isPremiumFilter && !isPlusUser;

                                    return (
                                        <button
                                            key={filter}
                                            onClick={() => {
                                                if (isLocked) {
                                                    window.dispatchEvent(new Event('mindgard_open_subscription'));
                                                    return;
                                                }
                                                setTimeFilter(filter.toLowerCase())
                                            }}
                                            className={`flex-1 text-center cursor-pointer px-3 py-1.5 rounded-md flex items-center justify-center gap-2 transition-all ${timeFilter === filter.toLowerCase() ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200"
                                                } ${isLocked ? "opacity-70 hover:opacity-100" : ""}`}
                                        >
                                            <span>{filter}</span>
                                            {isLocked ? (
                                                <Lock className="text-yellow-500 w-3 h-3" />
                                            ) : (
                                                isPremiumFilter && <Gift className="text-white w-3 h-3" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-6">
                                {stats.map((stat, idx) => (
                                    <div key={idx} className="w-full p-4 rounded-lg border border-white/20 bg-white/5 flex flex-col justify-center gap-2">
                                        <div className="flex items-center gap-2 sm:flex-col sm:items-start">
                                            {stat.icon}
                                            <div className="text-gray-400 text-[10px] sm:text-xs mb-1 mt-1">{stat.label}</div>
                                        </div>
                                        {stat.value === "stars" ? (
                                            <div className="flex gap-1 items-center">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star key={s} className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-500" fill="none" />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-lg sm:text-xl font-semibold text-white">{stat.value}</div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Chart Section */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 mb-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center justify-center gap-1 text-gray-200">
                                            <button className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <div className="px-2 py-0 rounded-full">
                                                <span className="text-sm font-medium text-white">Mar 06</span>
                                            </div>
                                            <button className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Total Time:</span>
                                            <span className="text-white ml-2 font-medium">{focusedTimeFilter}m</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-48 sm:h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={calculatedHourlyData}>
                                            <XAxis
                                                dataKey="hour"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9ca3af', fontSize: 10 }}
                                            />
                                            <YAxis
                                                hide
                                                domain={[0, 'auto']}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{
                                                    backgroundColor: '#111',
                                                    border: '1px solid #333',
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value) => [`${value} min`, "Focused Time"]}
                                            />
                                            <Bar
                                                dataKey="minutes"
                                                radius={[4, 4, 0, 0]}
                                                minPointSize={2}
                                            >
                                                {calculatedHourlyData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.minutes > 0 ? '#3b82f6' : '#333'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 p-2 pb-6">
                            {/* AI Review Section */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 relative z-10 gap-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Star className="w-6 h-6 text-yellow-500" /> AI Performance Review
                                    </h3>
                                    <button
                                        onClick={handleAnalyzeSessions}
                                        disabled={isAnalyzing || filteredSessions.length === 0}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 font-medium text-sm flex items-center gap-2"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Analyzing...
                                            </>
                                        ) : "Analyze with AI"}
                                    </button>
                                </div>

                                {aiReview ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                        <div className="bg-black/50 border border-white/5 rounded-xl p-5 flex flex-col gap-2 transition-transform hover:scale-[1.02]">
                                            <span className="text-white/50 text-sm font-medium">Performance Score</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-4xl font-bold ${aiReview.performanceScore >= 80 ? 'text-green-400' : aiReview.performanceScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {aiReview.performanceScore}
                                                </span>
                                                <span className="text-white/40 font-medium">/100</span>
                                            </div>
                                        </div>
                                        <div className="bg-black/50 border border-white/5 rounded-xl p-5 flex flex-col gap-2 transition-transform hover:scale-[1.02]">
                                            <span className="text-white/50 text-sm font-medium">Peak Productivity Time</span>
                                            <span className="text-2xl font-bold text-blue-400 mt-1">{aiReview.peakTime}</span>
                                        </div>
                                        <div className="sm:col-span-2 bg-black/50 border border-white/5 rounded-xl p-5 mt-2 transition-transform hover:scale-[1.01]">
                                            <span className="text-white/50 text-sm font-medium block mb-3 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> AI Feedback
                                            </span>
                                            <p className="text-white/90 text-md leading-relaxed">{aiReview.feedback}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 px-4 bg-black/30 rounded-xl border border-white/5 relative z-10">
                                        <p className="text-white/50 text-sm">
                                            {filteredSessions.length > 0
                                                ? "Click the button above to get an AI-powered review of your study habits within this time frame."
                                                : "No sessions available to analyze in this time frame."}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Session History List */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                                    <List className="w-5 h-5 text-gray-400" /> Session History
                                </h3>
                                {filteredSessions.length > 0 ? (
                                    <div className="space-y-3 relative z-10 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {filteredSessions.map((session, i) => {
                                            const sDate = new Date(session.createdAt || session.startTime || session.dateISO);
                                            return (
                                                <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-black/40 border border-white/5 hover:bg-black/60 transition-colors">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-white/90">{session.taskTitle || "Focused Session"}</span>
                                                        <span className="text-xs text-white/40">{sDate.toLocaleDateString()} at {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold">
                                                        {(session.durationMin || session.duration || 0)} min
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-white/40 text-sm bg-black/30 rounded-xl border border-white/5 relative z-10">
                                        No recent sessions found for this timeframe.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
        </div>,
        document.body
    );
}
