import { useState, useMemo } from "react";
import EmailSidebar from "@/components/EmailSidebar";
import EmailList from "@/components/EmailList";
import EmailDetail from "@/components/EmailDetail";
import EmailSearch, { defaultFilters, type SearchFilters } from "@/components/EmailSearch";
import ComposeEmail from "@/components/ComposeEmail";
import { mockEmails, type EmailProvider } from "@/data/mockEmails";
import { Menu } from "lucide-react";

const Index = () => {
  const [activeProvider, setActiveProvider] = useState<EmailProvider | 'all'>('all');
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(defaultFilters);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const filteredEmails = useMemo(() => {
    let emails = mockEmails;

    // Sidebar provider filter
    if (activeProvider !== 'all') {
      emails = emails.filter(e => e.provider === activeProvider);
    }

    // Search filter provider (only if sidebar is 'all')
    if (activeProvider === 'all' && searchFilters.provider !== 'all') {
      emails = emails.filter(e => e.provider === searchFilters.provider);
    }

    if (activeFolder === 'starred') {
      emails = emails.filter(e => e.starred);
    }

    // Attachment filter
    if (searchFilters.hasAttachment === true) {
      emails = emails.filter(e => e.hasAttachment);
    }

    // Date range
    if (searchFilters.dateFrom) {
      const from = searchFilters.dateFrom.getTime();
      emails = emails.filter(e => new Date(e.date).getTime() >= from);
    }
    if (searchFilters.dateTo) {
      const to = new Date(searchFilters.dateTo);
      to.setHours(23, 59, 59, 999);
      emails = emails.filter(e => new Date(e.date).getTime() <= to.getTime());
    }

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      emails = emails.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q)
      );
    }
    return emails;
  }, [activeProvider, activeFolder, searchQuery, searchFilters]);

  const selectedEmail = selectedEmailId
    ? mockEmails.find(e => e.id === selectedEmailId) ?? null
    : null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
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
        />
      </div>

      <div className={`flex-1 flex flex-col bg-card ${
        selectedEmail ? 'flex' : 'hidden md:flex'
      }`}>
        <EmailDetail
          email={selectedEmail}
          onBack={() => setSelectedEmailId(null)}
        />
      </div>

      <ComposeEmail open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
};

export default Index;
