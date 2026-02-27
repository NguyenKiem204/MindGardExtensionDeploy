import { useEffect, useState } from "react";
import { X, Plus, ChevronRight, MoreVertical, ArrowLeft, Lock } from "lucide-react";
import { authService } from "../services/authService";

const GROUP_ICONS = {
  'AI': '🤖',
  'Social Media': '📱',
  'Entertainment': '📺',
  'News': '📰',
  'Shopping': '🛒',
  'Email': '📧'
};

const SITE_ICONS = {
  'facebook.com': '🔵',
  'instagram.com': '📷',
  'tiktok.com': '🎵',
  'web.whatsapp.com': '💬',
  'messenger.com': '💙',
  'web.telegram.org': '✈️',
  'x.com': '✕',
  'reddit.com': '🔶',
  'discord.com': '💜',
  'snapchat.com': '👻',
  'pinterest.com': '📌',
};

export default function FocusModeModal({ isOpen, onClose }) {
  const [activeView, setActiveView] = useState('groups');
  const [modeTab, setModeTab] = useState('manual'); // 'manual' | 'ai'
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [blockedGroups, setBlockedGroups] = useState({});
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [focusTopic, setFocusTopic] = useState('Focus');
  // Allowed list drafts (separate to avoid interfering with group drafts)
  const [allowedDraftName, setAllowedDraftName] = useState("");
  const [allowedDraftUrl, setAllowedDraftUrl] = useState("");
  // Group inline drafts
  const [draftName, setDraftName] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [renamingGroup, setRenamingGroup] = useState(null);
  const [inlineNew, setInlineNew] = useState(null); // { key, idx }
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [allowedInlineNewIdx, setAllowedInlineNewIdx] = useState(null);
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

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const st = await (window.chrome?.storage?.local?.get?.([
          'focusMode', 'currentFocusTopic', 'blockedDomains', 'allowedDomains', 'blockedGroups'
        ]) || Promise.resolve({}));
        if (st.currentFocusTopic) setFocusTopic(st.currentFocusTopic);
        const allowed = (st.allowedDomains || []).map((it) => {
          if (typeof it === 'string') return { name: prettifyName(it), url: it };
          return { name: it.name || prettifyName(it.url || it.host || ''), url: it.url || it.host || '' };
        });
        setAllowedDomains(allowed);
        const groups = st.blockedGroups && Object.keys(st.blockedGroups).length ? st.blockedGroups : getDefaultBlockedGroupsUI();
        const normalized = {};
        Object.keys(groups).forEach((k) => {
          const g = groups[k] || { items: [] };
          normalized[k] = {
            enabled: g.enabled === true,
            items: (g.items || []).map((it) => {
              if (typeof it === 'string') return { name: prettifyName(it), host: it.toLowerCase(), enabled: true };
              return { name: it.name || prettifyName(it.host || it.url || ''), host: (it.host || it.url || '').toLowerCase(), enabled: it.enabled !== false };
            })
          };
        });
        setBlockedGroups(normalized);
        // default to manual tab
        setModeTab('manual');
      } catch { }
    })();
  }, [isOpen]);

  const saveAll = async () => {
    try {
      await window.chrome?.storage?.local?.set?.({
        focusMode: 'manual',
        currentFocusTopic: focusTopic,
        allowedDomains,
        blockedGroups,
      });
      window.dispatchEvent(new CustomEvent('mindgard_focus_settings_changed'));
      onClose?.();
    } catch {
      onClose?.();
    }
  };

  const persistSettings = async (nextBlockedGroups = blockedGroups, nextAllowedDomains = allowedDomains, nextTopic = focusTopic) => {
    try {
      await window.chrome?.storage?.local?.set?.({
        focusMode: 'manual',
        currentFocusTopic: nextTopic,
        allowedDomains: nextAllowedDomains,
        blockedGroups: nextBlockedGroups,
      });
      window.dispatchEvent(new CustomEvent('mindgard_focus_settings_changed'));
    } catch { }
  };

  const toggleGroup = (key) => {
    const g = blockedGroups[key];
    const next = { ...blockedGroups, [key]: { ...g, enabled: !g?.enabled } };
    setBlockedGroups(next);
    persistSettings(next);
  };

  const toggleSite = (key, idx) => {
    const g = blockedGroups[key];
    const items = [...g.items];
    items[idx] = { ...items[idx], enabled: !items[idx].enabled };
    const next = { ...blockedGroups, [key]: { ...g, items } };
    setBlockedGroups(next);
    persistSettings(next);
  };

  const addSiteToGroup = (key) => {
    const host = normalizeDomain(draftUrl);
    if (!host) return;
    const name = draftName || prettifyName(host);
    const g = blockedGroups[key];
    const items = [{ name, host, enabled: true }, ...(g.items || [])];
    const next = { ...blockedGroups, [key]: { ...g, items } };
    setBlockedGroups(next);
    persistSettings(next);
    setDraftName(''); setDraftUrl('');
  };

  const createInlineNewSite = (key) => {
    const g = blockedGroups[key];
    const idx = 0;
    const items = [{ name: '', host: '', enabled: true, _temp: true }, ...(g.items || [])];
    setBlockedGroups({ ...blockedGroups, [key]: { ...g, items } });
    setInlineNew({ key, idx });
  };

  const finalizeInlineNew = (saveIfAny = true) => {
    if (!inlineNew) return;
    const { key, idx } = inlineNew;
    const g = blockedGroups[key];
    const item = g?.items?.[idx];
    if (!item) { setInlineNew(null); return; }
    const name = (item.name || '').trim();
    const host = normalizeDomain(item.host || '');
    const shouldKeep = saveIfAny ? (name || host) : false;
    const items = [...g.items];
    if (!shouldKeep) {
      items.splice(idx, 1);
    } else {
      items[idx] = { name: name || prettifyName(host), host, enabled: true };
    }
    const next = { ...blockedGroups, [key]: { ...g, items } };
    setBlockedGroups(next);
    persistSettings(next);
    setInlineNew(null);
  };

  const removeSite = (key, idx) => {
    const g = blockedGroups[key];
    const items = g.items.filter((_, i) => i !== idx);
    const next = { ...blockedGroups, [key]: { ...g, items } };
    setBlockedGroups(next);
    persistSettings(next);
  };

  const editSite = (key, idx) => {
    const g = blockedGroups[key];
    const item = g.items[idx];
    setEditingItem({ key, idx, name: item.name, host: item.host });
  };

  const saveEdit = () => {
    if (!editingItem) return;
    const { key, idx, name, host } = editingItem;
    const g = blockedGroups[key];
    const items = [...g.items];
    items[idx] = { ...items[idx], name, host: normalizeDomain(host) };
    const next = { ...blockedGroups, [key]: { ...g, items } };
    setBlockedGroups(next);
    persistSettings(next);
    setEditingItem(null);
  };

  const finalizeAllowedInline = (saveIfAny = true) => {
    if (allowedInlineNewIdx === null || allowedInlineNewIdx === undefined) return;
    const idx = allowedInlineNewIdx;
    const item = allowedDomains[idx];
    if (!item) { setAllowedInlineNewIdx(null); return; }
    const name = (item.name || '').trim();
    const urlRaw = (item.url || '').trim();
    const url = normalizeAllowed(urlRaw);
    const shouldKeep = saveIfAny ? (name || url) : false;
    let next = [...allowedDomains];
    if (!shouldKeep) {
      next.splice(idx, 1);
    } else {
      next[idx] = { name: name || prettifyName(url), url };
    }
    setAllowedDomains(next);
    persistSettings(blockedGroups, next);
    setAllowedInlineNewIdx(null);
  };

  if (!isOpen) return null;

  const groupsView = (
    <div className="space-y-3">
      {/* Allowed sites card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Allowed sites</h3>
          <button
            onClick={() => {
              const idx = 0;
              const next = [{ name: '', url: '' }, ...(allowedDomains || [])];
              setAllowedDomains(next);
              setAllowedInlineNewIdx(idx);
            }}
            className="w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2 max-h-48 overflow-auto custom-scroll pr-1">
          {(allowedDomains || []).map((it, idx) => {
            const host = normalizeDomain(it.url || '');
            const icon = SITE_ICONS[host] || '🌐';
            const isInline = allowedInlineNewIdx === idx;
            return (
              <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded px-3 py-2">
                <SiteFavicon host={host} fallbackEmoji={icon} />
                <div className="flex-1">
                  {isInline ? (
                    <div className="space-y-1.5">
                      <input
                        autoFocus
                        value={it.name || ''}
                        onChange={(e) => {
                          const next = [...allowedDomains];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setAllowedDomains(next);
                        }}
                        onKeyDown={(e) => { if (e.key === 'Escape') { finalizeAllowedInline(false); } if (e.key === 'Enter') { const nextInput = e.currentTarget.parentElement?.querySelector('input[data-url]'); nextInput && nextInput.focus(); } }}
                        onBlur={(e) => { setTimeout(() => { const c = e.currentTarget.parentElement?.contains(document.activeElement); if (!c) finalizeAllowedInline(true); }, 0); }}
                        className="w-full bg-transparent text-white text-sm font-medium outline-none placeholder-gray-500"
                        placeholder="Website Name"
                      />
                      <input
                        data-url
                        value={it.url || ''}
                        onChange={(e) => {
                          const next = [...allowedDomains];
                          next[idx] = { ...next[idx], url: e.target.value };
                          setAllowedDomains(next);
                        }}
                        onKeyDown={(e) => { if (e.key === 'Escape') { finalizeAllowedInline(false); } if (e.key === 'Enter') { finalizeAllowedInline(true); } }}
                        onBlur={(e) => { setTimeout(() => { const c = e.currentTarget.parentElement?.contains(document.activeElement); if (!c) finalizeAllowedInline(true); }, 0); }}
                        className="w-full bg-transparent text-gray-300 text-xs outline-none placeholder-gray-500"
                        placeholder="URL or domain"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="text-white text-sm font-medium">{it.name || prettifyName(host)}</div>
                      <div className="text-white/50 text-xs">{it.url}</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (isInline) { finalizeAllowedInline(true); return; }
                    const next = allowedDomains.filter((_, i) => i !== idx);
                    setAllowedDomains(next);
                    persistSettings(blockedGroups, next);
                  }}
                  className="text-white/70 hover:text-white text-xs"
                >{isInline ? 'Done' : 'Remove'}</button>
              </div>
            );
          })}
          {(!allowedDomains || allowedDomains.length === 0) && (
            <div className="text-white/50 text-sm">No allowed sites</div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Blocked Groups</h3>
        <button onClick={() => {
          let base = 'New group', name = base, i = 1; while (blockedGroups[name]) { i++; name = base + " " + i; }
          const copy = { ...blockedGroups, [name]: { enabled: true, items: [] } };
          setBlockedGroups(copy);
          persistSettings(copy);
          setRenamingGroup(name);
        }} className="w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {Object.keys(blockedGroups || {}).map((key) => {
        const g = blockedGroups[key];
        const count = (g?.items || []).filter(it => it.enabled !== false).length;
        const icon = GROUP_ICONS[key] || '📁';
        return (
          <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                  {renamingGroup === key ? (
                    <input
                      autoFocus
                      defaultValue={key}
                      onBlur={(e) => {
                        const newName = e.target.value.trim(); if (!newName || newName === key) { setRenamingGroup(null); return; }
                        if (blockedGroups[newName]) { setRenamingGroup(null); return; }
                        const copy = { ...blockedGroups }; copy[newName] = copy[key]; delete copy[key]; setBlockedGroups(copy); persistSettings(copy); setRenamingGroup(null);
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      className="w-full bg-transparent border-b border-white/30 text-white outline-none text-base"
                    />
                  ) : (
                    <button onClick={() => { setSelectedGroup(key); setActiveView('detail'); }} className="text-left w-full">
                      <div className="text-white font-medium">{key}</div>
                      <div className="text-gray-400 text-sm">{count} sites</div>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!g?.enabled}
                    onChange={() => toggleGroup(key)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const detailView = selectedGroup && blockedGroups[selectedGroup] && (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setActiveView('groups'); setSelectedGroup(null); }} className="text-white/80 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-2xl">{GROUP_ICONS[selectedGroup] || '📁'}</span>
        <h3 className="text-white text-xl font-semibold">{selectedGroup}</h3>
        <button className="ml-auto text-white/60 hover:text-white" onClick={() => { createInlineNewSite(selectedGroup); }}>
          <Plus className="w-6 h-6" />
        </button>
        <div className="relative">
          <button className="text-white/60 hover:text-white" onClick={() => setGroupMenuOpen(v => !v)}>
            <MoreVertical className="w-6 h-6" />
          </button>
          {groupMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-black/70 backdrop-blur border border-white/10 rounded-lg shadow-lg z-10">
              <button
                className="w-full text-left px-3 py-2 text-white/90 hover:bg-white/10 text-sm"
                onClick={() => { setGroupMenuOpen(false); setRenamingGroup(selectedGroup); setActiveView('groups'); }}
              >Rename group</button>
              <button
                className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 text-sm"
                onClick={() => {
                  const copy = { ...blockedGroups }; delete copy[selectedGroup]; setBlockedGroups(copy); persistSettings(copy);
                  setGroupMenuOpen(false); setSelectedGroup(null); setActiveView('groups');
                }}
              >Delete group</button>
            </div>
          )}
        </div>
      </div>

      {/* inline new editing is rendered inline within the row below */}

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scroll">
        {(blockedGroups[selectedGroup]?.items || []).map((it, idx) => {
          const icon = SITE_ICONS[it.host] || '🌐';
          const isInlineEditing = inlineNew && inlineNew.key === selectedGroup && inlineNew.idx === idx;
          return (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:bg-white/10 transition-colors">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={it.enabled !== false}
                  onChange={() => toggleSite(selectedGroup, idx)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
              <SiteFavicon host={it.host} fallbackEmoji={icon} />
              <div className="flex-1">
                {isInlineEditing ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={it.name || ''}
                      onChange={(e) => {
                        const g = blockedGroups[selectedGroup];
                        const items = [...g.items];
                        items[idx] = { ...items[idx], name: e.target.value };
                        setBlockedGroups({ ...blockedGroups, [selectedGroup]: { ...g, items } });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Escape') { finalizeInlineNew(false); } if (e.key === 'Enter') { const next = e.currentTarget.parentElement?.querySelector('input[data-url]'); next && next.focus(); } }}
                      onBlur={(e) => { setTimeout(() => { const c = e.currentTarget.parentElement?.contains(document.activeElement); if (!c) finalizeInlineNew(true); }, 0); }}
                      className="w-full bg-transparent text-white font-medium outline-none placeholder-gray-500"
                      placeholder="Website Name"
                    />
                    <input
                      data-url
                      value={it.host || ''}
                      onChange={(e) => {
                        const g = blockedGroups[selectedGroup];
                        const items = [...g.items];
                        items[idx] = { ...items[idx], host: e.target.value };
                        setBlockedGroups({ ...blockedGroups, [selectedGroup]: { ...g, items } });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Escape') { finalizeInlineNew(false); } if (e.key === 'Enter') { finalizeInlineNew(true); } }}
                      onBlur={(e) => { setTimeout(() => { const c = e.currentTarget.parentElement?.contains(document.activeElement); if (!c) finalizeInlineNew(true); }, 0); }}
                      className="w-full bg-transparent text-gray-300 text-sm outline-none placeholder-gray-500"
                      placeholder="URL"
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-white font-medium">{it.name || prettifyName(it.host)}</div>
                    <div className="text-gray-400 text-sm">{it.host}</div>
                  </>
                )}
              </div>
              <button
                onClick={() => isInlineEditing ? finalizeInlineNew(true) : editSite(selectedGroup, idx)}
                className="text-white/60 hover:text-white"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-black/30 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-6 mx-4 max-h-[92vh] overflow-auto custom-scroll">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <span className="text-2xl">🛡️</span>
            </div>
            <h2 className="text-white text-2xl font-bold">Focus mode</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode tabs and Topic */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setModeTab('manual')}
            className={`px-3 py-1.5 rounded text-sm ${modeTab === 'manual' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/80'}`}
          >Manual</button>
          <button
            onClick={() => setModeTab('ai')}
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${modeTab === 'ai' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/80'}`}
          >
            AI {!isPlusUser && <Lock className="w-3 h-3 text-orange-300" />}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-white/70">Topic</span>
            <input value={focusTopic} onChange={(e) => setFocusTopic(e.target.value)} className="px-2 py-1 rounded bg-white/10 text-white text-sm outline-none border border-white/10" placeholder="e.g. Học AWS S3" />
          </div>
        </div>

        {modeTab === 'manual' ? (activeView === 'groups' ? groupsView : detailView) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            {!isPlusUser ? (
              <div className="py-6 space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Tính năng dành riêng cho MindGard Plus</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  Chế độ chặn xao nhãng bằng AI (AI Strict Focus) nâng cao giúp phân tích nội dung trang và ngữ cảnh. Mở khóa để trải nghiệm ngay.
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
              <div className="text-white/80 text-sm">
                AI mode lets you browse broadly (YouTube, Facebook, Google...) as long as content matches the Topic. Non‑related pages trigger a warning then a hard block.
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="px-5 py-2.5 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            onClick={saveAll}
          >
            Save Changes
          </button>
        </div>
        {/* Local, scoped scrollbar styling */}
        <style>{`
          .custom-scroll::-webkit-scrollbar{width:8px;height:8px}
          .custom-scroll::-webkit-scrollbar-track{background:transparent}
          .custom-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:8px}
          .custom-scroll:hover::-webkit-scrollbar-thumb{background:rgba(255,255,255,.3)}
          .custom-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}
        `}</style>
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingItem(null)} />
          <div className="relative bg-gray-900 border border-white/20 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-white text-lg font-semibold mb-4">Edit Website</h3>
            <div className="space-y-3 mb-4">
              <input
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none"
                placeholder="Website Name"
              />
              <input
                value={editingItem.host}
                onChange={(e) => setEditingItem({ ...editingItem, host: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none"
                placeholder="URL"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => removeSite(editingItem.key, editingItem.idx)}
                className="flex-1 px-4 py-2.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg font-medium hover:bg-red-600/30 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeDomain(input) {
  const v = (input || '').trim().toLowerCase();
  if (!v) return '';
  try {
    const d = v.includes('://') ? new URL(v).hostname : v;
    return d.replace(/^www\./, '');
  } catch { return v; }
}

function prettifyName(domain) {
  if (!domain) return '';
  const clean = domain.replace(/^(www\.|https?:\/\/(www\.)?)/i, '').split('/')[0].split('.')[0];
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function normalizeAllowed(input) {
  const v = (input || '').trim();
  if (!v) return '';
  try {
    // Try to construct URL; if domain only, keep as-is
    if (!/^https?:\/\//i.test(v)) return v.toLowerCase();
    const url = new URL(v);
    return url.toString();
  } catch {
    return v.toLowerCase();
  }
}

// Get favicon URL for a given host (falls back to google s2 service)
function getFaviconUrl(host) {
  if (!host) return null;
  try {
    const cleanHost = host.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return `https://www.google.com/s2/favicons?domain=${cleanHost}&sz=64`;
  } catch {
    return null;
  }
}

// Small favicon component with graceful fallback to emoji
function SiteFavicon({ host, fallbackEmoji = '🌐' }) {
  const [errored, setErrored] = useState(false);
  const url = getFaviconUrl(host);
  if (errored || !url) {
    return <span className="text-2xl">{fallbackEmoji}</span>;
  }
  return (
    <img
      src={url}
      alt=""
      className="w-6 h-6 rounded"
      onError={() => setErrored(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

function getDefaultBlockedGroupsUI() {
  return {
    'AI': {
      enabled: false, items: [
        { name: 'ChatGPT', host: 'chat.openai.com', enabled: true },
        { name: 'Claude', host: 'claude.ai', enabled: true },
        { name: 'Perplexity', host: 'perplexity.ai', enabled: true },
        { name: 'Poe', host: 'poe.com', enabled: true },
        { name: 'Gemini', host: 'gemini.google.com', enabled: true }
      ]
    },
    'Social Media': {
      enabled: false, items: [
        { name: 'Facebook', host: 'facebook.com', enabled: true },
        { name: 'Instagram', host: 'instagram.com', enabled: true },
        { name: 'TikTok', host: 'tiktok.com', enabled: true },
        { name: 'Whatsapp', host: 'web.whatsapp.com', enabled: true },
        { name: 'Messenger', host: 'messenger.com', enabled: true },
        { name: 'Telegram', host: 'web.telegram.org', enabled: true },
        { name: 'X', host: 'x.com', enabled: true },
        { name: 'Reddit', host: 'reddit.com', enabled: true },
        { name: 'Discord', host: 'discord.com', enabled: true },
        { name: 'Snapchat', host: 'snapchat.com', enabled: true },
        { name: 'Pinterest', host: 'pinterest.com', enabled: true },
        { name: 'LinkedIn', host: 'linkedin.com', enabled: true },
        { name: 'Threads', host: 'threads.net', enabled: true },
        { name: 'WeChat', host: 'wechat.com', enabled: true },
        { name: 'QQ', host: 'qq.com', enabled: true }
      ]
    },
    'Entertainment': {
      enabled: false, items: [
        { name: 'YouTube', host: 'youtube.com', enabled: true },
        { name: 'Netflix', host: 'netflix.com', enabled: true },
        { name: 'Twitch', host: 'twitch.tv', enabled: true },
        { name: 'Prime Video', host: 'primevideo.com', enabled: true },
        { name: 'Disney+', host: 'disneyplus.com', enabled: true },
        { name: 'Hulu', host: 'hulu.com', enabled: true },
        { name: 'Vimeo', host: 'vimeo.com', enabled: true },
        { name: 'SoundCloud', host: 'soundcloud.com', enabled: true },
        { name: 'Spotify', host: 'spotify.com', enabled: true },
        { name: 'Crunchyroll', host: 'crunchyroll.com', enabled: true }
      ]
    },
    'News': {
      enabled: false, items: [
        { name: 'CNN', host: 'cnn.com', enabled: true },
        { name: 'BBC', host: 'bbc.com', enabled: true },
        { name: 'NY Times', host: 'nytimes.com', enabled: true },
        { name: 'The Guardian', host: 'theguardian.com', enabled: true },
        { name: 'Washington Post', host: 'washingtonpost.com', enabled: true },
        { name: 'WSJ', host: 'wsj.com', enabled: true },
        { name: 'Bloomberg', host: 'bloomberg.com', enabled: true },
        { name: 'Reuters', host: 'reuters.com', enabled: true },
        { name: 'Fox News', host: 'foxnews.com', enabled: true },
        { name: 'NBC News', host: 'nbcnews.com', enabled: true }
      ]
    },
    'Shopping': {
      enabled: false, items: [
        { name: 'Amazon', host: 'amazon.com', enabled: true },
        { name: 'eBay', host: 'ebay.com', enabled: true },
        { name: 'Walmart', host: 'walmart.com', enabled: true },
        { name: 'Best Buy', host: 'bestbuy.com', enabled: true },
        { name: 'Shopee', host: 'shopee.vn', enabled: true },
        { name: 'Lazada', host: 'lazada.vn', enabled: true }
      ]
    },
    'Email': {
      enabled: false, items: [
        { name: 'Gmail', host: 'mail.google.com', enabled: true },
        { name: 'Outlook', host: 'outlook.com', enabled: true },
        { name: 'Yahoo Mail', host: 'mail.yahoo.com', enabled: true },
        { name: 'Proton', host: 'proton.me', enabled: true }
      ]
    },
  };
}


