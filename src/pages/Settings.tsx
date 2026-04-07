import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2, Bell, BellOff, Mail, Shield, Globe, Sun, Moon, Monitor, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { providers, type EmailProvider } from "@/data/mockEmails";
import { Switch } from "@/components/ui/switch";
import afromailLogo from "@/assets/afromail-logo.png";

interface ConnectedAccount {
  provider: EmailProvider;
  email: string;
  connected: boolean;
}

interface NotificationPrefs {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  soundAlerts: boolean;
  digestFrequency: "realtime" | "hourly" | "daily" | "weekly";
  marketingEmails: boolean;
  securityAlerts: boolean;
}

const defaultNotificationPrefs: NotificationPrefs = {
  emailNotifications: true,
  desktopNotifications: true,
  soundAlerts: false,
  digestFrequency: "realtime",
  marketingEmails: false,
  securityAlerts: true,
};

const providerColorMap: Record<string, string> = {
  afromail: "bg-[hsl(var(--provider-afromail))]",
  gmail: "bg-[hsl(var(--provider-gmail))]",
  outlook: "bg-[hsl(var(--provider-outlook))]",
  yahoo: "bg-[hsl(var(--provider-yahoo))]",
  protonmail: "bg-[hsl(var(--provider-proton))]",
  icloud: "bg-[hsl(var(--provider-icloud))]",
  zoho: "bg-[hsl(var(--provider-zoho))]",
  aol: "bg-[hsl(var(--provider-aol))]",
  yandex: "bg-[hsl(var(--provider-yandex))]",
  fastmail: "bg-[hsl(var(--provider-fastmail))]",
  tutanota: "bg-[hsl(var(--provider-tutanota))]",
};

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts" | "notifications" | "appearance">("accounts");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("connected_accounts, notif_email, notif_desktop, notif_sound, notif_security, notif_marketing, notif_digest")
        .eq("user_id", user.id)
        .single();

      if (data?.connected_accounts) {
        const accounts = data.connected_accounts as unknown as ConnectedAccount[];
        if (Array.isArray(accounts) && accounts.length > 0) {
          setConnectedAccounts(accounts);
        } else {
          // Initialize from mock providers
          setConnectedAccounts(
            providers
              .filter((p) => p.connected)
              .map((p) => ({ provider: p.id, email: `you@${p.id}.com`, connected: true }))
          );
        }
      } else {
        setConnectedAccounts(
          providers
            .filter((p) => p.connected)
            .map((p) => ({ provider: p.id, email: `you@${p.id}.com`, connected: true }))
        );
      }
      setLoading(false);
    };
    fetchSettings();
  }, [user]);

  const handleSaveAccounts = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ connected_accounts: JSON.parse(JSON.stringify(connectedAccounts)) })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save account settings");
    } else {
      toast.success("Account settings saved!");
    }
    setSaving(false);
  };

  const handleDisconnect = (provider: EmailProvider) => {
    setConnectedAccounts((prev) =>
      prev.map((a) => (a.provider === provider ? { ...a, connected: false } : a))
    );
  };

  const handleReconnect = (provider: EmailProvider) => {
    setConnectedAccounts((prev) =>
      prev.map((a) => (a.provider === provider ? { ...a, connected: true } : a))
    );
  };

  const handleAddAccount = (providerId: EmailProvider) => {
    const existing = connectedAccounts.find((a) => a.provider === providerId);
    if (existing) {
      handleReconnect(providerId);
    } else {
      setConnectedAccounts((prev) => [
        ...prev,
        { provider: providerId, email: `you@${providerId}.com`, connected: true },
      ]);
    }
    toast.success(`${providerId.charAt(0).toUpperCase() + providerId.slice(1)} account added`);
  };

  const handleRemoveAccount = (provider: EmailProvider) => {
    setConnectedAccounts((prev) => prev.filter((a) => a.provider !== provider));
    toast.success("Account removed");
  };

  const availableProviders = providers.filter(
    (p) => !connectedAccounts.find((a) => a.provider === p.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <img src={afromailLogo} alt="Afromail" width={28} height={28} />
          <h1 className="text-lg font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "accounts"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail size={16} />
            Accounts
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "notifications"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell size={16} />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "appearance"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette size={16} />
            Theme
          </button>
        </div>

        {activeTab === "accounts" && (
          <div className="space-y-6">
            {/* Connected accounts */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Connected Accounts</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage your linked email accounts
                </p>
              </div>
              <div className="divide-y divide-border">
                {connectedAccounts.map((account) => {
                  const providerInfo = providers.find((p) => p.id === account.provider);
                  return (
                    <div
                      key={account.provider}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <span
                        className={`w-8 h-8 rounded-full ${providerColorMap[account.provider] || "bg-muted"} flex items-center justify-center text-sm`}
                      >
                        {providerInfo?.icon || "📧"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {providerInfo?.name || account.provider}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {account.email}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          account.connected
                            ? "bg-secondary/10 text-secondary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {account.connected ? "Active" : "Paused"}
                      </span>
                      <div className="flex items-center gap-1">
                        {account.connected ? (
                          <button
                            onClick={() => handleDisconnect(account.provider)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Pause account"
                          >
                            <BellOff size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReconnect(account.provider)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Reconnect"
                          >
                            <Bell size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveAccount(account.provider)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remove account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {connectedAccounts.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No accounts connected yet
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t border-border">
                <button
                  onClick={handleSaveAccounts}
                  disabled={saving}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Add new account */}
            {availableProviders.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">Add Account</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connect additional email providers
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {availableProviders.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleAddAccount(p.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm opacity-60">
                        {p.icon}
                      </span>
                      <span className="flex-1 text-left text-sm text-foreground">{p.name}</span>
                      <Plus size={16} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Notification Preferences</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Control how you receive notifications
                </p>
              </div>
              <div className="divide-y divide-border">
                {/* Email notifications */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Email Notifications</div>
                      <div className="text-xs text-muted-foreground">Receive notifications via email</div>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.emailNotifications}
                    onCheckedChange={(v) =>
                      setNotificationPrefs((p) => ({ ...p, emailNotifications: v }))
                    }
                  />
                </div>

                {/* Desktop */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Desktop Notifications</div>
                      <div className="text-xs text-muted-foreground">Show browser push notifications</div>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.desktopNotifications}
                    onCheckedChange={(v) =>
                      setNotificationPrefs((p) => ({ ...p, desktopNotifications: v }))
                    }
                  />
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Sound Alerts</div>
                      <div className="text-xs text-muted-foreground">Play sound for new emails</div>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.soundAlerts}
                    onCheckedChange={(v) =>
                      setNotificationPrefs((p) => ({ ...p, soundAlerts: v }))
                    }
                  />
                </div>

                {/* Security alerts */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Security Alerts</div>
                      <div className="text-xs text-muted-foreground">Get notified about suspicious activity</div>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.securityAlerts}
                    onCheckedChange={(v) =>
                      setNotificationPrefs((p) => ({ ...p, securityAlerts: v }))
                    }
                  />
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Product Updates</div>
                      <div className="text-xs text-muted-foreground">News about Afromail features</div>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.marketingEmails}
                    onCheckedChange={(v) =>
                      setNotificationPrefs((p) => ({ ...p, marketingEmails: v }))
                    }
                  />
                </div>
              </div>

              {/* Digest frequency */}
              <div className="px-5 py-4 border-t border-border">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email Digest Frequency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["realtime", "hourly", "daily", "weekly"] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() =>
                        setNotificationPrefs((p) => ({ ...p, digestFrequency: freq }))
                      }
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        notificationPrefs.digestFrequency === freq
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-border">
                <button
                  onClick={() => toast.success("Notification preferences saved!")}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose your preferred theme
                </p>
              </div>
              <div className="p-5 grid grid-cols-3 gap-3">
                {([
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                    }`}
                  >
                    <Icon
                      size={24}
                      className={theme === value ? "text-primary" : "text-muted-foreground"}
                    />
                    <span
                      className={`text-xs font-medium ${
                        theme === value ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
