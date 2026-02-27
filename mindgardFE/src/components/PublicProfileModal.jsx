import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { api } from "../utils/api.js";
import LeaderProfileModal from "./LeaderProfileModal";

export default function PublicProfileModal({ isOpen, onClose, userId }) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState("");
  const [friendBusy, setFriendBusy] = useState(false);

  // Listen for profile update events
  useEffect(() => {
    const handler = () => {
      if (isOpen && userId) loadProfile();
    };
    window.addEventListener("mindgard_profile_updated", handler);
    return () => window.removeEventListener("mindgard_profile_updated", handler);
  }, [isOpen, userId]);

  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/users/${userId}/public-profile?year=${year}`);
      if (res.data?.success) setProfile(res.data.data);
      else setError(res.data?.message || "Failed to load profile");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId, year]);

  const copyProfileLink = () => {
    const link = `${window.location.origin}/profile/${userId}`;
    navigator.clipboard.writeText(link);
  };

  const onFriendClick = async (u) => {
    if (!u) return;
    const status = u.friendRequestStatus || "NONE";
    const requestId = u.friendRequestId;
    setFriendBusy(true);
    try {
      if (status === "NONE") {
        await api.post(`/friends/requests/${u.id}`);
      } else if (status === "SENT" && requestId) {
        await api.post(`/friends/requests/${requestId}/cancel`);
      } else if (status === "RECEIVED" && requestId) {
        await api.post(`/friends/requests/${requestId}/accept`);
      } else if (status === "ACCEPTED") {
        await api.delete(`/friends/${u.id}`);
      }
      await loadProfile();
    } finally {
      setFriendBusy(false);
    }
  };

  if (!isOpen) return null;

  // Show lightweight loading/error shell until profile loads
  if (loading && !profile) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 backdrop-blur-md bg-black/70">
        <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-2xl p-8">
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-300 hover:text-white transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (error && !profile) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 backdrop-blur-md bg-black/70">
        <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-2xl p-8">
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-300 hover:text-white transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <LeaderProfileModal
      isOpen={isOpen && !!profile}
      onClose={onClose}
      user={profile}
      year={year}
      onYearChange={setYear}
      onFriendClick={onFriendClick}
      friendBusy={friendBusy}
      onCopyLink={copyProfileLink}
      onProfileUpdated={loadProfile}
    />
  );
}
