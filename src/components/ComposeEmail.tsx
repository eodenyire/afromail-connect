import { useState, useRef, useCallback } from "react";
import { X, ChevronDown, Bold, Italic, Underline, List, ListOrdered, Link2, Paperclip, Trash2, Send, Minus } from "lucide-react";
import { providers, type EmailProvider } from "@/data/mockEmails";
import { toast } from "sonner";

interface ComposeEmailProps {
  open: boolean;
  onClose: () => void;
}

const connectedProviders = providers.filter(p => p.connected);

const providerColorMap: Record<string, string> = {
  afromail: 'bg-provider-afromail',
  gmail: 'bg-provider-gmail',
  outlook: 'bg-provider-outlook',
  yahoo: 'bg-provider-yahoo',
  protonmail: 'bg-provider-proton',
  icloud: 'bg-provider-icloud',
  zoho: 'bg-provider-zoho',
  aol: 'bg-provider-aol',
  yandex: 'bg-provider-yandex',
  fastmail: 'bg-provider-fastmail',
  tutanota: 'bg-provider-tutanota',
};

const EmailChipInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (val: string[]) => void;
}) => {
  const [input, setInput] = useState("");

  const addChip = () => {
    const trimmed = input.trim();
    if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    } else if (trimmed) {
      toast.error("Invalid email address");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addChip();
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex items-start gap-2 px-4 py-2 border-b border-border">
      <span className="text-xs font-medium text-muted-foreground pt-1.5 w-8 shrink-0">{label}</span>
      <div className="flex-1 flex flex-wrap items-center gap-1.5 min-h-[32px]">
        {value.map((email, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-muted text-foreground text-xs rounded-full px-2.5 py-1"
          >
            {email}
            <button
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="hover:text-destructive"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addChip}
          placeholder={value.length === 0 ? "name@example.com" : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>
    </div>
  );
};

const ToolbarButton = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`p-1.5 rounded transition-colors ${
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`}
  >
    <Icon size={15} />
  </button>
);

const ComposeEmail = ({ open, onClose }: ComposeEmailProps) => {
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider>(connectedProviders[0]?.id || "afromail");
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sending, setSending] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (to.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please add a subject");
      return;
    }

    setSending(true);
    // Simulate send
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    toast.success(`Email sent via ${providers.find(p => p.id === selectedProvider)?.name || selectedProvider}`);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTo([]);
    setCc([]);
    setBcc([]);
    setSubject("");
    setShowCcBcc(false);
    setMinimized(false);
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const handleDiscard = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  const currentProvider = providers.find(p => p.id === selectedProvider);

  return (
    <div
      className={`fixed z-50 bg-card border border-border rounded-t-xl shadow-2xl flex flex-col transition-all duration-200 ${
        minimized
          ? "bottom-0 right-4 w-72 h-11"
          : "bottom-0 right-4 w-full max-w-[560px] h-[520px] sm:h-[540px]"
      }`}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-foreground/[0.03] border-b border-border rounded-t-xl cursor-pointer select-none"
        onClick={() => setMinimized(!minimized)}
      >
        <span className="text-sm font-semibold text-foreground truncate">
          {subject || "New Message"}
        </span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setMinimized(!minimized)} className="p-1 hover:bg-muted rounded">
            <Minus size={14} className="text-muted-foreground" />
          </button>
          <button onClick={handleDiscard} className="p-1 hover:bg-muted rounded">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Provider selector */}
          <div className="relative px-4 py-2 border-b border-border">
            <button
              onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
              className="flex items-center gap-2 text-sm text-foreground hover:bg-muted px-2 py-1 rounded transition-colors"
            >
              <span className={`w-4 h-4 rounded-full ${providerColorMap[selectedProvider]} flex items-center justify-center text-[9px]`}>
                {currentProvider?.icon}
              </span>
              <span className="font-medium">{currentProvider?.name}</span>
              <ChevronDown size={13} className="text-muted-foreground" />
            </button>
            {providerDropdownOpen && (
              <div className="absolute top-full left-4 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 py-1 min-w-[180px]">
                {connectedProviders.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProvider(p.id);
                      setProviderDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                      selectedProvider === p.id ? "bg-muted/50 font-medium" : ""
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${providerColorMap[p.id]} flex items-center justify-center text-[9px]`}>
                      {p.icon}
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* To */}
          <EmailChipInput label="To" value={to} onChange={setTo} />

          {/* Cc/Bcc toggle */}
          {!showCcBcc && (
            <div className="px-4 py-1 border-b border-border">
              <button
                onClick={() => setShowCcBcc(true)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Cc / Bcc
              </button>
            </div>
          )}

          {showCcBcc && (
            <>
              <EmailChipInput label="Cc" value={cc} onChange={setCc} />
              <EmailChipInput label="Bcc" value={bcc} onChange={setBcc} />
            </>
          )}

          {/* Subject */}
          <div className="px-4 py-2 border-b border-border">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              maxLength={200}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Rich text editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              ref={editorRef}
              contentEditable
              className="flex-1 px-4 py-3 text-sm text-foreground outline-none overflow-y-auto"
              style={{ minHeight: 80 }}
              data-placeholder="Write your message..."
              onFocus={(e) => {
                if (e.currentTarget.textContent === "") {
                  e.currentTarget.classList.add("empty");
                }
              }}
            />
          </div>

          {/* Toolbar & Send */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <div className="flex items-center gap-0.5">
              <ToolbarButton icon={Bold} label="Bold" onClick={() => execCommand("bold")} />
              <ToolbarButton icon={Italic} label="Italic" onClick={() => execCommand("italic")} />
              <ToolbarButton icon={Underline} label="Underline" onClick={() => execCommand("underline")} />
              <div className="w-px h-4 bg-border mx-1" />
              <ToolbarButton icon={List} label="Bullet list" onClick={() => execCommand("insertUnorderedList")} />
              <ToolbarButton icon={ListOrdered} label="Numbered list" onClick={() => execCommand("insertOrderedList")} />
              <div className="w-px h-4 bg-border mx-1" />
              <ToolbarButton
                icon={Link2}
                label="Insert link"
                onClick={() => {
                  const url = prompt("Enter URL:");
                  if (url) execCommand("createLink", url);
                }}
              />
              <ToolbarButton icon={Paperclip} label="Attach file" onClick={() => toast.info("Attachments coming soon")} />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscard}
                className="p-2 text-muted-foreground hover:text-destructive rounded transition-colors"
                title="Discard"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send size={14} />
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ComposeEmail;
