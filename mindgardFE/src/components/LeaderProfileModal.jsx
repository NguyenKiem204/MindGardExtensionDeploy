import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, UserPlus, Gift, Copy, Edit2, Save, Loader2 } from "lucide-react";
import { userService } from "../services/userService";
import { authService } from "../services/authService";

export default function LeaderProfileModal({ isOpen, onClose, user, year: controlledYear, onYearChange, onFriendClick, friendBusy, onCopyLink, onProfileUpdated }) {
  // GitHub-like heatmap data (weeks x 7 days)
  const [yearInternal, setYearInternal] = useState(new Date().getFullYear());
  const year = controlledYear ?? yearInternal;
  const setYear = (next) => {
    if (onYearChange) onYearChange(next);
    else setYearInternal(next);
  };
  const [tooltip, setTooltip] = useState(null); // {left, top, dateStr, minutes}
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", avatarUrl: "", bio: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const displayName = user?.displayName || user?.name || user?.username || "User";
  const avatarValue = user?.avatarUrl || user?.avatar;
  const level = Number(user?.level ?? 20);
  const currentXP = Number(user?.currentXP ?? 5647);
  const xpToNextLevel = Math.max(1, Number(user?.xpToNextLevel ?? 5727));
  const remainingXP = Number(user?.remainingXPToNextLevel ?? Math.max(0, xpToNextLevel - currentXP));
  const xpPct = Math.min(100, Math.max(0, (currentXP / xpToNextLevel) * 100));

  const streakDays = Number(user?.currentStreakDays ?? 1);
  const totalStudyMinutes = Number(user?.totalStudyDurationMinutes ?? (419 * 60 + 26));
  const pomodorosCompleted = Number(user?.pomodorosCompletedCount ?? 533);
  const pomodorosThisWeek = Number(user?.pomodorosThisWeekCount ?? 8);
  const dailyAvgMinutes = Number(user?.dailyAverageStudyDurationLast30DaysMinutes ?? (5 * 60 + 40));
  const giftsSent = Number(user?.giftsSentCount ?? 9);

  const stats = [
    { title: 'Current Streak', value: String(streakDays), sub: streakDays === 1 ? 'DAY' : 'DAYS', color: 'from-orange-500/30 to-orange-600/30' },
    { title: 'Total hours', value: formatMinutes(totalStudyMinutes), sub: '', color: 'from-emerald-500/30 to-emerald-600/30' },
    { title: 'Pomodoros Completed', value: String(pomodorosCompleted), sub: '', color: 'from-violet-500/30 to-violet-600/30' },
    { title: 'This Week', value: String(pomodorosThisWeek), sub: 'POMODOROS', color: 'from-sky-500/30 to-sky-600/30' },
    { title: 'Daily average', value: formatMinutes(dailyAvgMinutes), sub: 'LAST 30 DAYS', color: 'from-cyan-500/30 to-cyan-600/30' },
    { title: 'Gifts Sent', value: String(giftsSent), sub: '', color: 'from-rose-500/30 to-rose-600/30' },
  ];

  const relationship = user?.friendRequestStatus || "NONE";
  const isSelf = relationship === "SELF";
  const friendLabel =
    relationship === "ACCEPTED" ? "Unfriend" :
      relationship === "SENT" ? "Cancel request" :
        relationship === "RECEIVED" ? "Accept request" :
          relationship === "SELF" ? "You" : "Add friend";

  const heatmap = useMemo(() => buildHeatmap(year, user?.studyActivityData), [year, user?.studyActivityData]);
  const gifts = Array.from({ length: 4 }, (_, i) => ({ id: i + 1, label: '1⭐' }));

  // Initialize edit form when user changes or editing starts
  React.useEffect(() => {
    if (isEditing && user) {
      const cached = authService.getCachedAuth();
      const currentUser = cached?.user;
      setEditForm({
        firstName: currentUser?.firstName || user?.firstName || "",
        lastName: currentUser?.lastName || user?.lastName || "",
        avatarUrl: user?.avatarUrl || "",
        bio: user?.bio || "",
      });
    }
  }, [isEditing, user]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditError("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    setEditLoading(true);
    setEditError("");
    try {
      await userService.updateProfile(editForm);
      // Refresh auth cache
      await authService.refreshMe();
      setIsEditing(false);
      if (onProfileUpdated) onProfileUpdated();
      // Reload profile if callback provided
      if (onCopyLink) {
        // Trigger reload by calling parent's reload
        window.dispatchEvent(new CustomEvent("mindgard_profile_updated"));
      }
    } catch (err) {
      setEditError(err?.response?.data?.message || err?.message || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-black/30 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl mx-4 h-[70vh] max-h-[70vh] flex flex-col pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex items-center justify-center text-white font-semibold">
              {typeof avatarValue === "string" && (avatarValue.startsWith("http") || avatarValue.startsWith("data:") || avatarValue.startsWith("/")) ? (
                <img src={avatarValue} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{(typeof avatarValue === "string" && avatarValue.length <= 3 ? avatarValue : String(displayName).charAt(0).toUpperCase())}</span>
              )}
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-3">
                  {editError && (
                    <div className="text-red-300 text-xs bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
                      {editError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="First name"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Avatar URL"
                    value={editForm.avatarUrl}
                    onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Bio (max 500 characters)"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value.slice(0, 500) })}
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="text-xs text-white/50 text-right">{editForm.bio.length}/500</div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white text-lg font-semibold">{displayName}</h3>
                    {user?.country && <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/80">{user.country}</span>}
                  </div>
                  {user?.bio && (
                    <div className="text-sm text-white/70 mt-1 max-w-md">{user.bio}</div>
                  )}
                  <div className="text-xs text-white/60 mt-1">LV. {level}</div>
                  {/* Progress bar */}
                  <div className="mt-2 w-72 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${xpPct}%` }} />
                  </div>
                  <div className="text-[10px] text-white/50 mt-1">{currentXP} / {xpToNextLevel} XP • {remainingXP} XP to next</div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSelf && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4"/> Edit Profile
              </button>
            )}
            {isSelf && isEditing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-white text-sm flex items-center gap-2 disabled:opacity-60"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={editLoading}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
                >
                  Cancel
                </button>
              </>
            )}
            {!isSelf && (
              <>
                <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4"/> Send Gift
                </button>
                <button
                  onClick={() => onFriendClick && onFriendClick(user)}
                  disabled={!onFriendClick || friendBusy}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  title={relationship === "RECEIVED" ? "Accept request" : relationship === "SENT" ? "Cancel request" : relationship === "ACCEPTED" ? "Unfriend" : "Add friend"}
                >
                  <UserPlus className="w-4 h-4"/> {friendBusy ? "..." : friendLabel}
                </button>
              </>
            )}
            <button
              onClick={onCopyLink || (() => navigator.clipboard?.writeText?.(window.location.href))}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-2"
            >
              <Copy className="w-4 h-4"/> Copy link
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <X className="w-5 h-5 text-white/80"/>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-6 space-y-8" style={{ touchAction: 'pan-y' }}>
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 bg-gradient-to-br ${s.color} border border-white/10`}>
                <div className="text-white/80 text-sm">{s.title}</div>
                <div className="text-white text-2xl font-bold mt-1">{s.value}</div>
                {s.sub && <div className="text-white/60 text-xs mt-1">{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Activity heatmap (Month-based) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Study Activity</h4>
              <div className="flex items-center gap-2 text-white/80">
                <button onClick={()=>setYear(year-1)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">Prev</button>
                <span className="min-w-[64px] text-center text-sm">{year}</span>
                <button onClick={()=>setYear(year+1)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">Next</button>
              </div>
            </div>
            <div className="relative overflow-auto custom-scroll p-4 rounded-lg border border-white/10 bg-white/5">
              <div className="flex flex-col gap-6">
                {/* Row 1: Jan - Jun */}
                <div className="flex gap-6">
                  {heatmap.months.slice(0,6).map((month, mi) => (
                    <div key={mi} className="flex flex-col">
                      {/* Month label */}
                      <div className="text-center text-[10px] text-white/60 select-none mb-1 h-3">
                        {month.label}
                      </div>
                      {/* Rows = weeks (dọc), Columns = days (ngang: Sun→Sat) */}
                      <div className="flex flex-col gap-1">
                        {month.rows.map((week, wi) => (
                          <div key={wi} className="flex gap-1">
                            {week.map((cell, ci) => (
                              <div
                                key={`${mi}-w${wi}-d${ci}`}
                                className="w-3 h-3 rounded-[2px] flex-shrink-0"
                                style={{ backgroundColor: cell ? minutesToColor(cell.minutes) : '#161b22' }}
                                onMouseEnter={(e)=>{
                                  if (!cell) return;
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTooltip({
                                    left: rect.left + window.scrollX + 8,
                                    top: rect.top + window.scrollY - 8,
                                    dateStr: cell.date.toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }),
                                    minutes: cell.minutes,
                                  });
                                }}
                                onMouseLeave={()=> setTooltip(null)}
                                title={cell ? `${formatMinutes(cell.minutes)} • ${cell.date.toDateString()}` : ''}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Row 2: Jul - Dec */}
                <div className="flex gap-6">
                  {heatmap.months.slice(6,12).map((month, mi) => (
                    <div key={mi+6} className="flex flex-col">
                      {/* Month label */}
                      <div className="text-center text-[10px] text-white/60 select-none mb-1 h-3">
                        {month.label}
                      </div>
                      {/* Rows = weeks (dọc), Columns = days (ngang: Sun→Sat) */}
                      <div className="flex flex-col gap-1">
                        {month.rows.map((week, wi) => (
                          <div key={wi} className="flex gap-1">
                            {week.map((cell, ci) => (
                              <div
                                key={`${mi+6}-w${wi}-d${ci}`}
                                className="w-3 h-3 rounded-[2px] flex-shrink-0"
                                style={{ backgroundColor: cell ? minutesToColor(cell.minutes) : '#161b22' }}
                                onMouseEnter={(e)=>{
                                  if (!cell) return;
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTooltip({
                                    left: rect.left + window.scrollX + 8,
                                    top: rect.top + window.scrollY - 8,
                                    dateStr: cell.date.toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }),
                                    minutes: cell.minutes,
                                  });
                                }}
                                onMouseLeave={()=> setTooltip(null)}
                                title={cell ? `${formatMinutes(cell.minutes)} • ${cell.date.toDateString()}` : ''}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {tooltip && (
                <div
                  className="fixed z-[110] px-2 py-1 rounded bg-black/80 text-white text-xs border border-white/10 pointer-events-none whitespace-nowrap"
                  style={{ left: tooltip.left, top: tooltip.top }}
                >
                  {formatMinutes(tooltip.minutes)} · {tooltip.dateStr}
                </div>
              )}
            </div>
          </div>

          {/* Gifts received */}
          <div>
            <h4 className="text-white font-semibold mb-3">Gifts Received</h4>
            <div className="flex flex-wrap gap-4 items-center">
              {gifts.map(g => (
                <div key={g.id} className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">{g.label}</span>
                  <span className="text-sm">🌱</span>
                </div>
              ))}
              <div className="ml-auto text-white/80 text-sm">Total: 60</div>
            </div>
          </div>
        </div>

        {/* Local scroll style - hidden scrollbar but still scrollable */}
        <style>{`
          .custom-scroll {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            touch-action: pan-y !important;
          }
          .custom-scroll::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .custom-scroll::-webkit-scrollbar-track {
            display: none !important;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            display: none !important;
          }
        `}</style>
      </div>
    </div>
    ,
    document.body
  );
}

function minutesToColor(min){
  if (!min || min === 0) return '#161b22'; // Very dark gray (no activity)
  if (min < 15) return '#0e4429'; // Dark green (low activity)
  if (min < 45) return '#006d32'; // Medium green
  if (min < 120) return '#26a641';
  return '#39d353';
}

function formatMinutes(min){
  const m = Math.max(0, Math.floor(min||0));
  const h = Math.floor(m/60);
  const mm = m % 60;
  if (h) return `${h}h ${mm}m`;
  return `${mm}m`;
}

function buildHeatmap(year, studyActivityData){
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = [];
  let maxRows = 0;
  const map = studyActivityData || {};
  const hasRealData = map && typeof map === "object" && Object.keys(map).length > 0;

  // Build each month
  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0=Sun, 6=Sat
    
    // Create rows (weeks) for this month
    const rows = [];
    let currentRow = [];
    
    // Fill empty cells at the start of first week
    for (let i = 0; i < startDayOfWeek; i++) {
      currentRow.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, m, day);
      const key = `${year}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const minutes = hasRealData ? Number(map[key] || 0) : (((m * 13 + day) % 5) * 30);
      currentRow.push({ date, minutes });
      
      // Start new row every Sunday (day 0)
      if (date.getDay() === 6) { // Saturday, so next is Sunday
        rows.push(currentRow);
        currentRow = [];
      }
    }
    
    // Fill remaining empty cells in last row
    if (currentRow.length > 0) {
      while (currentRow.length < 7) {
        currentRow.push(null);
      }
      rows.push(currentRow);
    }
    
    maxRows = Math.max(maxRows, rows.length);
    months.push({ label: monthNames[m], rows });
  }

  return { months, maxRows };
}