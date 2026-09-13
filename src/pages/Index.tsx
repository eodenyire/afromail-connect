import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import EmailSidebar from "@/components/EmailSidebar";
import EmailList, { type ThreadRow } from "@/components/EmailList";
import EmailDetail from "@/components/EmailDetail";
import ComposeEmail, { type ComposeState } from "@/components/ComposeEmail";
import { CommandPalette } from "@/components/CommandPalette";
import { Menu, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  actions, belongsToFolder, folderLabel, searchMessages, setActiveUser, useMail,
  type Message,
} from "@/lib/mailStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const Index = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFolder = useMail(s => s.settings.defaultFolder);
  const [activeView, setActiveView] = useState<string>(defaultFolder);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInitial, setComposeInitial] = useState<ComposeState | undefined>();

  useEffect(() => { setActiveUser(user?.id); }, [user?.id]);

  // Deep-link: /?compose=email@x.com opens the composer prefilled.
  useEffect(() => {
    const to = searchParams.get("compose");
    if (to) {
      setComposeInitial({ to: [to] });
      setComposeOpen(true);
      searchParams.delete("compose");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const state = useMail(s => s);

  const threads: ThreadRow[] = useMemo(() => {
    // 1. start from search results if any, else all messages
    const base = searchQuery.trim() ? searchMessages(state, searchQuery) : state.messages;
    // 2. filter by view
    let filtered: Message[] = base;
    if (activeView.startsWith("label:")) {
      const labelId = activeView.slice(6);
      filtered = base.filter(m => m.labelIds.includes(labelId) && m.folderId !== "trash");
    } else if (activeView.startsWith("acct:")) {
      const acctId = activeView.slice(5);
      filtered = base.filter(m => m.accountId === acctId && m.folderId !== "trash");
    } else {
      filtered = base.filter(m => belongsToFolder(m, activeView));
    }
    // 3. group
    const map = new Map<string, Message[]>();
    filtered.forEach(m => {
      const arr = map.get(m.threadId) ?? [];
      arr.push(m);
      map.set(m.threadId, arr);
    });
    const out: ThreadRow[] = [];
    map.forEach((msgs, threadId) => {
      msgs.sort((a, b) => +new Date(b.date) - +new Date(a.date));
      const latest = msgs[0];
      out.push({
        threadId,
        latest,
        count: msgs.length,
        hasUnread: msgs.some(m => !m.read),
        hasStar: msgs.some(m => m.starred),
        hasAttachment: msgs.some(m => m.attachments.length > 0),
        pinned: msgs.some(m => m.pinned ?? false),
      });
    });
    return out.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return +new Date(b.latest.date) - +new Date(a.latest.date);
    });
  }, [state, activeView, searchQuery]);

  // Clear selection & selected thread when view changes
  useEffect(() => { setSelectedThreadId(null); setSelectedIds(new Set()); }, [activeView]);

  // Mark thread messages read on open
  useEffect(() => {
    if (!selectedThreadId) return;
    const ids = state.messages.filter(m => m.threadId === selectedThreadId && !m.read).map(m => m.id);
    if (ids.length) actions.toggleRead(ids, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId]);

  const collectMessageIds = useCallback((threadIds: Set<string>) =>
    state.messages.filter(m => threadIds.has(m.threadId)).map(m => m.id),
    [state.messages],
  );

  const openCompose = (initial?: ComposeState) => { setComposeInitial(initial); setComposeOpen(true); };
  const handleReply = (msg: Message, mode: "reply" | "replyAll" | "forward") => {
    const acct = state.accounts.find(a => a.email.toLowerCase() === msg.to[0]?.toLowerCase()) ?? state.accounts.find(a => a.isDefault) ?? state.accounts[0];
    const quoted = `<br/><br/><blockquote style="border-left:2px solid #ccc;padding-left:8px;color:#666">On ${new Date(msg.date).toLocaleString()}, ${msg.fromName} wrote:<br/>${msg.bodyHtml}</blockquote>`;
    if (mode === "forward") {
      openCompose({
        accountId: acct?.id,
        subject: `Fwd: ${msg.subject}`,
        bodyHtml: quoted,
      });
    } else {
      openCompose({
        accountId: acct?.id,
        to: [msg.fromEmail],
        cc: mode === "replyAll" ? msg.cc : [],
        subject: msg.subject.startsWith("Re:") ? msg.subject : `Re: ${msg.subject}`,
        bodyHtml: quoted,
        inReplyTo: msg.id,
        threadId: msg.threadId,
      });
    }
  };

  const bulkIds = () => collectMessageIds(selectedIds);
  const handleBulkMarkRead = () => { actions.toggleRead(bulkIds(), true); setSelectedIds(new Set()); };
  const handleBulkMarkUnread = () => { actions.toggleRead(bulkIds(), false); setSelectedIds(new Set()); };
  const handleBulkStar = () => { actions.toggleStar(bulkIds()); setSelectedIds(new Set()); };
  const handleBulkDelete = () => { actions.trash(bulkIds()); setSelectedIds(new Set()); if (selectedThreadId && selectedIds.has(selectedThreadId)) setSelectedThreadId(null); };
  const handleBulkMove = (folderId: string) => { actions.moveToFolder(bulkIds(), folderId); setSelectedIds(new Set()); setSelectedThreadId(null); };
  const handleBulkApplyLabel = (labelId: string) => { actions.applyLabel(bulkIds(), labelId); setSelectedIds(new Set()); };
  const handleBulkRemoveLabel = (labelId: string) => { actions.removeLabel(bulkIds(), labelId); setSelectedIds(new Set()); };

  useKeyboardShortcuts({
    "c": () => openCompose(),
    "/": () => (document.getElementById("mail-search") as HTMLInputElement | null)?.focus(),
    "gi": () => setActiveView("inbox"),
    "gs": () => setActiveView("starred"),
    "gd": () => setActiveView("drafts"),
    "gt": () => setActiveView("sent"),
    "ga": () => setActiveView("all"),
    "Escape": () => { setSelectedThreadId(null); setSelectedIds(new Set()); },
  }, state.settings.shortcutsEnabled);

  const viewTitle = useMemo(() => {
    if (activeView.startsWith("label:")) return state.labels.find(l => l.id === activeView.slice(6))?.name ?? "Label";
    if (activeView.startsWith("acct:")) return state.accounts.find(a => a.id === activeView.slice(5))?.email ?? "Account";
    return folderLabel(activeView, state.customFolders);
  }, [activeView, state]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 md:relative md:z-auto transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <EmailSidebar
          activeView={activeView}
          onViewChange={(v) => { setActiveView(v); setSidebarOpen(false); }}
          onCompose={() => { openCompose(); setSidebarOpen(false); }}
        />
      </div>

      {activeView === "queue" ? (
        <div className="flex-1 flex flex-col bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border md:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md hover:bg-muted"><Menu size={20} /></button>
            <span className="font-semibold text-sm flex-1 truncate">Delivery queue</span>
          </div>
          <DeliveryQueue />
        </div>
      ) : (
      <>
      <div className={`flex flex-col w-full md:w-96 border-r border-border bg-card flex-shrink-0 ${selectedThreadId ? "hidden md:flex" : "flex"}`}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md hover:bg-muted md:hidden"><Menu size={20} /></button>
          <span className="font-semibold text-sm flex-1 truncate">{viewTitle}</span>
        </div>
        <div className="border-b border-border px-4 py-2">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <input
              id="mail-search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search — try is:unread, has:attachment, label:work"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            )}
          </div>
        </div>
        <EmailList
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelect={setSelectedThreadId}
          selectedIds={selectedIds}
          onToggleSelect={id => {
            setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
          }}
          onSelectAll={() => setSelectedIds(new Set(threads.map(t => t.threadId)))}
          onDeselectAll={() => setSelectedIds(new Set())}
          onBulkMarkRead={handleBulkMarkRead}
          onBulkMarkUnread={handleBulkMarkUnread}
          onBulkStar={handleBulkStar}
          onBulkDelete={handleBulkDelete}
          onBulkMove={handleBulkMove}
          onBulkApplyLabel={handleBulkApplyLabel}
          onBulkRemoveLabel={handleBulkRemoveLabel}
        />
      </div>

      <div className={`flex-1 flex flex-col bg-card ${selectedThreadId ? "flex" : "hidden md:flex"}`}>
        <EmailDetail threadId={selectedThreadId} onBack={() => setSelectedThreadId(null)} onReply={handleReply} />
      </div>
      </>
      )}

      <ComposeEmail open={composeOpen} onClose={() => setComposeOpen(false)} initial={composeInitial} />
      <CommandPalette onCompose={() => openCompose()} onFolderChange={setActiveView} />
    </div>
  );
};

export default Index;
