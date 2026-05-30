/**
 * ChatHistoryPanel — Sidebar showing past chat sessions for logged-in users.
 *
 * Features:
 * - List of sessions (newest first, pinned on top)
 * - Click to restore a session
 * - Rename inline
 * - Pin / unpin
 * - Delete with confirmation
 * - Search across all messages
 */
import { useState, useCallback } from "react";
import { Search, Pin, PinOff, Pencil, Trash2, X, Check, MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: string;
  title: string;
  language: string;
  is_pinned: boolean;
  created_at: string;
}

interface Props {
  sessions: ChatSession[];
  activeSessionId: string | null;
  loading: boolean;
  onSelect: (sessionId: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, pin: boolean) => void;
  onDelete: (id: string) => void;
  onSearch: (q: string) => void;
  searchResults: { id: string; session_id: string; content: string; created_at: string }[];
  onClose?: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

export function ChatHistoryPanel({
  sessions,
  activeSessionId,
  loading,
  onSelect,
  onNew,
  onRename,
  onPin,
  onDelete,
  onSearch,
  searchResults,
  onClose,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (q.trim().length >= 2) onSearch(q.trim());
    },
    [onSearch]
  );

  const startEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const commitEdit = () => {
    if (editingId && editingTitle.trim()) {
      onRename(editingId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const pinnedSessions = sessions.filter((s) => s.is_pinned);
  const regularSessions = sessions.filter((s) => !s.is_pinned);
  const isSearching = searchQuery.trim().length >= 2;

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground">Chat History</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNew}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            + New
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-1 p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X size={15} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-1.5">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search messages…"
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-4 py-6 text-xs text-muted-foreground text-center">
            Loading history…
          </div>
        )}

        {/* Search results */}
        {isSearching && !loading && (
          <div className="px-2 py-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 py-1">
              Search Results
            </p>
            {searchResults.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2">No results found.</p>
            ) : (
              searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { onSelect(r.session_id); setSearchQuery(""); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors mb-0.5"
                >
                  <p className="text-xs text-foreground line-clamp-2">{r.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(r.created_at)}</p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Normal session list */}
        {!isSearching && (
          <>
            {pinnedSessions.length > 0 && (
              <SessionGroup
                label="Pinned"
                sessions={pinnedSessions}
                activeSessionId={activeSessionId}
                editingId={editingId}
                editingTitle={editingTitle}
                confirmDeleteId={confirmDeleteId}
                onSelect={onSelect}
                onStartEdit={startEdit}
                onCommitEdit={commitEdit}
                onEditChange={setEditingTitle}
                onPin={onPin}
                onDelete={onDelete}
                onConfirmDelete={setConfirmDeleteId}
              />
            )}

            {regularSessions.length > 0 && (
              <SessionGroup
                label="Recent"
                sessions={regularSessions}
                activeSessionId={activeSessionId}
                editingId={editingId}
                editingTitle={editingTitle}
                confirmDeleteId={confirmDeleteId}
                onSelect={onSelect}
                onStartEdit={startEdit}
                onCommitEdit={commitEdit}
                onEditChange={setEditingTitle}
                onPin={onPin}
                onDelete={onDelete}
                onConfirmDelete={setConfirmDeleteId}
              />
            )}

            {sessions.length === 0 && !loading && (
              <div className="px-4 py-10 text-center">
                <MessageSquare size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No chats yet.</p>
                <button
                  onClick={onNew}
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  Start your first conversation →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── SessionGroup ──────────────────────────────────────────────────────────────

interface GroupProps {
  label: string;
  sessions: ChatSession[];
  activeSessionId: string | null;
  editingId: string | null;
  editingTitle: string;
  confirmDeleteId: string | null;
  onSelect: (id: string) => void;
  onStartEdit: (s: ChatSession) => void;
  onCommitEdit: () => void;
  onEditChange: (v: string) => void;
  onPin: (id: string, pin: boolean) => void;
  onDelete: (id: string) => void;
  onConfirmDelete: (id: string | null) => void;
}

function SessionGroup({
  label,
  sessions,
  activeSessionId,
  editingId,
  editingTitle,
  confirmDeleteId,
  onSelect,
  onStartEdit,
  onCommitEdit,
  onEditChange,
  onPin,
  onDelete,
  onConfirmDelete,
}: GroupProps) {
  return (
    <div className="px-2 py-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 py-1">
        {label}
      </p>
      {sessions.map((s) => (
        <SessionRow
          key={s.id}
          session={s}
          isActive={activeSessionId === s.id}
          isEditing={editingId === s.id}
          editingTitle={editingTitle}
          confirmDelete={confirmDeleteId === s.id}
          onSelect={() => onSelect(s.id)}
          onStartEdit={() => onStartEdit(s)}
          onCommitEdit={onCommitEdit}
          onEditChange={onEditChange}
          onPin={() => onPin(s.id, !s.is_pinned)}
          onDelete={() => onDelete(s.id)}
          onConfirmDelete={() => onConfirmDelete(s.id)}
          onCancelDelete={() => onConfirmDelete(null)}
        />
      ))}
    </div>
  );
}

// ── SessionRow ────────────────────────────────────────────────────────────────

interface RowProps {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  confirmDelete: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onCommitEdit: () => void;
  onEditChange: (v: string) => void;
  onPin: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function SessionRow({
  session,
  isActive,
  isEditing,
  editingTitle,
  confirmDelete,
  onSelect,
  onStartEdit,
  onCommitEdit,
  onEditChange,
  onPin,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: RowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-lg px-2 py-2 mb-0.5 cursor-pointer transition-colors",
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/60 border border-transparent"
      )}
      onClick={isEditing ? undefined : onSelect}
    >
      {isEditing ? (
        <input
          autoFocus
          value={editingTitle}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => { if (e.key === "Enter") onCommitEdit(); }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent text-xs text-foreground outline-none border-b border-primary"
        />
      ) : (
        <span className="flex-1 text-xs text-foreground truncate leading-snug">
          {session.title}
        </span>
      )}

      {/* Action buttons — only show on hover or active */}
      {!isEditing && !confirmDelete && (
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <IconBtn icon={<Pencil size={11} />} onClick={(e) => { e.stopPropagation(); onStartEdit(); }} title="Rename" />
          <IconBtn
            icon={session.is_pinned ? <PinOff size={11} /> : <Pin size={11} />}
            onClick={(e) => { e.stopPropagation(); onPin(); }}
            title={session.is_pinned ? "Unpin" : "Pin"}
          />
          <IconBtn
            icon={<Trash2 size={11} />}
            onClick={(e) => { e.stopPropagation(); onConfirmDelete(); }}
            title="Delete"
            danger
          />
        </div>
      )}

      {/* Inline delete confirmation */}
      {confirmDelete && (
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onDelete}
            className="text-[10px] text-destructive font-semibold px-1.5 py-0.5 rounded bg-destructive/10 hover:bg-destructive/20"
          >
            Delete
          </button>
          <button onClick={onCancelDelete} className="text-[10px] text-muted-foreground px-1 hover:text-foreground">
            Cancel
          </button>
        </div>
      )}

      {isActive && !isEditing && !confirmDelete && (
        <ChevronRight size={12} className="shrink-0 text-primary" />
      )}
    </div>
  );
}

function IconBtn({
  icon,
  onClick,
  title,
  danger = false,
}: {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "p-1 rounded hover:bg-muted transition-colors",
        danger ? "hover:text-destructive text-muted-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
    </button>
  );
}
