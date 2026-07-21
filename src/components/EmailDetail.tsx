import { ArrowLeft, Star, Reply, ReplyAll, Forward, Trash2, MoreHorizontal, Paperclip, Archive, Ban, Clock, Tag, Send, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useMail, threadMessages, actions, type Message } from "@/lib/mailStore";
import { toast } from "sonner";

interface EmailDetailProps {
  threadId: string | null;
  onBack: () => void;
  onReply: (msg: Message, mode: "reply" | "replyAll" | "forward") => void;
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const EmailDetail = ({ threadId, onBack, onReply }: EmailDetailProps) => {
  const state = useMail(s => s);
  const msgs = useMemo(() => threadId ? threadMessages(state, threadId) : [], [state, threadId]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [inlineOpen, setInlineOpen] = useState(false);
  const inlineRef = useRef<HTMLDivElement>(null);

  if (!threadId || msgs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-3">📬</div>
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm mt-1">Choose one from your unified inbox</p>
        </div>
      </div>
    );
  }

  const latest = msgs[msgs.length - 1];
  const ids = msgs.map(m => m.id);
  const anyStarred = msgs.some(m => m.starred);

  return (
    <div className="flex-1 flex flex-col animate-slide-in">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-muted md:hidden"><ArrowLeft size={18} /></button>
        <div className="flex-1 truncate font-semibold text-sm">{latest.subject || "(no subject)"}</div>
        <button onClick={() => { actions.toggleStar(ids); }} title="Star" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
          <Star size={18} className={anyStarred ? "fill-accent text-accent" : ""} />
        </button>
        <button onClick={() => { actions.archive(ids); toast.success("Archived"); onBack(); }} title="Archive" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><Archive size={18} /></button>
        <button onClick={() => { actions.spam(ids); toast.success("Marked as spam"); onBack(); }} title="Spam" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><Ban size={18} /></button>
        <button onClick={() => { actions.snooze(ids, new Date(Date.now() + 86_400_000).toISOString()); toast.success("Snoozed until tomorrow"); onBack(); }} title="Snooze 1 day" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><Clock size={18} /></button>
        <button onClick={() => { actions.trash(ids); toast.success("Moved to trash"); onBack(); }} title="Delete" className="p-1.5 rounded-md hover:bg-muted text-destructive"><Trash2 size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {msgs.map((m, i) => {
          const isLast = i === msgs.length - 1;
          const isOpen = expanded[m.id] ?? isLast;
          return (
            <div key={m.id} className="border border-border rounded-lg overflow-hidden bg-card">
              <button
                onClick={() => setExpanded(e => ({ ...e, [m.id]: !isOpen }))}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold bg-primary/15 text-primary flex-shrink-0">
                  {getInitials(m.fromName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{m.fromName}</span>
                    <span className="text-xs text-muted-foreground truncate">&lt;{m.fromEmail}&gt;</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    to {m.to.join(", ")}
                    {m.cc.length > 0 && ` · cc ${m.cc.join(", ")}`}
                  </div>
                  {!isOpen && <div className="text-xs text-muted-foreground mt-1 truncate">{m.bodyText.slice(0, 140)}</div>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatFullDate(m.date)}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  {m.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {m.attachments.map(a => (
                        <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border text-xs">
                          <Paperclip size={12} className="text-muted-foreground" />
                          <span>{a.name}</span>
                          <span className="text-muted-foreground">{Math.round(a.size / 1024)} KB</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-foreground/85 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: m.bodyHtml }} />
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => onReply(m, "reply")} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted"><Reply size={13} /> Reply</button>
                    <button onClick={() => onReply(m, "replyAll")} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted"><ReplyAll size={13} /> Reply all</button>
                    <button onClick={() => onReply(m, "forward")} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted"><Forward size={13} /> Forward</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmailDetail;
