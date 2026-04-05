import { ArrowLeft, Star, Reply, Forward, Trash2, MoreHorizontal, Paperclip } from "lucide-react";
import type { Email } from "@/data/mockEmails";

interface EmailDetailProps {
  email: Email | null;
  onBack: () => void;
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const EmailDetail = ({ email, onBack }: EmailDetailProps) => {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-3">📬</div>
          <p className="text-lg font-medium">Select an email to read</p>
          <p className="text-sm mt-1">Choose from your unified inbox</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col animate-slide-in">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-muted transition-colors md:hidden">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1" />
        <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Reply size={18} />
        </button>
        <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Forward size={18} />
        </button>
        <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Star size={18} className={email.starred ? 'fill-accent text-accent' : ''} />
        </button>
        <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Trash2 size={18} />
        </button>
        <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-bold text-foreground mb-4">{email.subject}</h1>

        <div className="flex items-start gap-3 mb-6">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
            email.provider === 'afromail'
              ? 'bg-primary/15 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}>
            {getInitials(email.from)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-sm">{email.from}</span>
              <span className="text-xs text-muted-foreground">&lt;{email.fromEmail}&gt;</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              to {email.to} · {formatFullDate(email.date)}
            </div>
          </div>
        </div>

        {email.labels && email.labels.length > 0 && (
          <div className="flex gap-1.5 mb-4">
            {email.labels.map(l => (
              <span key={l} className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 font-medium">{l}</span>
            ))}
          </div>
        )}

        {email.hasAttachment && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50 border border-border">
            <Paperclip size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">1 attachment</span>
            <button className="ml-auto text-xs text-primary font-medium hover:underline">Download</button>
          </div>
        )}

        <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap font-body">
          {email.body}
        </div>
      </div>

      {/* Quick reply */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 border border-border cursor-text">
          <Reply size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Reply to {email.from}...</span>
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;
