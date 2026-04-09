import { Star, Paperclip, CheckSquare, Square, Mail, MailOpen, Trash2, Star as StarIcon, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Email } from "@/data/mockEmails";

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkMarkRead: () => void;
  onBulkMarkUnread: () => void;
  onBulkStar: () => void;
  onBulkDelete: () => void;
}

const providerDotMap: Record<string, string> = {
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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const EmailList = ({
  emails, selectedId, onSelect,
  selectedIds, onToggleSelect, onSelectAll, onDeselectAll,
  onBulkMarkRead, onBulkMarkUnread, onBulkStar, onBulkDelete,
}: EmailListProps) => {
  const hasSelection = selectedIds.size > 0;
  const allSelected = emails.length > 0 && selectedIds.size === emails.length;

  if (emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No emails to show
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Bulk action bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30 flex-shrink-0">
        <Checkbox
          checked={allSelected}
          onCheckedChange={() => allSelected ? onDeselectAll() : onSelectAll()}
          className="mr-1"
        />
        {hasSelection ? (
          <>
            <span className="text-xs text-muted-foreground mr-auto">{selectedIds.size} selected</span>
            <button onClick={onBulkMarkRead} title="Mark as read" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <MailOpen size={14} />
            </button>
            <button onClick={onBulkMarkUnread} title="Mark as unread" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Mail size={14} />
            </button>
            <button onClick={onBulkStar} title="Star" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <StarIcon size={14} />
            </button>
            <button onClick={onBulkDelete} title="Delete" className="p-1.5 rounded hover:bg-muted text-destructive hover:text-destructive transition-colors">
              <Trash2 size={14} />
            </button>
            <button onClick={onDeselectAll} title="Cancel" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Select all</span>
        )}
      </div>

      {/* Email rows */}
      {emails.map(email => {
        const isChecked = selectedIds.has(email.id);
        return (
          <div
            key={email.id}
            className={`w-full text-left px-4 py-3 border-b border-border transition-colors flex gap-3 animate-fade-in ${
              selectedId === email.id
                ? 'bg-primary/5 border-l-2 border-l-primary'
                : isChecked
                ? 'bg-primary/5'
                : email.read
                ? 'hover:bg-muted/50'
                : 'bg-card hover:bg-muted/30'
            }`}
          >
            {/* Checkbox */}
            <div className="flex items-start pt-1">
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggleSelect(email.id)}
              />
            </div>

            {/* Clickable content */}
            <button
              onClick={() => onSelect(email.id)}
              className="flex gap-3 flex-1 min-w-0 text-left"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ${
                  email.provider === 'afromail'
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {getInitials(email.from)}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${providerDotMap[email.provider]}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm truncate ${!email.read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                    {email.from}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">{formatDate(email.date)}</span>
                </div>
                <div className={`text-sm truncate mb-0.5 ${!email.read ? 'font-medium text-foreground/90' : 'text-muted-foreground'}`}>
                  {email.subject}
                </div>
                <div className="text-xs text-muted-foreground truncate">{email.preview}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  {email.starred && <Star size={12} className="text-accent fill-accent" />}
                  {email.hasAttachment && <Paperclip size={12} className="text-muted-foreground" />}
                  {email.labels?.map(l => (
                    <span key={l} className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">{l}</span>
                  ))}
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
