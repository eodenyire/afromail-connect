import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Search, Trash2, Pencil, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { useMail, actions, type Contact } from "@/lib/mailStore";
import { formatDistanceToNow } from "date-fns";

const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const emptyForm = { name: "", email: "", notes: "" };

const Contacts = () => {
  const navigate = useNavigate();
  const contacts = useMail(s => s.contacts);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Contact | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...contacts]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [contacts, query]);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setCreating(true); };
  const openEdit = (c: Contact) => { setForm({ name: c.name, email: c.email, notes: c.notes ?? "" }); setEditing(c); setCreating(true); };
  const close = () => { setCreating(false); setEditing(null); };

  const save = () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error("Name and email required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error("Invalid email");
    if (editing) {
      actions.updateContact(editing.id, form);
      toast.success("Contact updated");
    } else {
      actions.addContact({ ...form, lastContacted: undefined });
      toast.success("Contact added");
    }
    close();
  };

  const compose = (c: Contact) => {
    // Navigate to inbox with a query param so Index can open compose prefilled.
    navigate(`/?compose=${encodeURIComponent(c.email)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-md hover:bg-muted"><ArrowLeft size={18} /></button>
          <h1 className="text-xl font-bold flex-1">Contacts</h1>
          <button onClick={openCreate} className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold hover:opacity-90">
            <Plus size={15} /> Add contact
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 mb-4">
          <Search size={15} className="text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search contacts…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>}
        </div>

        <div className="text-xs text-muted-foreground mb-2">{filtered.length} of {contacts.length}</div>

        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No contacts match.</div>
          )}
          {filtered.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold bg-primary/15 text-primary flex-shrink-0">
                {getInitials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                {c.notes && <div className="text-xs text-muted-foreground truncate mt-0.5">{c.notes}</div>}
              </div>
              {c.lastContacted && (
                <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                  {formatDistanceToNow(new Date(c.lastContacted), { addSuffix: true })}
                </div>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => compose(c)} title="Compose" className="p-1.5 rounded hover:bg-muted"><Mail size={15} /></button>
                <button onClick={() => openEdit(c)} title="Edit" className="p-1.5 rounded hover:bg-muted"><Pencil size={14} /></button>
                <button onClick={() => { actions.deleteContact(c.id); toast.success("Deleted"); }} title="Delete" className="p-1.5 rounded hover:bg-muted text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {creating && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="font-semibold">{editing ? "Edit contact" : "New contact"}</h2>
              <button onClick={close} className="p-1 hover:bg-muted rounded"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 bg-muted/40 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" className="w-full mt-1 bg-muted/40 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full mt-1 bg-muted/40 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <button onClick={close} className="px-3 py-1.5 text-sm rounded-md hover:bg-muted">Cancel</button>
              <button onClick={save} className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
