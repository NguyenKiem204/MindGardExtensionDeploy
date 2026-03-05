import { useState, useEffect, useRef } from "react";
import { X, Plus, Search, Pin, PinOff, Trash2, Edit3, Save, ArrowLeft, StickyNote, Sparkles, Loader2 } from "lucide-react";
import { noteService } from "../services/noteService";

export default function SmartNoteModal({ isOpen, onClose }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState("list"); // list | create | edit
    const [editingNote, setEditingNote] = useState(null);
    const [form, setForm] = useState({ title: "", content: "", tags: "" });
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const contentRef = useRef(null);

    // Fetch notes
    useEffect(() => {
        if (isOpen) {
            fetchNotes();
        }
    }, [isOpen]);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const data = await noteService.getNotes();
            setNotes(data);
        } catch (err) {
            console.error("Failed to fetch notes:", err);
        } finally {
            setLoading(false);
        }
    };

    // Filter notes by search
    const filteredNotes = notes.filter(note => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (note.title || "").toLowerCase().includes(q) ||
            (note.content || "").toLowerCase().includes(q) ||
            (note.tags || "").toLowerCase().includes(q)
        );
    });

    // Separate pinned and unpinned
    const pinnedNotes = filteredNotes.filter(n => n.pinned);
    const unpinnedNotes = filteredNotes.filter(n => !n.pinned);

    const handleCreate = () => {
        setForm({ title: "", content: "", tags: "" });
        setEditingNote(null);
        setView("create");
        setTimeout(() => contentRef.current?.focus(), 100);
    };

    const handleEdit = (note) => {
        setForm({
            title: note.title || "",
            content: note.content || "",
            tags: note.tags || ""
        });
        setEditingNote(note);
        setView("edit");
        setTimeout(() => contentRef.current?.focus(), 100);
    };

    const handleSave = async () => {
        if (!form.content.trim() && !form.title.trim()) return;
        setSaving(true);
        try {
            if (view === "create") {
                await noteService.createNote({
                    title: form.title || null,
                    content: form.content,
                    tags: form.tags || null
                });
            } else {
                await noteService.updateNote(editingNote.id, {
                    title: form.title || null,
                    content: form.content,
                    tags: form.tags || null,
                    pinned: editingNote.pinned
                });
            }
            await fetchNotes();
            setView("list");
        } catch (err) {
            console.error("Save failed:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (note) => {
        if (!confirm(`Xóa ghi chú "${note.title || "Không tiêu đề"}"?`)) return;
        try {
            await noteService.deleteNote(note.id);
            setNotes(prev => prev.filter(n => n.id !== note.id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleTogglePin = async (note) => {
        try {
            await noteService.updateNote(note.id, {
                title: note.title,
                content: note.content,
                tags: note.tags,
                pinned: !note.pinned
            });
            await fetchNotes();
        } catch (err) {
            console.error("Pin toggle failed:", err);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        let d = new Date(dateStr);

        // If date is invalid, try to handle it
        if (isNaN(d.getTime())) return "";

        const now = new Date();
        const diff = now - d;

        // If diff is negative (e.g. server time slightly ahead), treat as "Vừa xong"
        if (diff < 0) return "Vừa xong";
        if (diff < 60000) return "Vừa xong";
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} ngày trước`;
        return d.toLocaleDateString("vi-VN");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            handleSave();
        }
    };

    const handleAiEnhance = async () => {
        if (!form.content.trim()) return;
        setAiLoading(true);
        try {
            const result = await noteService.aiEnhance(form.title, form.content);
            if (result) {
                if (result.tags) {
                    setForm(prev => ({ ...prev, tags: result.tags }));
                }
                if (result.summary) {
                    setForm(prev => ({
                        ...prev,
                        content: prev.content + "\n\n---\n📝 AI Summary: " + result.summary
                    }));
                }
            }
        } catch (err) {
            console.error("AI enhance failed:", err);
        } finally {
            setAiLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-start p-4" onClick={onClose}>
            <style>{`
        .note-scrollbar::-webkit-scrollbar { width: 5px; }
        .note-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
        .note-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .note-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.35); }
      `}</style>
            <div
                className="bg-black/50 rounded-2xl w-full max-w-sm max-h-[55vh] overflow-hidden shadow-2xl mb-20 ml-4 border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        {view !== "list" && (
                            <button
                                onClick={() => setView("list")}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 text-white/70" />
                            </button>
                        )}
                        <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <StickyNote className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-base font-semibold text-white">
                            {view === "list" ? "Smart Notes" : view === "create" ? "Ghi chú mới" : "Chỉnh sửa"}
                        </h2>
                    </div>
                    {view === "list" && (
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-lg text-white transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Mới</span>
                        </button>
                    )}
                </div>

                {/* Content */}
                {view === "list" ? (
                    <>
                        {/* Search */}
                        <div className="px-3 pt-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Tìm ghi chú..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs placeholder:text-white/30 outline-none focus:border-amber-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Notes list */}
                        <div className="p-3 overflow-y-auto note-scrollbar" style={{ maxHeight: 'calc(55vh - 120px)', minHeight: '250px' }}>
                            {loading && <div className="text-white/50 text-center py-8 text-sm">Đang tải...</div>}

                            {!loading && filteredNotes.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-white/40">
                                    <StickyNote className="w-12 h-12 mb-3 opacity-40" />
                                    <p className="text-sm font-medium">Chưa có ghi chú</p>
                                    <p className="text-xs mt-1 opacity-70">Nhấn "Mới" để tạo ghi chú đầu tiên</p>
                                </div>
                            )}

                            {!loading && filteredNotes.length > 0 && (
                                <div className="space-y-2">
                                    {/* Pinned notes */}
                                    {pinnedNotes.length > 0 && (
                                        <>
                                            <p className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-wider flex items-center gap-1">
                                                <Pin className="w-3 h-3" /> Đã ghim
                                            </p>
                                            {pinnedNotes.map(note => (
                                                <NoteCard
                                                    key={note.id}
                                                    note={note}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDelete}
                                                    onTogglePin={handleTogglePin}
                                                    formatDate={formatDate}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {/* Other notes */}
                                    {unpinnedNotes.length > 0 && (
                                        <>
                                            {pinnedNotes.length > 0 && (
                                                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mt-3">Khác</p>
                                            )}
                                            {unpinnedNotes.map(note => (
                                                <NoteCard
                                                    key={note.id}
                                                    note={note}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDelete}
                                                    onTogglePin={handleTogglePin}
                                                    formatDate={formatDate}
                                                />
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Create / Edit form */
                    <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
                        <input
                            type="text"
                            placeholder="Tiêu đề (tuỳ chọn)"
                            value={form.title}
                            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 outline-none focus:border-amber-500/50 transition-colors"
                        />
                        <textarea
                            ref={contentRef}
                            placeholder="Viết ghi chú..."
                            value={form.content}
                            onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                            rows={8}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 outline-none focus:border-amber-500/50 transition-colors resize-none note-scrollbar"
                        />
                        <input
                            type="text"
                            placeholder="Tags (vd: react, study, idea)"
                            value={form.tags}
                            onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs placeholder:text-white/30 outline-none focus:border-amber-500/50 transition-colors"
                        />
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleAiEnhance}
                                disabled={aiLoading || !form.content.trim()}
                                className="py-2 px-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 rounded-xl text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                                title="AI tóm tắt & gắn tag"
                            >
                                {aiLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3.5 h-3.5" />
                                )}
                                AI
                            </button>
                            <button
                                onClick={() => setView("list")}
                                className="flex-1 py-2 bg-black/40 hover:bg-black/60 rounded-xl text-white/70 text-xs font-medium transition-colors"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || (!form.content.trim() && !form.title.trim())}
                                className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 rounded-xl text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                            >
                                {saving ? "Đang lưu..." : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        Lưu
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Note Card Component ─── */
function NoteCard({ note, onEdit, onDelete, onTogglePin, formatDate }) {
    return (
        <div
            className="group relative p-3 bg-black/40 hover:bg-black/60 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer transition-all"
            onClick={() => onEdit(note)}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                        {note.title || "Không tiêu đề"}
                    </h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">
                        {note.content || ""}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-white/30">{formatDate(note.updatedAt || note.createdAt)}</span>
                        {note.tags && (
                            <div className="flex gap-1 flex-wrap">
                                {note.tags.split(",").map((tag, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400/80 text-[9px] rounded-md font-medium">
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onTogglePin(note); }}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        title={note.pinned ? "Bỏ ghim" : "Ghim"}
                    >
                        {note.pinned ?
                            <PinOff className="w-3.5 h-3.5 text-amber-400" /> :
                            <Pin className="w-3.5 h-3.5 text-white/50" />
                        }
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(note); }}
                        className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Xóa"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-white/50 hover:text-red-400" />
                    </button>
                </div>
            </div>
        </div>
    );
}
