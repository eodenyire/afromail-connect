import { useState, useMemo, useCallback, useEffect } from "react";
import EmailSidebar from "@/components/EmailSidebar";
import EmailList from "@/components/EmailList";
import EmailDetail from "@/components/EmailDetail";
import EmailSearch, { defaultFilters, type SearchFilters } from "@/components/EmailSearch";
import ComposeEmail from "@/components/ComposeEmail";
import { type Email, type EmailProvider } from "@/data/mockEmails";
import { Menu, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MessageRow {
  id: string;
  account_id: string;
  provider: string;
  from_name: string | null;
  from_email: string;
  to_emails: string[];
  subject: string | null;
  preview: string | null;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  read: boolean;
  starred: boolean;
  has_attachment: boolean;
  folder: string;
}

const KNOWN_PROVIDERS: EmailProvider[] = [
  "gmail","outlook","yahoo","icloud","protonmail","zoho","aol","yandex","fastmail","tutanota","afromail",
];

function toEmail(m: MessageRow): Email {
  const provider = (KNOWN_PROVIDERS.includes(m.provider as EmailProvider) ? m.provider : "afromail") as EmailProvider;
  return {
    id: m.id,
    from: m.from_name || m.from_email,
    fromEmail: m.from_email,
    to: m.to_emails?.[0] ?? "",
    subject: m.subject ?? "(no subject)",
    preview: m.preview ?? "",
    body: m.body_text ?? m.body_html ?? "",
    date: m.received_at,
    read: m.read,
    starred: m.starred,
    provider,
    hasAttachment: m.has_attachment,
  };
}

const Index = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeProvider, setActiveProvider] = useState<EmailProvider | 'all'>('all');
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(defaultFilters);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredEmails = useMemo(() => {
    let result = emails;
    if (activeProvider !== 'all') result = result.filter(e => e.provider === activeProvider);
    if (activeProvider === 'all' && searchFilters.provider !== 'all') result = result.filter(e => e.provider === searchFilters.provider);
    if (activeFolder === 'starred') result = result.filter(e => e.starred);
    if (searchFilters.hasAttachment === true) result = result.filter(e => e.hasAttachment);
    if (searchFilters.dateFrom) {
      const from = searchFilters.dateFrom.getTime();
      result = result.filter(e => new Date(e.date).getTime() >= from);
    }
    if (searchFilters.dateTo) {
      const to = new Date(searchFilters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(e => new Date(e.date).getTime() <= to.getTime());
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q)
      );
    }
    return result;
  }, [emails, activeProvider, activeFolder, searchQuery, searchFilters]);

  const selectedEmail = selectedEmailId
    ? emails.find(e => e.id === selectedEmailId) ?? null
    : null;

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredEmails.map(e => e.id)));
  }, [filteredEmails]);

  const handleDeselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkMarkRead = useCallback(() => {
    setEmails(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, read: true } : e));
    toast.success(`${selectedIds.size} email(s) marked as read`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleBulkMarkUnread = useCallback(() => {
    setEmails(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, read: false } : e));
    toast.success(`${selectedIds.size} email(s) marked as unread`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleBulkStar = useCallback(() => {
    setEmails(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, starred: !e.starred } : e));
    toast.success(`${selectedIds.size} email(s) star toggled`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleBulkDelete = useCallback(() => {
    setEmails(prev => prev.filter(e => !selectedIds.has(e.id)));
    toast.success(`${selectedIds.size} email(s) deleted`);
    if (selectedEmailId && selectedIds.has(selectedEmailId)) setSelectedEmailId(null);
    setSelectedIds(new Set());
  }, [selectedIds, selectedEmailId]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 md:relative md:z-auto transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <EmailSidebar
          activeProvider={activeProvider}
          onProviderChange={(p) => { setActiveProvider(p); setSidebarOpen(false); }}
          activeFolder={activeFolder}
          onFolderChange={(f) => { setActiveFolder(f); setSidebarOpen(false); }}
          onCompose={() => { setComposeOpen(true); setSidebarOpen(false); }}
        />
      </div>

      <div className={`flex flex-col w-full md:w-80 lg:w-96 border-r border-border bg-card flex-shrink-0 ${
        selectedEmail ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md hover:bg-muted">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm">
            {activeProvider === 'all' ? 'All Inboxes' : activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)}
          </span>
        </div>
        <EmailSearch
          value={searchQuery}
          onChange={setSearchQuery}
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
        />
        <EmailList
          emails={filteredEmails}
          selectedId={selectedEmailId}
          onSelect={setSelectedEmailId}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkMarkRead={handleBulkMarkRead}
          onBulkMarkUnread={handleBulkMarkUnread}
          onBulkStar={handleBulkStar}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <div className={`flex-1 flex flex-col bg-card ${selectedEmail ? 'flex' : 'hidden md:flex'}`}>
        <EmailDetail email={selectedEmail} onBack={() => setSelectedEmailId(null)} />
      </div>

      <ComposeEmail open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
};

export default Index;
