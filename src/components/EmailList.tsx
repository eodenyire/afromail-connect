import { Star, Paperclip, Mail, MailOpen, Trash2, X, Pin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useMail, type Message, type Account, type Label } from "@/lib/mailStore";

export interface ThreadRow {
  threadId: string;
  latest: Message;
  count: number;
  hasUnread: boolean;
  hasStar: boolean;
  hasAttachment: boolean;
  pinned: boolean;
}

interface EmailListProps {
  threads: ThreadRow[];
  selectedThreadId: string | null;
  onSelect: (threadId: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (threadId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkMarkRead: () => void;
  onBulkMarkUnread: () => void;
  onBulkStar: () => void;
  onBulkDelete: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const EmailList = ({
  threads, selectedThreadId, onSelect,
  selectedIds, onToggleSelect, onSelectAll, onDeselectAll,
  onBulkMarkRead, onBulkMarkUnread, onBulkStar, onBulkDelete,
}: EmailListProps) => {
  const accounts = useMail(s => s.accounts);
  const labels = useMail(s => s.labels);
  const hasSelection = selectedIds.size > 0;
  const allSelected = threads.length > 0 && selectedIds.size === threads.length;

  const acctById = (id: string): Account | undefined => accounts.find(a => a.id === id);
  const lblById = (id: string): Label | undefined => labels.find(l => l.id === id);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30 flex-shrink-0">
        <Checkbox
          checked={allSelected}
          onCheckedChange={() => allSelected ? onDeselectAll() : onSelectAll()}
          className="mr-1"
        />
        {hasSelection ? (
          <>
            <span className="text-xs text-muted-foreground mr-auto">{selectedIds.size} selected</span>
            <button onClick={onBulkMarkRead} title="Mark read" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><MailOpen size={14} /></button>
            <button onClick={onBulkMarkUnread} title="Mark unread" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Mail size={14} /></button>
            <button onClick={onBulkStar} title="Star" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Star size={14} /></button>
            <button onClick={onBulkDelete} title="Delete" className="p-1.5 rounded hover:bg-muted text-destructive"><Trash2 size={14} /></button>
            <button onClick={onDeselectAll} title="Cancel" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{threads.length} conversations</span>
        )}
      </div>

      {threads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
          Nothing here yet.
        </div>
      ) : threads.map(t => {
        const m = t.latest;
        const isChecked = selectedIds.has(t.threadId);
        const isActive = selectedThreadId === t.threadId;
        const acct = acctById(m.accountId);
        return (
          <div
            key={t.threadId}
            className={`w-full text-left px-4 py-3 border-b border-border flex gap-3 animate-fade-in transition-colors ${
              isActive ? "bg-primary/5 border-l-2 border-l-primary"
                : isChecked ? "bg-primary/5"
                : t.hasUnread ? "bg-card hover:bg-muted/30"
                : "hover:bg-muted/50"
            }`}
          >
            <div className="flex items-start pt-1">
              <Checkbox checked={isChecked} onCheckedChange={() => onToggleSelect(t.threadId)} />
            </div>
            <button onClick={() => onSelect(t.threadId)} className="flex gap-3 flex-1 min-w-0 text-left">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold bg-primary/15 text-primary">
                  {getInitials(m.fromName)}
                </div>
                {acct && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card"
                    style={{ background: acct.color }}
                    title={acct.email}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5 gap-2">
                  <span className={`text-sm truncate ${t.hasUnread ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                    {m.fromName}{t.count > 1 && <span className="text-muted-foreground font-normal"> ({t.count})</span>}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatDate(m.date)}</span>
                </div>
                <div className={`text-sm truncate mb-0.5 ${t.hasUnread ? "font-medium text-foreground/90" : "text-muted-foreground"}`}>
                  {m.subject || "(no subject)"}
                </div>
                <div className="text-xs text-muted-foreground truncate">{m.bodyText.slice(0, 120)}</div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {t.pinned && <Pin size={12} className="text-primary" />}
                  {t.hasStar && <Star size={12} className="text-accent fill-accent" />}
                  {t.hasAttachment && <Paperclip size={12} className="text-muted-foreground" />}
                  {m.labelIds.map(id => {
                    const l = lblById(id);
                    if (!l) return null;
                    return (
                      <span key={id} className="text-[10px] rounded px-1.5 py-0.5 font-medium" style={{ background: `hsl(${l.color} / 0.15)`, color: `hsl(${l.color})` }}>
                        {l.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default EmailList;
