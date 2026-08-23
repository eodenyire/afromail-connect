import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, Send, XCircle, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { actions, useMail, type Message } from "@/lib/mailStore";

type Tab = "all" | "queued" | "sent" | "failed";

const statusOf = (m: Message) => m.deliveryStatus ?? (m.folderId === "sent" ? "sent" : "queued");

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, { icon: React.ElementType; cls: string; text: string }> = {
    queued: { icon: Clock, cls: "bg-accent/15 text-accent", text: "Queued" },
    sending: { icon: RefreshCw, cls: "bg-primary/15 text-primary", text: "Sending" },
    sent: { icon: CheckCircle2, cls: "bg-primary/15 text-primary", text: "Sent" },
    failed: { icon: AlertTriangle, cls: "bg-destructive/15 text-destructive", text: "Failed" },
  };
  const s = map[status] ?? map.queued;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${s.cls}`}>
      <Icon size={11} /> {s.text}
    </span>
  );
};

const DeliveryQueue = () => {
  const messages = useMail(s => s.messages);
  const [tab, setTab] = useState<Tab>("all");
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [when, setWhen] = useState("");

  // Mock MTA tick: deliver anything that is due.
  useEffect(() => {
    actions.processQueue();
    const t = setInterval(() => actions.processQueue(), 5000);
    return () => clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    const all = messages
      .filter(m => m.deliveryStatus || m.scheduledAt)
      .sort((a, b) => +new Date(b.scheduledAt ?? b.date) - +new Date(a.scheduledAt ?? a.date));
    if (tab === "all") return all;
    return all.filter(m => statusOf(m) === tab);
  }, [messages, tab]);

  const counts = useMemo(() => {
    const c = { queued: 0, sent: 0, failed: 0 };
    messages.forEach(m => {
      if (!m.deliveryStatus && !m.scheduledAt) return;
      const s = statusOf(m);
      if (s === "queued" || s === "sending") c.queued++;
      else if (s === "sent") c.sent++;
      else if (s === "failed") c.failed++;
    });
    return c;
  }, [messages]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "queued", label: "Queued", count: counts.queued },
    { id: "sent", label: "Sent", count: counts.sent },
    { id: "failed", label: "Failed", count: counts.failed },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-lg font-bold">Delivery queue</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Scheduled and outbound mail — retry or reschedule anything that fails.</p>
        <div className="flex items-center gap-1 mt-3">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                tab === t.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {t.label}{t.count !== undefined ? ` (${t.count})` : ""}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={() => { actions.processQueue(); toast.success("Queue processed"); }} className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-muted">
            <RefreshCw size={12} /> Process now
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {rows.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-16">Nothing in the delivery queue.</div>
        )}
        {rows.map(m => {
          const status = statusOf(m);
          return (
            <div key={m.id} className="border border-border rounded-lg bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={status} />
                    <span className="text-sm font-semibold truncate">{m.subject || "(no subject)"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    From {m.fromEmail} · To {m.to.join(", ") || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {status === "sent"
                      ? `Delivered ${new Date(m.date).toLocaleString()}`
                      : `Scheduled ${new Date(m.scheduledAt ?? m.date).toLocaleString()}`}
                    {m.deliveryAttempts ? ` · ${m.deliveryAttempts} attempt${m.deliveryAttempts > 1 ? "s" : ""}` : ""}
                  </div>
                  {m.deliveryError && (
                    <div className="text-xs text-destructive mt-1">{m.deliveryError}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {status === "failed" && (
                    <button onClick={() => { actions.retryDelivery([m.id]); toast.success("Retrying delivery"); }} title="Retry" className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted">
                      <RefreshCw size={12} /> Retry
                    </button>
                  )}
                  {(status === "queued" || status === "sending") && (
                    <>
                      <button onClick={() => { actions.sendQueuedNow([m.id]); toast.success("Sending now"); }} title="Send now" className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted">
                        <Send size={12} /> Send now
                      </button>
                      <button onClick={() => { setRescheduling(rescheduling === m.id ? null : m.id); setWhen(""); }} title="Reschedule" className="p-1.5 rounded-md border border-border hover:bg-muted"><CalendarClock size={13} /></button>
                      <button onClick={() => { actions.cancelScheduled([m.id]); toast.success("Cancelled — moved to Drafts"); }} title="Cancel" className="p-1.5 rounded-md border border-border hover:bg-muted text-destructive"><XCircle size={13} /></button>
                    </>
                  )}
                </div>
              </div>

              {rescheduling === m.id && (
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                  <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="bg-muted/40 border border-border rounded-md px-2 py-1 text-xs outline-none" />
                  <button
                    onClick={() => {
                      const dt = new Date(when);
                      if (!when || isNaN(dt.getTime())) return toast.error("Pick a valid time");
                      actions.rescheduleDelivery(m.id, dt.toISOString());
                      setRescheduling(null);
                      toast.success(`Rescheduled for ${dt.toLocaleString()}`);
                    }}
                    className="text-xs bg-primary text-primary-foreground rounded-md px-3 py-1.5 font-semibold hover:opacity-90"
                  >
                    Reschedule
                  </button>
                  <button onClick={() => setRescheduling(null)} className="text-xs px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground">Cancel</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeliveryQueue;
