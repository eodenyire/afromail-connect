import { useEffect, useState } from "react";
import { Command } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { resetSeed, useMail } from "@/lib/mailStore";

interface Props {
  onCompose: () => void;
  onFolderChange: (id: string) => void;
}

export const CommandPalette = ({ onCompose, onFolderChange }: Props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const accounts = useMail(s => s.accounts);
  const labels = useMail(s => s.labels);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (fn: () => void) => { setOpen(false); fn(); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(onCompose)}>✏️ Compose new email</CommandItem>
          <CommandItem onSelect={() => run(() => { resetSeed(); })}>♻️ Reset mock data to seed</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          {[
            ["inbox", "📥 Inbox"], ["starred", "⭐ Starred"], ["snoozed", "⏰ Snoozed"],
            ["important", "❗ Important"], ["sent", "📤 Sent"], ["drafts", "📝 Drafts"],
            ["scheduled", "📅 Scheduled"], ["spam", "🚫 Spam"], ["trash", "🗑 Trash"],
            ["all", "📦 All Mail"],
          ].map(([id, label]) => (
            <CommandItem key={id} onSelect={() => run(() => onFolderChange(id))}>{label}</CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Labels">
          {labels.map(l => (
            <CommandItem key={l.id} onSelect={() => run(() => onFolderChange(`label:${l.id}`))}>
              <span className="w-2 h-2 rounded-full mr-2" style={{ background: `hsl(${l.color})` }} />
              {l.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Accounts">
          {accounts.map(a => (
            <CommandItem key={a.id} onSelect={() => run(() => onFolderChange(`acct:${a.id}`))}>
              📨 {a.email}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(() => navigate("/contacts"))}>👥 Contacts</CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/settings"))}>⚙️ Settings</CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/profile"))}>👤 Profile</CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="px-3 py-2 border-t border-border text-[11px] text-muted-foreground flex items-center gap-2">
        <Command size={11} /> +K to toggle anywhere
      </div>
    </CommandDialog>
  );
};
