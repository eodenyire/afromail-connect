import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon, Monitor, Star, Trash2, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useMail, actions, type SystemFolderId } from "@/lib/mailStore";
import { Switch } from "@/components/ui/switch";

type Tab = "general" | "accounts" | "notifications" | "appearance";

const folderOptions: { id: SystemFolderId; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "starred", label: "Starred" },
  { id: "important", label: "Important" },
  { id: "all", label: "All Mail" },
];

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("general");
  const accounts = useMail(s => s.accounts);
  const labels = useMail(s => s.labels);
  const settings = useMail(s => s.settings);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-md hover:bg-muted"><ArrowLeft size={18} /></button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <nav className="space-y-1">
          {(["general", "accounts", "notifications", "appearance"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm capitalize ${tab === t ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
            >
              {t}
            </button>
          ))}
        </nav>

        <main className="min-w-0">
          {tab === "general" && (
            <section className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-5 space-y-4">
                <h2 className="font-semibold">Defaults</h2>
                <div>
                  <label className="text-sm font-medium">Default folder on open</label>
                  <p className="text-xs text-muted-foreground mb-2">Which folder to land in when you open Afromail.</p>
                  <select
                    value={settings.defaultFolder}
                    onChange={e => actions.patchSettings({ defaultFolder: e.target.value as SystemFolderId })}
                    className="w-full max-w-xs bg-muted/40 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {folderOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Default labels for new mail</label>
                  <p className="text-xs text-muted-foreground mb-2">Labels auto-applied when composing a new message.</p>
                  <div className="flex flex-wrap gap-2">
                    {labels.map(l => {
                      const active = settings.defaultLabelIds.includes(l.id);
                      return (
                        <button
                          key={l.id}
                          onClick={() => actions.patchSettings({
                            defaultLabelIds: active
                              ? settings.defaultLabelIds.filter(id => id !== l.id)
                              : [...settings.defaultLabelIds, l.id],
                          })}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: `hsl(${l.color})` }} />
                          {l.name}
                        </button>
                      );
                    })}
                    {labels.length === 0 && <span className="text-xs text-muted-foreground">No labels yet.</span>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Draft autosave</label>
                  <p className="text-xs text-muted-foreground mb-2">Save drafts every N seconds while composing.</p>
                  <input
                    type="number" min={2} max={60}
                    value={settings.autosaveSeconds}
                    onChange={e => actions.patchSettings({ autosaveSeconds: Math.max(2, +e.target.value || 5) })}
                    className="w-24 bg-muted/40 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Keyboard shortcuts</div>
                    <p className="text-xs text-muted-foreground">c to compose, / to search, gi/gs/gd/gt/ga to navigate.</p>
                  </div>
                  <Switch checked={settings.shortcutsEnabled} onCheckedChange={v => actions.patchSettings({ shortcutsEnabled: v })} />
                </div>
              </div>
            </section>
          )}

          {tab === "accounts" && (
            <section className="space-y-4">
              <div className="text-sm text-muted-foreground">Manage signatures and choose your default sending account.</div>
              {accounts.map(a => (
                <div key={a.id} className="bg-card border border-border rounded-lg p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: a.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{a.email}</div>
                      <div className="text-xs text-muted-foreground capitalize">{a.provider} · {a.displayName}</div>
                    </div>
                    <button
                      onClick={() => actions.setDefaultAccount(a.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border ${a.isDefault ? "border-accent text-accent bg-accent/10" : "border-border hover:bg-muted"}`}
                    >
                      <Star size={12} className={a.isDefault ? "fill-accent" : ""} />
                      {a.isDefault ? "Default" : "Make default"}
                    </button>
                    {!a.isDefault && (
                      <button onClick={() => { actions.removeAccount(a.id); toast.success("Removed"); }} className="p-1.5 rounded hover:bg-muted text-destructive"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Signature (HTML)</label>
                    <textarea
                      value={a.signature}
                      onChange={e => actions.updateAccount(a.id, { signature: e.target.value })}
                      rows={4}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-md px-3 py-2 text-xs font-mono outline-none focus:border-primary resize-y"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">Preview:</div>
                    <div className="mt-1 p-2 rounded-md border border-dashed border-border text-xs" dangerouslySetInnerHTML={{ __html: a.signature }} />
                  </div>
                </div>
              ))}
            </section>
          )}

          {tab === "notifications" && (
            <section className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h2 className="font-semibold">Notification preferences</h2>
              {[
                { key: "desktopNotif", label: "Desktop notifications", hint: "Show a notification when new mail arrives." },
                { key: "soundOnNew", label: "Sound on new mail", hint: "Play a sound for each new message." },
                { key: "readReceipts", label: "Read receipts", hint: "Request receipts when you send mail." },
                { key: "vacationEnabled", label: "Vacation auto-reply", hint: "Send an automatic reply while you're away." },
              ].map(o => (
                <div key={o.key} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{o.label}</div>
                    <p className="text-xs text-muted-foreground">{o.hint}</p>
                  </div>
                  <Switch
                    checked={(settings as any)[o.key]}
                    onCheckedChange={v => actions.patchSettings({ [o.key]: v } as any)}
                  />
                </div>
              ))}

              {settings.vacationEnabled && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <input
                    value={settings.vacationSubject}
                    onChange={e => actions.patchSettings({ vacationSubject: e.target.value })}
                    placeholder="Subject"
                    className="w-full bg-muted/40 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <textarea
                    value={settings.vacationBody}
                    onChange={e => actions.patchSettings({ vacationBody: e.target.value })}
                    rows={3}
                    placeholder="Message"
                    className="w-full bg-muted/40 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary resize-y"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <label className="text-sm font-medium">Undo send window</label>
                <p className="text-xs text-muted-foreground mb-2">Seconds to cancel a send.</p>
                <input
                  type="number" min={0} max={30}
                  value={settings.undoSendSeconds}
                  onChange={e => actions.patchSettings({ undoSendSeconds: +e.target.value || 0 })}
                  className="w-24 bg-muted/40 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </section>
          )}

          {tab === "appearance" && (
            <section className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h2 className="font-semibold">Theme</h2>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {[
                  { v: "light", label: "Light", icon: Sun },
                  { v: "dark", label: "Dark", icon: Moon },
                  { v: "system", label: "System", icon: Monitor },
                ].map(o => (
                  <button
                    key={o.v}
                    onClick={() => setTheme(o.v)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${theme === o.v ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                  >
                    <o.icon size={20} />
                    <span className="text-xs font-medium">{o.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-border">
                <label className="text-sm font-medium">List density</label>
                <div className="flex gap-2 mt-2">
                  {(["comfortable", "compact"] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => actions.patchSettings({ density: d })}
                      className={`px-3 py-1.5 rounded-md text-xs border capitalize ${settings.density === d ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
