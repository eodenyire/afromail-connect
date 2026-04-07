import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Inbox, Star, Send, File, Trash2, Plus, Settings, LogOut, User } from "lucide-react";
import { providers, type EmailProvider } from "@/data/mockEmails";
import afromailLogo from "@/assets/afromail-logo.png";

interface EmailSidebarProps {
  activeProvider: EmailProvider | 'all';
  onProviderChange: (provider: EmailProvider | 'all') => void;
  activeFolder: string;
  onFolderChange: (folder: string) => void;
  onCompose: () => void;
}

const folders = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'drafts', label: 'Drafts', icon: File },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

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

const SettingsButton = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-0.5">
      <button
        onClick={() => navigate("/profile")}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
      >
        <User size={16} />
        Profile
      </button>
      <button
        onClick={() => navigate("/settings")}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
      >
        <Settings size={16} />
        Settings
      </button>
    </div>
  );
};

const SignOutButton = () => {
  const { signOut } = useAuth();
  return (
    <button
      onClick={signOut}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
    >
      <LogOut size={16} />
      Sign Out
    </button>
  );
};

const EmailSidebar = ({ activeProvider, onProviderChange, activeFolder, onFolderChange, onCompose }: EmailSidebarProps) => {
  const connectedProviders = providers.filter(p => p.connected);
  const disconnectedProviders = providers.filter(p => !p.connected);
  const totalUnread = connectedProviders.reduce((sum, p) => sum + p.unread, 0);

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-full border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2.5 border-b border-sidebar-border">
        <img src={afromailLogo} alt="Afromail" width={36} height={36} />
        <span className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">Afromail</span>
      </div>

      {/* Compose */}
      <div className="p-3">
        <button onClick={onCompose} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Compose
        </button>
      </div>

      {/* Folders */}
      <nav className="px-2 space-y-0.5">
        {folders.map(f => (
          <button
            key={f.id}
            onClick={() => onFolderChange(f.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              activeFolder === f.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70'
            }`}
          >
            <f.icon size={16} />
            <span className="flex-1 text-left">{f.label}</span>
            {f.id === 'inbox' && totalUnread > 0 && (
              <span className="text-xs font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {totalUnread}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-3 border-t border-sidebar-border" />

      {/* Accounts */}
      <div className="px-4 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Accounts</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        <button
          onClick={() => onProviderChange('all')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            activeProvider === 'all'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">✦</span>
          <span className="flex-1 text-left">All Inboxes</span>
          <span className="text-xs text-sidebar-foreground/40">{totalUnread}</span>
        </button>

        {connectedProviders.map(p => (
          <button
            key={p.id}
            onClick={() => onProviderChange(p.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              activeProvider === p.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70'
            }`}
          >
            <span className={`w-5 h-5 rounded-full ${providerColorMap[p.id]} flex items-center justify-center text-[10px]`}>
              {p.icon}
            </span>
            <span className="flex-1 text-left">{p.name}</span>
            {p.unread > 0 && (
              <span className="text-xs text-sidebar-foreground/40">{p.unread}</span>
            )}
          </button>
        ))}

        {disconnectedProviders.length > 0 && (
          <>
            <div className="mx-2 my-2 border-t border-sidebar-border" />
            <div className="px-3 mb-1">
              <span className="text-[10px] text-sidebar-foreground/30 uppercase tracking-wider">Available</span>
            </div>
            {disconnectedProviders.map(p => (
              <button
                key={p.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/30 hover:text-sidebar-foreground/50 hover:bg-sidebar-accent/30 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-sidebar-accent/50 flex items-center justify-center text-[10px] opacity-50">
                  {p.icon}
                </span>
                <span className="flex-1 text-left">{p.name}</span>
                <Plus size={12} className="opacity-50" />
              </button>
            ))}
          </>
        )}
      </div>

      {/* Settings & Sign Out */}
      <div className="p-3 border-t border-sidebar-border space-y-0.5">
        <SettingsButton />

        <SignOutButton />
      </div>
    </aside>
  );
};

export default EmailSidebar;
