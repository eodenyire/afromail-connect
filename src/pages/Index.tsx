import { useState, useMemo } from "react";
import EmailSidebar from "@/components/EmailSidebar";
import EmailList from "@/components/EmailList";
import EmailDetail from "@/components/EmailDetail";
import EmailSearch from "@/components/EmailSearch";
import ComposeEmail from "@/components/ComposeEmail";
import { mockEmails, type EmailProvider } from "@/data/mockEmails";
import { Menu } from "lucide-react";

const Index = () => {
  const [activeProvider, setActiveProvider] = useState<EmailProvider | 'all'>('all');
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const filteredEmails = useMemo(() => {
    let emails = mockEmails;
    if (activeProvider !== 'all') {
      emails = emails.filter(e => e.provider === activeProvider);
    }
    if (activeFolder === 'starred') {
      emails = emails.filter(e => e.starred);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      emails = emails.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q)
      );
    }
    return emails;
  }, [activeProvider, activeFolder, searchQuery]);

  const selectedEmail = selectedEmailId
    ? mockEmails.find(e => e.id === selectedEmailId) ?? null
    : null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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

      {/* Email list panel */}
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
        <EmailSearch value={searchQuery} onChange={setSearchQuery} />
        <EmailList
          emails={filteredEmails}
          selectedId={selectedEmailId}
          onSelect={setSelectedEmailId}
        />
      </div>

      {/* Detail panel */}
      <div className={`flex-1 flex flex-col bg-card ${
        selectedEmail ? 'flex' : 'hidden md:flex'
      }`}>
        <EmailDetail
          email={selectedEmail}
          onBack={() => setSelectedEmailId(null)}
        />
      </div>

      {/* Compose modal */}
      <ComposeEmail open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
};

export default Index;
