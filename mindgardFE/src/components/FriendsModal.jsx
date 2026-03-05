import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, X as XIcon, UserMinus, Loader2 } from "lucide-react";
import { api } from "../utils/api.js";

function Avatar({ user }) {
  const initial = user?.displayName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || "?";
  return (
    <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.displayName || user.username} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-semibold text-sm">{initial}</span>
      )}
    </div>
  );
}

export default function FriendsModal({ isOpen, onClose }) {
  const [tab, setTab] = useState("friends"); // friends | incoming | outgoing
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [error, setError] = useState(null);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, inc, out] = await Promise.all([
        api.get("/friends"),
        api.get("/friends/requests/incoming"),
        api.get("/friends/requests/outgoing"),
      ]);
      setFriends(f.data?.data || []);
      setIncoming(inc.data?.data || []);
      setOutgoing(out.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadAll();
  }, [isOpen]);

  const accept = async (requestId) => {
    await api.post(`/friends/requests/${requestId}/accept`);
    await loadAll();
  };

  const decline = async (requestId) => {
    await api.post(`/friends/requests/${requestId}/decline`);
    await loadAll();
  };

  const cancel = async (requestId) => {
    await api.post(`/friends/requests/${requestId}/cancel`);
    await loadAll();
  };

  const unfriend = async (otherUserId) => {
    await api.delete(`/friends/${otherUserId}`);
    await loadAll();
  };

  const invite = async () => {
    const q = inviteQuery.trim();
    if (!q) return;
    setInviteBusy(true);
    setInviteMsg("");
    try {
      await api.post("/friends/requests/invite", { identifier: q });
      setInviteQuery("");
      setTab("outgoing");
      setInviteMsg("Friend request sent.");
      await loadAll();
    } catch (e) {
      setInviteMsg(e?.response?.data?.message || e?.message || "Failed to send request");
    } finally {
      setInviteBusy(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 backdrop-blur-md bg-black/70" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-300 hover:text-white transition-colors" aria-label="Close">
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Friends</h2>
          </div>

          {/* Invite by username/email */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                value={inviteQuery}
                onChange={(e) => setInviteQuery(e.target.value)}
                placeholder="Invite by username or email"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/30 focus:outline-none"
              />
              <button
                onClick={invite}
                disabled={inviteBusy || !inviteQuery.trim()}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {inviteBusy ? "Sending..." : "Send"}
              </button>
            </div>
            {inviteMsg && <div className="mt-2 text-xs text-gray-300">{inviteMsg}</div>}
          </div>

          <div className="flex gap-2 mb-4">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm border ${tab === "friends" ? "bg-white/15 border-white/20 text-white" : "bg-transparent border-white/10 text-gray-300 hover:bg-white/5"}`}
              onClick={() => setTab("friends")}
            >
              Friends ({friends.length})
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm border ${tab === "incoming" ? "bg-white/15 border-white/20 text-white" : "bg-transparent border-white/10 text-gray-300 hover:bg-white/5"}`}
              onClick={() => setTab("incoming")}
            >
              Incoming ({incoming.length})
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm border ${tab === "outgoing" ? "bg-white/15 border-white/20 text-white" : "bg-transparent border-white/10 text-gray-300 hover:bg-white/5"}`}
              onClick={() => setTab("outgoing")}
            >
              Outgoing ({outgoing.length})
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {tab === "friends" &&
                (friends.length ? friends : [{ __empty: true }]).map((u, idx) =>
                  u.__empty ? (
                    <div key={idx} className="text-gray-400 text-sm py-8 text-center">No friends yet.</div>
                  ) : (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                      <Avatar user={u} />
                      <div className="flex-1">
                        <div className="text-white font-medium">{u.displayName || u.username}</div>
                        <div className="text-xs text-gray-400">LV. {u.level ?? 1}</div>
                      </div>
                      <button
                        onClick={() => unfriend(u.id)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                        title="Unfriend"
                      >
                        <UserMinus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )
                )}

              {tab === "incoming" &&
                (incoming.length ? incoming : [{ __empty: true }]).map((r, idx) =>
                  r.__empty ? (
                    <div key={idx} className="text-gray-400 text-sm py-8 text-center">No incoming requests.</div>
                  ) : (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                      <Avatar user={r.requester} />
                      <div className="flex-1">
                        <div className="text-white font-medium">{r.requester?.displayName || r.requester?.username}</div>
                        <div className="text-xs text-gray-400">LV. {r.requester?.level ?? 1}</div>
                      </div>
                      <button onClick={() => accept(r.id)} className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition" title="Accept">
                        <Check className="w-4 h-4 text-green-200" />
                      </button>
                      <button onClick={() => decline(r.id)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition" title="Decline">
                        <XIcon className="w-4 h-4 text-red-200" />
                      </button>
                    </div>
                  )
                )}

              {tab === "outgoing" &&
                (outgoing.length ? outgoing : [{ __empty: true }]).map((r, idx) =>
                  r.__empty ? (
                    <div key={idx} className="text-gray-400 text-sm py-8 text-center">No outgoing requests.</div>
                  ) : (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                      <Avatar user={r.recipient} />
                      <div className="flex-1">
                        <div className="text-white font-medium">{r.recipient?.displayName || r.recipient?.username}</div>
                        <div className="text-xs text-gray-400">LV. {r.recipient?.level ?? 1}</div>
                      </div>
                      <button onClick={() => cancel(r.id)} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm text-white">
                        Cancel
                      </button>
                    </div>
                  )
                )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

