import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Inbox, Star, Send, File, Trash2, Plus, Settings, LogOut, User, Clock, AlertCircle, Archive, Ban, CalendarClock, Tag, Folder, Users } from "lucide-react";
import { useMail, unreadCount, type SystemFolderId } from "@/lib/mailStore";
import afromailLogo from "@/assets/afromail-logo.png";

interface EmailSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onCompose: () => void;
}

const systemFolders: { id: SystemFolderId; label: string; icon: React.ElementType }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "starred", label: "Starred", icon: Star },
  { id: "snoozed", label: "Snoozed", icon: Clock },
  { id: "important", label: "Important", icon: AlertCircle },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: File },
  { id: "scheduled", label: "Scheduled", icon: CalendarClock },
  { id: "spam", label: "Spam", icon: Ban },
  { id: "trash", label: "Trash", icon: Trash2 },
  { id: "all", label: "All Mail", icon: Archive },
];

const NavRow = ({ active, onClick, icon: Icon, label, badge, dot }: {
  active: boolean; onClick: () => void; icon?: React.ElementType; label: string; badge?: number; dot?: string;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
      active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70"
    }`}
  >
    {dot ? <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: `hsl(${dot})` }} /> : Icon ? <Icon size={16} /> : null}
    <span className="flex-1 text-left truncate">{label}</span>
    {badge ? (
      <span className="text-xs font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
        {badge}
      </span>
    ) : null}
  </button>
);

const EmailSidebar = ({ activeView, onViewChange, onCompose }: EmailSidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const state = useMail(s => s);
  const totalUnread = unreadCount(state, "inbox");

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-full border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-2.5 border-b border-sidebar-border">
        <img src={afromailLogo} alt="Afromail" width={36} height={36} />
        <span className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">Afromail</span>
      </div>

      <div className="p-3">
        <button onClick={onCompose} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity">
          <Plus size={16} /> Compose
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {systemFolders.map(f => (
          <NavRow
            key={f.id}
            active={activeView === f.id}
            onClick={() => onViewChange(f.id)}
            icon={f.icon}
            label={f.label}
            badge={f.id === "inbox" ? totalUnread : undefined}
          />
        ))}

        <NavRow
          active={activeView === "queue"}
          onClick={() => onViewChange("queue")}
          icon={CalendarClock}
          label="Delivery queue"
        />

        <div className="mx-2 my-3 border-t border-sidebar-border" />
        <div className="px-3 mb-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Labels</span></div>
        {state.labels.map(l => (
          <NavRow key={l.id} active={activeView === `label:${l.id}`} onClick={() => onViewChange(`label:${l.id}`)} label={l.name} dot={l.color} />
        ))}

        {state.customFolders.length > 0 && (
          <>
            <div className="mx-2 my-3 border-t border-sidebar-border" />
            <div className="px-3 mb-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Folders</span></div>
            {state.customFolders.map(f => (
              <NavRow key={f.id} active={activeView === f.id} onClick={() => onViewChange(f.id)} icon={Folder} label={f.name} />
            ))}
          </>
        )}

        <div className="mx-2 my-3 border-t border-sidebar-border" />
        <div className="px-3 mb-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Accounts</span></div>
        {state.accounts.map(a => (
          <NavRow
            key={a.id}
            active={activeView === `acct:${a.id}`}
            onClick={() => onViewChange(`acct:${a.id}`)}
            label={a.email}
            dot={a.color.replace(/hsl\(|\)/g, "")}
          />
        ))}
      </div>

      <div className="p-3 border-t border-sidebar-border space-y-0.5">
        <button onClick={() => navigate("/profile")} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
          <User size={16} /> Profile
        </button>
        <button onClick={() => navigate("/contacts")} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
          <Users size={16} /> Contacts
        </button>
        <button onClick={() => navigate("/settings")} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
          <Settings size={16} /> Settings
        </button>
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default EmailSidebar;
