// Realistic seed data for the mock email service.
// Three accounts, ~70 messages across 12 threads + singletons,
// custom labels, contacts, signatures, settings.

import type {
  Account, CustomFolder, Label, Contact, Message, Draft,
  FilterRule, Settings, State, SystemFolderId,
} from "./mailStore";

const isoDaysAgo = (d: number, h = 9, m = 0) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
};

const accounts: Account[] = [
  {
    id: "acct-afro",
    provider: "afromail",
    email: "odenyire@afromail.com",
    displayName: "Eric Odenyire",
    color: "hsl(var(--provider-afromail))",
    signature: "<p>—<br/>Eric Odenyire<br/>Sent from Afromail 🌍</p>",
    isDefault: true,
  },
  {
    id: "acct-gmail",
    provider: "gmail",
    email: "eodenyire@gmail.com",
    displayName: "Eric Odenyire",
    color: "hsl(var(--provider-gmail))",
    signature: "<p>—<br/>Eric Odenyire</p>",
  },
  {
    id: "acct-corp",
    provider: "imap",
    email: "eric@wekezabank.co.ke",
    displayName: "Eric Odenyire",
    color: "hsl(var(--primary))",
    signature: "<p>—<br/><strong>Eric Odenyire</strong><br/>Wekeza Bank · Digital Strategy<br/>+254 722 000 000</p>",
  },
];

const labels: Label[] = [
  { id: "lbl-work", name: "Work", color: "210 80% 55%" },
  { id: "lbl-personal", name: "Personal", color: "150 60% 45%" },
  { id: "lbl-receipts", name: "Receipts", color: "30 90% 55%" },
  { id: "lbl-travel", name: "Travel", color: "280 70% 60%" },
  { id: "lbl-newsletter", name: "Newsletters", color: "0 0% 60%" },
];

const customFolders: CustomFolder[] = [
  { id: "fld-projects", name: "Projects" },
  { id: "fld-clients", name: "Clients" },
];

const contacts: Contact[] = [
  { id: "c1", name: "Amara Osei", email: "amara@afromail.com", lastContacted: isoDaysAgo(2) },
  { id: "c2", name: "Kwame Mensah", email: "kwame.m@afromail.com", lastContacted: isoDaysAgo(1) },
  { id: "c3", name: "Fatima Diallo", email: "fatima@afromail.com", lastContacted: isoDaysAgo(3) },
  { id: "c4", name: "Chinelo Ibe", email: "chinelo@gmail.com", lastContacted: isoDaysAgo(5) },
  { id: "c5", name: "David Kamau", email: "david@wekezabank.co.ke", lastContacted: isoDaysAgo(4) },
  { id: "c6", name: "Sarah Wanjiru", email: "sarah@edutechconsultants.co.ke", lastContacted: isoDaysAgo(7) },
];

let nextId = 1;
const id = (p = "m") => `${p}-${nextId++}`;

function buildMessages(): Message[] {
  const out: Message[] = [];

  // Thread 1: project Baobab (5 msgs)
  const t1 = "thread-baobab";
  out.push({
    id: id(), threadId: t1, accountId: "acct-gmail", folderId: "inbox",
    fromName: "Chinelo Ibe", fromEmail: "chinelo@gmail.com",
    to: ["eodenyire@gmail.com"], cc: [], bcc: [],
    subject: "Project Baobab — Final Review",
    bodyHtml: "<p>Hi Eric,</p><p>The final designs are ready for your review. I've incorporated all the feedback from the last meeting.</p><p>The client presentation is scheduled for Friday at 10am EAT.</p><p>Best,<br/>Chinelo</p>",
    bodyText: "Hi Eric, the final designs are ready for your review.",
    date: isoDaysAgo(5, 16, 30), read: true, starred: true, important: true,
    labelIds: ["lbl-work"],
    attachments: [{ id: id("a"), name: "baobab-final.pdf", size: 2_400_000, mime: "application/pdf" }],
  });
  out.push({
    id: id(), threadId: t1, accountId: "acct-gmail", folderId: "sent",
    fromName: "Eric Odenyire", fromEmail: "eodenyire@gmail.com",
    to: ["chinelo@gmail.com"], cc: [], bcc: [],
    subject: "Re: Project Baobab — Final Review",
    bodyHtml: "<p>Looks great Chinelo. Two small notes on slide 4 — will send markup tonight.</p>",
    bodyText: "Looks great Chinelo.",
    date: isoDaysAgo(5, 19, 12), read: true, starred: false, important: false,
    labelIds: ["lbl-work"], attachments: [],
  });
  out.push({
    id: id(), threadId: t1, accountId: "acct-gmail", folderId: "inbox",
    fromName: "Chinelo Ibe", fromEmail: "chinelo@gmail.com",
    to: ["eodenyire@gmail.com"], cc: [], bcc: [],
    subject: "Re: Project Baobab — Final Review",
    bodyHtml: "<p>Markup received, all addressed. Final deck attached.</p>",
    bodyText: "Markup received.",
    date: isoDaysAgo(4, 8, 4), read: false, starred: false, important: true,
    labelIds: ["lbl-work"],
    attachments: [{ id: id("a"), name: "baobab-final-v2.pdf", size: 2_500_000, mime: "application/pdf" }],
  });

  // Thread 2: Pan-African Tech Summit (3 msgs)
  const t2 = "thread-summit";
  out.push({
    id: id(), threadId: t2, accountId: "acct-afro", folderId: "inbox",
    fromName: "Kwame Mensah", fromEmail: "kwame.m@afromail.com",
    to: ["odenyire@afromail.com"], cc: [], bcc: [],
    subject: "Pan-African Tech Summit 2026",
    bodyHtml: "<p>Hi Eric,</p><p>Confirming the panel discussion on African digital infrastructure. Could you prepare 5 slides on payments interoperability?</p><p>Kwame</p>",
    bodyText: "Confirming the panel discussion.",
    date: isoDaysAgo(2, 8, 45), read: false, starred: false, important: false,
    labelIds: ["lbl-work"], attachments: [],
  });
  out.push({
    id: id(), threadId: t2, accountId: "acct-afro", folderId: "sent",
    fromName: "Eric Odenyire", fromEmail: "odenyire@afromail.com",
    to: ["kwame.m@afromail.com"], cc: [], bcc: [],
    subject: "Re: Pan-African Tech Summit 2026",
    bodyHtml: "<p>On it. Will share by Friday.</p>",
    bodyText: "On it.",
    date: isoDaysAgo(2, 11, 30), read: true, starred: false, important: false,
    labelIds: ["lbl-work"], attachments: [],
  });

  // Singletons across providers/folders
  const seeds: Array<Partial<Message> & Pick<Message, "fromName" | "fromEmail" | "subject" | "bodyHtml" | "accountId" | "folderId">> = [
    {
      fromName: "Amara Osei", fromEmail: "amara@afromail.com", accountId: "acct-afro", folderId: "inbox",
      subject: "Welcome to Afromail — Africa's Premier Email",
      bodyHtml: "<p>We're thrilled to have you join the Afromail community! Built for Africa with offline access, M-Pesa integration, and 50+ local languages.</p>",
      starred: true, important: true, labelIds: ["lbl-personal"], date: isoDaysAgo(0, 10, 30),
    },
    {
      fromName: "Google Workspace", fromEmail: "no-reply@google.com", accountId: "acct-gmail", folderId: "inbox",
      subject: "Your weekly security summary",
      bodyHtml: "<p>No security issues were found in the last 7 days.</p>",
      labelIds: ["lbl-newsletter"], date: isoDaysAgo(0, 9, 15),
    },
    {
      fromName: "Fatima Diallo", fromEmail: "fatima@afromail.com", accountId: "acct-afro", folderId: "inbox",
      subject: "Invoice #AF-2026-0412",
      bodyHtml: "<p>Please find attached the invoice for the design consultation services. Payment via M-Pesa or bank transfer.</p>",
      starred: true, labelIds: ["lbl-receipts"],
      attachments: [{ id: id("a"), name: "invoice-AF-2026-0412.pdf", size: 320_000, mime: "application/pdf" }],
      date: isoDaysAgo(1, 15, 30),
    },
    {
      fromName: "Microsoft 365", fromEmail: "noreply@microsoft.com", accountId: "acct-corp", folderId: "inbox",
      subject: "Your OneDrive storage is 80% full",
      bodyHtml: "<p>Consider upgrading or freeing up space.</p>",
      labelIds: ["lbl-newsletter"], date: isoDaysAgo(1, 18, 20),
    },
    {
      fromName: "Yahoo Digest", fromEmail: "digest@yahoo.com", accountId: "acct-gmail", folderId: "inbox",
      subject: "Your daily news briefing",
      bodyHtml: "<p>African Union announces new digital trade framework. Tech startups in Lagos raise $500M.</p>",
      labelIds: ["lbl-newsletter"], date: isoDaysAgo(1, 7, 0),
    },
    {
      fromName: "Sarah Wanjiru", fromEmail: "sarah@edutechconsultants.co.ke", accountId: "acct-corp", folderId: "inbox",
      subject: "Q2 strategy doc — your input?",
      bodyHtml: "<p>Eric, can you scan the Q2 strategy doc and share thoughts by EOD Tuesday?</p>",
      important: true, labelIds: ["lbl-work"], date: isoDaysAgo(0, 7, 40),
    },
    {
      fromName: "David Kamau", fromEmail: "david@wekezabank.co.ke", accountId: "acct-corp", folderId: "inbox",
      subject: "Board pack draft",
      bodyHtml: "<p>Draft attached. Need sign-off by Wednesday.</p>",
      important: true,
      attachments: [{ id: id("a"), name: "board-pack-q1.docx", size: 880_000, mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }],
      labelIds: ["lbl-work"], date: isoDaysAgo(0, 6, 12),
    },
    {
      fromName: "ProtonMail Security", fromEmail: "security@protonmail.com", accountId: "acct-gmail", folderId: "inbox",
      subject: "New login detected from Nairobi, Kenya",
      bodyHtml: "<p>If this was you, no action is needed.</p>",
      labelIds: [], date: isoDaysAgo(2, 22, 10),
    },
    {
      fromName: "Eric Odenyire", fromEmail: "odenyire@afromail.com", accountId: "acct-afro", folderId: "drafts",
      subject: "Welcome speech draft",
      bodyHtml: "<p>Friends and colleagues...</p>",
      date: isoDaysAgo(0, 5, 0),
    },
    {
      fromName: "Eric Odenyire", fromEmail: "odenyire@afromail.com", accountId: "acct-afro", folderId: "scheduled",
      subject: "Newsletter — May edition",
      bodyHtml: "<p>Big things this month...</p>",
      scheduledAt: new Date(Date.now() + 86_400_000 * 2).toISOString(),
      date: new Date(Date.now() + 86_400_000 * 2).toISOString(),
    },
    {
      fromName: "Spam Bot", fromEmail: "noreply@suspicious.example", accountId: "acct-gmail", folderId: "spam",
      subject: "You've won $1,000,000",
      bodyHtml: "<p>Click here to claim now.</p>",
      date: isoDaysAgo(3),
    },
    {
      fromName: "TripBook", fromEmail: "trips@tripbook.com", accountId: "acct-gmail", folderId: "inbox",
      subject: "Your booking confirmation — Nairobi → Cape Town",
      bodyHtml: "<p>Departure: 12 May 2026 09:40 NBO → CPT. Booking ref: TBK-89421.</p>",
      labelIds: ["lbl-travel", "lbl-receipts"],
      attachments: [{ id: id("a"), name: "ticket-TBK-89421.pdf", size: 240_000, mime: "application/pdf" }],
      date: isoDaysAgo(3, 14, 10),
    },
    {
      fromName: "Stripe", fromEmail: "receipts@stripe.com", accountId: "acct-gmail", folderId: "inbox",
      subject: "Receipt from Lovable AI",
      bodyHtml: "<p>Receipt #1234 · $20.00 USD</p>",
      labelIds: ["lbl-receipts"], date: isoDaysAgo(6, 9, 20),
    },
    {
      fromName: "GitHub", fromEmail: "noreply@github.com", accountId: "acct-gmail", folderId: "inbox",
      subject: "[afromail/web] PR #142 ready for review",
      bodyHtml: "<p>cleanup of the email list virtualization</p>",
      labelIds: ["lbl-work"], date: isoDaysAgo(0, 11, 5),
    },
    {
      fromName: "Linkedin", fromEmail: "notifications@linkedin.com", accountId: "acct-gmail", folderId: "inbox",
      subject: "5 people viewed your profile this week",
      bodyHtml: "<p>See who's checking you out.</p>",
      labelIds: ["lbl-newsletter"], date: isoDaysAgo(2, 13, 0),
    },
  ];

  seeds.forEach((s, i) => {
    const mid = id();
    out.push({
      id: mid,
      threadId: mid,
      accountId: s.accountId!,
      folderId: s.folderId as SystemFolderId,
      fromName: s.fromName!, fromEmail: s.fromEmail!,
      to: [accounts.find(a => a.id === s.accountId)?.email ?? "you@afromail.com"],
      cc: [], bcc: [],
      subject: s.subject!,
      bodyHtml: s.bodyHtml!,
      bodyText: s.bodyHtml!.replace(/<[^>]*>/g, ""),
      date: s.date ?? isoDaysAgo(i),
      read: s.read ?? Math.random() > 0.45,
      starred: s.starred ?? false,
      important: s.important ?? false,
      labelIds: s.labelIds ?? [],
      attachments: s.attachments ?? [],
      scheduledAt: s.scheduledAt,
    });
  });

  return out;
}

const drafts: Draft[] = [
  {
    id: "d-1",
    accountId: "acct-afro",
    to: ["amara@afromail.com"],
    cc: [], bcc: [],
    subject: "Re: Welcome to Afromail",
    bodyHtml: "<p>Thank you Amara — happy to be aboard...</p>",
    attachments: [],
    updatedAt: isoDaysAgo(0, 5, 30),
  },
];

const filters: FilterRule[] = [
  {
    id: "f-receipts",
    name: "Auto-label receipts",
    fromContains: "receipts@",
    actions: { addLabelId: "lbl-receipts" },
  },
];

const settings: Settings = {
  density: "comfortable",
  undoSendSeconds: 5,
  shortcutsEnabled: true,
  soundOnNew: false,
  desktopNotif: false,
  loadExternalImages: "ask",
  readReceipts: false,
  vacationEnabled: false,
  vacationSubject: "I'm currently away",
  vacationBody: "I'll respond when I return.",
  forwardingTo: "",
  blockedSenders: [],
  language: "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  defaultFolder: "inbox",
  defaultLabelIds: [],
  autosaveSeconds: 5,
};

export function seedState(): State {
  return {
    accounts: JSON.parse(JSON.stringify(accounts)),
    customFolders: JSON.parse(JSON.stringify(customFolders)),
    labels: JSON.parse(JSON.stringify(labels)),
    contacts: JSON.parse(JSON.stringify(contacts)),
    messages: buildMessages(),
    drafts: JSON.parse(JSON.stringify(drafts)),
    filters: JSON.parse(JSON.stringify(filters)),
    savedSearches: [
      { id: "ss-1", name: "Unread work", query: "is:unread label:work" },
      { id: "ss-2", name: "With attachments", query: "has:attachment" },
    ],
    settings: JSON.parse(JSON.stringify(settings)),
  };
}
