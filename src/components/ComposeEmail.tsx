import { useState, useRef, useCallback, useEffect } from "react";
import { X, ChevronDown, Bold, Italic, Underline, List, ListOrdered, Link2, Paperclip, Trash2, Send, Minus, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { useMail, actions, type Attachment } from "@/lib/mailStore";

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024; // keep localStorage sane

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

const formatBytes = (b: number) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`;


export interface ComposeState {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  bodyHtml?: string;
  inReplyTo?: string;
  threadId?: string;
  accountId?: string;
}

interface ComposeEmailProps {
  open: boolean;
  onClose: () => void;
  initial?: ComposeState;
}

const ToolbarButton = ({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} title={label} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
    <Icon size={15} />
  </button>
);

const ChipInput = ({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) => {
  const [input, setInput] = useState("");
  const contacts = useMail(s => s.contacts);
  const suggestions = input.trim()
    ? contacts.filter(c => (c.email.toLowerCase().includes(input.toLowerCase()) || c.name.toLowerCase().includes(input.toLowerCase())) && !value.includes(c.email)).slice(0, 5)
    : [];

  const add = (email: string) => {
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Invalid email"); return; }
    if (!value.includes(email)) onChange([...value, email]);
    setInput("");
  };

  return (
    <div className="relative flex items-start gap-2 px-4 py-2 border-b border-border">
      <span className="text-xs font-medium text-muted-foreground pt-1.5 w-8 shrink-0">{label}</span>
      <div className="flex-1 flex flex-wrap items-center gap-1.5 min-h-[32px]">
        {value.map((e, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-muted text-foreground text-xs rounded-full px-2.5 py-1">
            {e}
            <button onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="hover:text-destructive"><X size={12} /></button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === "," || e.key === "Tab") { e.preventDefault(); add(input.trim()); }
            else if (e.key === "Backspace" && !input && value.length > 0) onChange(value.slice(0, -1));
          }}
          onBlur={() => input.trim() && add(input.trim())}
          placeholder={value.length === 0 ? "name@example.com" : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="absolute left-14 top-full z-10 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[240px]">
          {suggestions.map(c => (
            <button key={c.id} onMouseDown={e => { e.preventDefault(); add(c.email); }} className="w-full flex flex-col text-left px-3 py-1.5 hover:bg-muted">
              <span className="text-sm">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ComposeEmail = ({ open, onClose, initial }: ComposeEmailProps) => {
  const accounts = useMail(s => s.accounts);
  const autosaveSeconds = useMail(s => s.settings.autosaveSeconds);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [bodyTick, setBodyTick] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirtyRef = useRef(false);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    const next: Attachment[] = [];
    for (const f of list) {
      if (f.size > MAX_ATTACHMENT_BYTES) { toast.error(`${f.name} is larger than 2 MB`); continue; }
      try {
        const url = await readFileAsDataUrl(f);
        next.push({ id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: f.name, size: f.size, mime: f.type || "application/octet-stream", url });
      } catch { toast.error(`Could not read ${f.name}`); }
    }
    if (next.length) {
      setAttachments(prev => [...prev, ...next]);
      dirtyRef.current = true;
      toast.success(`${next.length} file${next.length > 1 ? "s" : ""} attached`);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const acct = initial?.accountId ?? accounts.find(a => a.isDefault)?.id ?? accounts[0]?.id ?? "";
    setSelectedAccountId(acct);
    setTo(initial?.to ?? []);
    setCc(initial?.cc ?? []);
    setBcc(initial?.bcc ?? []);
    setSubject(initial?.subject ?? "");
    setShowCcBcc(!!(initial?.cc?.length || initial?.bcc?.length));
    setMinimized(false);
    setShowSchedule(false);
    setScheduleAt("");
    setDraftId(undefined);
    setAttachments([]);
    setSavedAt(null);
    dirtyRef.current = false;
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = initial?.bodyHtml ?? "";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Autosave draft on interval when dirty
  useEffect(() => {
    if (!open) return;
    const ms = Math.max(2, autosaveSeconds) * 1000;
    const t = setInterval(() => {
      if (!dirtyRef.current || !selectedAccountId) return;
      const hasContent = to.length || cc.length || bcc.length || subject.trim() || editorRef.current?.innerHTML.trim();
      if (!hasContent) return;
      const id = draftId ?? `draft-${Date.now()}`;
      actions.saveDraft({
        id,
        accountId: selectedAccountId,
        to, cc, bcc, subject,
        bodyHtml: editorRef.current?.innerHTML ?? "",
        attachments,
        inReplyTo: initial?.inReplyTo,
        threadId: initial?.threadId,
      });
      if (!draftId) setDraftId(id);
      setSavedAt(new Date());
      dirtyRef.current = false;
    }, ms);
    return () => clearInterval(t);
  }, [open, autosaveSeconds, selectedAccountId, to, cc, bcc, subject, draftId, initial?.inReplyTo, initial?.threadId, bodyTick]);

  const markDirty = () => { dirtyRef.current = true; };

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    markDirty();
  }, []);

  const doSend = (scheduledAt?: string) => {
    if (!selectedAccountId) return toast.error("Select an account");
    if (to.length === 0) return toast.error("Add at least one recipient");
    if (!subject.trim()) return toast.error("Add a subject");
    setSending(true);
    actions.sendMessage({
      accountId: selectedAccountId,
      to, cc, bcc,
      subject,
      bodyHtml: editorRef.current?.innerHTML ?? "",
      inReplyTo: initial?.inReplyTo,
      threadId: initial?.threadId,
      attachments,
      scheduledAt,
    });
    if (draftId) actions.deleteDraft(draftId);
    setSending(false);
    toast.success(scheduledAt ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}` : "Sent");
    onClose();
  };

  const confirmSchedule = () => {
    if (!scheduleAt) return toast.error("Pick a date & time");
    const dt = new Date(scheduleAt);
    if (isNaN(dt.getTime()) || dt.getTime() <= Date.now()) return toast.error("Pick a future time");
    doSend(dt.toISOString());
  };

  const saveDraft = () => {
    if (!selectedAccountId) { onClose(); return; }
    const hasContent = to.length || cc.length || bcc.length || subject.trim() || editorRef.current?.innerHTML.trim();
    if (hasContent) {
      actions.saveDraft({
        id: draftId,
        accountId: selectedAccountId,
        to, cc, bcc, subject,
        bodyHtml: editorRef.current?.innerHTML ?? "",
        attachments,
        inReplyTo: initial?.inReplyTo,
        threadId: initial?.threadId,
      });
      toast.success("Draft saved");
    }
    onClose();
  };

  if (!open) return null;
  const currentAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className={`fixed z-50 bg-card border border-border rounded-t-xl shadow-2xl flex flex-col transition-all duration-200 ${
      minimized ? "bottom-0 right-4 w-72 h-11" : "bottom-0 right-4 w-full max-w-[560px] h-[560px]"
    }`}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-foreground/[0.03] border-b border-border rounded-t-xl cursor-pointer select-none" onClick={() => setMinimized(!minimized)}>
        <span className="text-sm font-semibold truncate">{subject || "New Message"}</span>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => setMinimized(!minimized)} className="p-1 hover:bg-muted rounded"><Minus size={14} /></button>
          <button onClick={saveDraft} className="p-1 hover:bg-muted rounded"><X size={14} /></button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="relative px-4 py-2 border-b border-border">
            <button onClick={() => setProviderDropdownOpen(!providerDropdownOpen)} className="flex items-center gap-2 text-sm hover:bg-muted px-2 py-1 rounded">
              <span className="w-3 h-3 rounded-full" style={{ background: currentAccount?.color }} />
              <span className="font-medium">{currentAccount?.email ?? "Choose account"}</span>
              <ChevronDown size={13} className="text-muted-foreground" />
            </button>
            {providerDropdownOpen && (
              <div className="absolute top-full left-4 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 py-1 min-w-[240px]">
                {accounts.map(a => (
                  <button key={a.id} onClick={() => { setSelectedAccountId(a.id); setProviderDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted ${selectedAccountId === a.id ? "bg-muted/50 font-medium" : ""}`}>
                    <span className="w-3 h-3 rounded-full" style={{ background: a.color }} />
                    <span className="truncate">{a.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <ChipInput label="To" value={to} onChange={v => { setTo(v); markDirty(); }} />
          {!showCcBcc && (
            <div className="px-4 py-1 border-b border-border">
              <button onClick={() => setShowCcBcc(true)} className="text-xs text-primary hover:underline font-medium">Cc / Bcc</button>
            </div>
          )}
          {showCcBcc && (<><ChipInput label="Cc" value={cc} onChange={v => { setCc(v); markDirty(); }} /><ChipInput label="Bcc" value={bcc} onChange={v => { setBcc(v); markDirty(); }} /></>)}

          <div className="px-4 py-2 border-b border-border">
            <input value={subject} onChange={e => { setSubject(e.target.value); markDirty(); }} placeholder="Subject" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50" />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div ref={editorRef} contentEditable onInput={() => { markDirty(); setBodyTick(t => t + 1); }} className="flex-1 px-4 py-3 text-sm outline-none overflow-y-auto" style={{ minHeight: 80 }} />
          </div>

          <div className="px-3 py-1 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border">
            <span>{savedAt ? `Draft saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Draft autosaves as you type"}</span>
          </div>

          {showSchedule && (
            <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium">Send at:</span>
              <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} className="bg-card border border-border rounded-md px-2 py-1 text-xs outline-none" />
              <button onClick={() => { const dt = new Date(Date.now() + 3600_000); setScheduleAt(new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16)); }} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">+1h</button>
              <button onClick={() => { const dt = new Date(); dt.setDate(dt.getDate()+1); dt.setHours(9,0,0,0); setScheduleAt(new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16)); }} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">Tomorrow 9am</button>
              <div className="flex-1" />
              <button onClick={() => setShowSchedule(false)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">Cancel</button>
              <button onClick={confirmSchedule} className="text-xs bg-primary text-primary-foreground rounded-md px-3 py-1 font-semibold hover:opacity-90">Schedule</button>
            </div>
          )}

          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <div className="flex items-center gap-0.5">
              <ToolbarButton icon={Bold} label="Bold" onClick={() => execCommand("bold")} />
              <ToolbarButton icon={Italic} label="Italic" onClick={() => execCommand("italic")} />
              <ToolbarButton icon={Underline} label="Underline" onClick={() => execCommand("underline")} />
              <div className="w-px h-4 bg-border mx-1" />
              <ToolbarButton icon={List} label="Bullets" onClick={() => execCommand("insertUnorderedList")} />
              <ToolbarButton icon={ListOrdered} label="Numbered" onClick={() => execCommand("insertOrderedList")} />
              <div className="w-px h-4 bg-border mx-1" />
              <ToolbarButton icon={Link2} label="Link" onClick={() => { const u = prompt("URL:"); if (u) execCommand("createLink", u); }} />
              <ToolbarButton icon={Paperclip} label="Attach" onClick={() => toast.info("Attachments coming soon")} />
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => { if (draftId) actions.deleteDraft(draftId); onClose(); }} className="p-2 text-muted-foreground hover:text-destructive rounded" title="Discard"><Trash2 size={16} /></button>
              <button onClick={() => setShowSchedule(s => !s)} className={`p-2 rounded ${showSchedule ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`} title="Schedule send"><Clock size={16} /></button>
              <button onClick={() => doSend()} disabled={sending} className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-1.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Send size={14} /> {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ComposeEmail;
