// Tiny mock email service — full state lives here.
// Persists to localStorage (per-user namespace) so the app behaves like a real client.
// Every UI feature reads/writes through this module so swapping to a live backend later
// only means replacing the persistence layer.

import { useSyncExternalStore } from "react";
import { seedState } from "./mailSeed";

// ---------- Types ----------

export type ProviderId =
  | "afromail" | "gmail" | "outlook" | "yahoo" | "icloud"
  | "protonmail" | "zoho" | "aol" | "yandex" | "fastmail" | "tutanota" | "imap";

export interface Account {
  id: string;
  provider: ProviderId;
  email: string;
  displayName: string;
  signature: string;
  color: string; // hex/hsl token
  isDefault?: boolean;
}

export type SystemFolderId =
  | "inbox" | "starred" | "snoozed" | "important" | "sent"
  | "drafts" | "scheduled" | "spam" | "trash" | "all";

export interface CustomFolder {
  id: string;
  name: string;
  parentId?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  notes?: string;
  lastContacted?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mime: string;
  url?: string;
}

export interface Message {
  id: string;
  threadId: string;
  accountId: string;
  folderId: SystemFolderId | string; // system id or custom folder id
  fromName: string;
  fromEmail: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  date: string; // ISO
  read: boolean;
  starred: boolean;
  important: boolean;
  muted?: boolean;
  pinned?: boolean;
  snoozedUntil?: string;
  scheduledAt?: string;
  labelIds: string[];
  attachments: Attachment[];
  inReplyTo?: string;
}

export interface Draft {
  id: string;
  accountId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyHtml: string;
  attachments: Attachment[];
  inReplyTo?: string;
  threadId?: string;
  updatedAt: string;
}

export interface FilterRule {
  id: string;
  name: string;
  fromContains?: string;
  toContains?: string;
  subjectContains?: string;
  hasAttachment?: boolean;
  actions: {
    addLabelId?: string;
    moveToFolderId?: SystemFolderId | string;
    star?: boolean;
    markRead?: boolean;
    delete?: boolean;
  };
}

export interface Settings {
  density: "comfortable" | "compact";
  undoSendSeconds: number;
  shortcutsEnabled: boolean;
  soundOnNew: boolean;
  desktopNotif: boolean;
  loadExternalImages: "always" | "ask" | "never";
  readReceipts: boolean;
  vacationEnabled: boolean;
  vacationSubject: string;
  vacationBody: string;
  forwardingTo: string;
  blockedSenders: string[];
  language: string;
  timezone: string;
}

export interface State {
  accounts: Account[];
  customFolders: CustomFolder[];
  labels: Label[];
  contacts: Contact[];
  messages: Message[];
  drafts: Draft[];
  filters: FilterRule[];
  savedSearches: { id: string; name: string; query: string }[];
  settings: Settings;
}

// ---------- Persistence ----------

const KEY_PREFIX = "afromail-mock-store-v1::";
let userKey = "anon";
let state: State = seedState();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY_PREFIX + userKey, JSON.stringify(state));
  } catch {/* storage full / disabled */}
}

function load() {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + userKey);
    if (raw) state = JSON.parse(raw);
    else { state = seedState(); persist(); }
  } catch {
    state = seedState();
  }
}

export function setActiveUser(uid: string | undefined) {
  const next = uid ?? "anon";
  if (next === userKey) return;
  userKey = next;
  load();
  emit();
}

export function resetSeed() {
  state = seedState();
  persist();
  emit();
}

function emit() { listeners.forEach(l => l()); }

function update(mutator: (s: State) => void) {
  const next: State = JSON.parse(JSON.stringify(state));
  mutator(next);
  state = next;
  persist();
  emit();
}

// ---------- Hook ----------

export function useMail<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => selector(state),
    () => selector(state),
  );
}
export function getState(): State { return state; }

// ---------- Actions ----------

const uid = () => crypto.randomUUID();

export const actions = {
  // accounts
  addAccount(a: Omit<Account, "id">) {
    update(s => { s.accounts.push({ ...a, id: uid() }); });
  },
  updateAccount(id: string, patch: Partial<Account>) {
    update(s => {
      const a = s.accounts.find(x => x.id === id);
      if (a) Object.assign(a, patch);
    });
  },
  removeAccount(id: string) {
    update(s => {
      s.accounts = s.accounts.filter(a => a.id !== id);
      s.messages = s.messages.filter(m => m.accountId !== id);
    });
  },
  setDefaultAccount(id: string) {
    update(s => s.accounts.forEach(a => { a.isDefault = a.id === id; }));
  },

  // labels
  addLabel(name: string, color: string) {
    update(s => { s.labels.push({ id: uid(), name, color }); });
  },
  updateLabel(id: string, patch: Partial<Label>) {
    update(s => {
      const l = s.labels.find(x => x.id === id);
      if (l) Object.assign(l, patch);
    });
  },
  deleteLabel(id: string) {
    update(s => {
      s.labels = s.labels.filter(l => l.id !== id);
      s.messages.forEach(m => { m.labelIds = m.labelIds.filter(x => x !== id); });
    });
  },

  // custom folders
  addFolder(name: string, parentId?: string) {
    update(s => { s.customFolders.push({ id: uid(), name, parentId }); });
  },
  deleteFolder(id: string) {
    update(s => {
      s.customFolders = s.customFolders.filter(f => f.id !== id);
      s.messages.forEach(m => { if (m.folderId === id) m.folderId = "inbox"; });
    });
  },

  // messages
  toggleRead(ids: string[], read?: boolean) {
    update(s => s.messages.forEach(m => {
      if (ids.includes(m.id)) m.read = read ?? !m.read;
    }));
  },
  toggleStar(ids: string[]) {
    update(s => s.messages.forEach(m => {
      if (ids.includes(m.id)) m.starred = !m.starred;
    }));
  },
  toggleImportant(ids: string[]) {
    update(s => s.messages.forEach(m => {
      if (ids.includes(m.id)) m.important = !m.important;
    }));
  },
  togglePin(id: string) {
    update(s => {
      const m = s.messages.find(x => x.id === id);
      if (m) m.pinned = !m.pinned;
    });
  },
  muteThread(threadId: string) {
    update(s => s.messages.forEach(m => {
      if (m.threadId === threadId) m.muted = true;
    }));
  },
  applyLabel(ids: string[], labelId: string) {
    update(s => s.messages.forEach(m => {
      if (ids.includes(m.id) && !m.labelIds.includes(labelId)) m.labelIds.push(labelId);
    }));
  },
  removeLabel(ids: string[], labelId: string) {
    update(s => s.messages.forEach(m => {
      if (ids.includes(m.id)) m.labelIds = m.labelIds.filter(l => l !== labelId);
    }));
  },
  moveToFolder(ids: string[], folderId: SystemFolderId | string) {
    update(s => s.messages.forEach(m => {
      if (ids.includes(m.id)) m.folderId = folderId;
    }));
  },
  archive(ids: string[]) { actions.moveToFolder(ids, "all"); },
  trash(ids: string[]) { actions.moveToFolder(ids, "trash"); },
  spam(ids: string[]) { actions.moveToFolder(ids, "spam"); },
  notSpam(ids: string[]) { actions.moveToFolder(ids, "inbox"); },
  permanentDelete(ids: string[]) {
    update(s => { s.messages = s.messages.filter(m => !ids.includes(m.id)); });
  },
  snooze(ids: string[], untilISO: string) {
    update(s => s.messages.forEach(m => {
      if (ids.includes(m.id)) { m.snoozedUntil = untilISO; m.folderId = "snoozed"; }
    }));
  },
  unsnooze(ids: string[]) {
    update(s => s.messages.forEach(m => {
      if (ids.includes(m.id)) { m.snoozedUntil = undefined; m.folderId = "inbox"; }
    }));
  },

  // sending
  sendMessage(opts: {
    accountId: string;
    to: string[]; cc: string[]; bcc: string[];
    subject: string; bodyHtml: string;
    inReplyTo?: string; threadId?: string;
    attachments?: Attachment[];
    scheduledAt?: string;
  }) {
    update(s => {
      const acct = s.accounts.find(a => a.id === opts.accountId);
      if (!acct) return;
      const id = uid();
      const folderId: SystemFolderId = opts.scheduledAt ? "scheduled" : "sent";
      const msg: Message = {
        id,
        threadId: opts.threadId ?? id,
        accountId: opts.accountId,
        folderId,
        fromName: acct.displayName,
        fromEmail: acct.email,
        to: opts.to, cc: opts.cc, bcc: opts.bcc,
        subject: opts.subject,
        bodyHtml: opts.bodyHtml,
        bodyText: opts.bodyHtml.replace(/<[^>]*>/g, ""),
        date: opts.scheduledAt ?? new Date().toISOString(),
        read: true, starred: false, important: false,
        labelIds: [],
        attachments: opts.attachments ?? [],
        inReplyTo: opts.inReplyTo,
        scheduledAt: opts.scheduledAt,
      };
      s.messages.unshift(msg);
      // upsert contacts
      [...opts.to, ...opts.cc, ...opts.bcc].forEach(addr => {
        if (!s.contacts.find(c => c.email.toLowerCase() === addr.toLowerCase())) {
          s.contacts.push({ id: uid(), name: addr.split("@")[0], email: addr, lastContacted: new Date().toISOString() });
        } else {
          const c = s.contacts.find(c => c.email.toLowerCase() === addr.toLowerCase())!;
          c.lastContacted = new Date().toISOString();
        }
      });
    });
  },

  // drafts
  saveDraft(d: Omit<Draft, "id" | "updatedAt"> & { id?: string }) {
    update(s => {
      const id = d.id ?? uid();
      const now = new Date().toISOString();
      const existing = s.drafts.find(x => x.id === id);
      if (existing) Object.assign(existing, d, { updatedAt: now });
      else s.drafts.unshift({ ...d, id, updatedAt: now });
    });
  },
  deleteDraft(id: string) {
    update(s => { s.drafts = s.drafts.filter(d => d.id !== id); });
  },

  // contacts
  addContact(c: Omit<Contact, "id">) {
    update(s => { s.contacts.unshift({ ...c, id: uid() }); });
  },
  updateContact(id: string, patch: Partial<Contact>) {
    update(s => {
      const c = s.contacts.find(x => x.id === id);
      if (c) Object.assign(c, patch);
    });
  },
  deleteContact(id: string) {
    update(s => { s.contacts = s.contacts.filter(c => c.id !== id); });
  },

  // settings
  patchSettings(patch: Partial<Settings>) {
    update(s => { Object.assign(s.settings, patch); });
  },

  // filters
  addFilter(f: Omit<FilterRule, "id">) {
    update(s => { s.filters.push({ ...f, id: uid() }); });
  },
  deleteFilter(id: string) {
    update(s => { s.filters = s.filters.filter(f => f.id !== id); });
  },

  // saved searches
  saveSearch(name: string, query: string) {
    update(s => { s.savedSearches.push({ id: uid(), name, query }); });
  },
  deleteSavedSearch(id: string) {
    update(s => { s.savedSearches = s.savedSearches.filter(x => x.id !== id); });
  },

  blockSender(email: string) {
    update(s => {
      if (!s.settings.blockedSenders.includes(email)) s.settings.blockedSenders.push(email);
    });
  },
  unblockSender(email: string) {
    update(s => {
      s.settings.blockedSenders = s.settings.blockedSenders.filter(e => e !== email);
    });
  },
};

// ---------- Selectors / helpers ----------

export function folderLabel(id: string, custom: CustomFolder[]): string {
  const sys: Record<string, string> = {
    inbox: "Inbox", starred: "Starred", snoozed: "Snoozed", important: "Important",
    sent: "Sent", drafts: "Drafts", scheduled: "Scheduled", spam: "Spam",
    trash: "Trash", all: "All Mail",
  };
  return sys[id] ?? custom.find(f => f.id === id)?.name ?? id;
}

export function unreadCount(s: State, folderId: SystemFolderId | string): number {
  return s.messages.filter(m => !m.read && belongsToFolder(m, folderId)).length;
}

export function belongsToFolder(m: Message, folderId: SystemFolderId | string): boolean {
  if (folderId === "starred") return m.starred && m.folderId !== "trash";
  if (folderId === "important") return m.important && m.folderId !== "trash";
  if (folderId === "all") return m.folderId !== "trash" && m.folderId !== "spam";
  return m.folderId === folderId;
}

// Group messages into threads, returns latest-per-thread sorted desc.
export interface ThreadSummary {
  threadId: string;
  latest: Message;
  count: number;
  participants: string[];
  hasUnread: boolean;
  hasStar: boolean;
  hasAttachment: boolean;
  pinned: boolean;
}
export function threadsForFolder(s: State, folderId: SystemFolderId | string, accountId?: string): ThreadSummary[] {
  const inFolder = s.messages.filter(m =>
    belongsToFolder(m, folderId) && (!accountId || m.accountId === accountId)
  );
  const map = new Map<string, Message[]>();
  inFolder.forEach(m => {
    const arr = map.get(m.threadId) ?? [];
    arr.push(m);
    map.set(m.threadId, arr);
  });
  const threads: ThreadSummary[] = [];
  map.forEach((msgs, threadId) => {
    msgs.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    const latest = msgs[0];
    threads.push({
      threadId,
      latest,
      count: msgs.length,
      participants: Array.from(new Set(msgs.map(m => m.fromName))).slice(0, 3),
      hasUnread: msgs.some(m => !m.read),
      hasStar: msgs.some(m => m.starred),
      hasAttachment: msgs.some(m => m.attachments.length > 0),
      pinned: msgs.some(m => m.pinned ?? false),
    });
  });
  return threads.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return +new Date(b.latest.date) - +new Date(a.latest.date);
  });
}

export function threadMessages(s: State, threadId: string): Message[] {
  return s.messages
    .filter(m => m.threadId === threadId)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

// Apply text query + operators (from:, to:, subject:, has:attachment, is:unread, is:starred, label:, before:, after:)
export function searchMessages(s: State, query: string): Message[] {
  if (!query.trim()) return s.messages;
  const tokens = query.match(/(\w+:[^\s]+|"[^"]+"|\S+)/g) ?? [];
  const ops: Record<string, string> = {};
  const free: string[] = [];
  tokens.forEach(t => {
    const m = t.match(/^(from|to|subject|has|is|label|before|after):(.+)$/i);
    if (m) ops[m[1].toLowerCase()] = m[2].toLowerCase();
    else free.push(t.replace(/^"|"$/g, "").toLowerCase());
  });
  return s.messages.filter(m => {
    if (ops.from && !`${m.fromName} ${m.fromEmail}`.toLowerCase().includes(ops.from)) return false;
    if (ops.to && !m.to.join(" ").toLowerCase().includes(ops.to)) return false;
    if (ops.subject && !(m.subject ?? "").toLowerCase().includes(ops.subject)) return false;
    if (ops.has === "attachment" && m.attachments.length === 0) return false;
    if (ops.is === "unread" && m.read) return false;
    if (ops.is === "read" && !m.read) return false;
    if (ops.is === "starred" && !m.starred) return false;
    if (ops.label) {
      const lbl = s.labels.find(l => l.name.toLowerCase() === ops.label);
      if (!lbl || !m.labelIds.includes(lbl.id)) return false;
    }
    if (ops.before && +new Date(m.date) >= +new Date(ops.before)) return false;
    if (ops.after && +new Date(m.date) <= +new Date(ops.after)) return false;
    if (free.length) {
      const hay = `${m.subject} ${m.fromName} ${m.fromEmail} ${m.bodyText}`.toLowerCase();
      if (!free.every(w => hay.includes(w))) return false;
    }
    return true;
  });
}
