export type EmailProvider = 
  | 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'protonmail' 
  | 'zoho' | 'aol' | 'yandex' | 'fastmail' | 'tutanota' | 'afromail';

export interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  provider: EmailProvider;
  labels?: string[];
  hasAttachment?: boolean;
}

export interface ProviderInfo {
  id: EmailProvider;
  name: string;
  icon: string;
  connected: boolean;
  unread: number;
}

export const providers: ProviderInfo[] = [
  { id: 'afromail', name: 'Afromail', icon: '🌍', connected: true, unread: 5 },
  { id: 'gmail', name: 'Gmail', icon: '📧', connected: true, unread: 12 },
  { id: 'outlook', name: 'Outlook', icon: '📬', connected: true, unread: 3 },
  { id: 'yahoo', name: 'Yahoo Mail', icon: '📨', connected: true, unread: 7 },
  { id: 'icloud', name: 'iCloud Mail', icon: '☁️', connected: false, unread: 0 },
  { id: 'protonmail', name: 'ProtonMail', icon: '🔒', connected: true, unread: 2 },
  { id: 'zoho', name: 'Zoho Mail', icon: '📋', connected: false, unread: 0 },
  { id: 'aol', name: 'AOL Mail', icon: '💌', connected: false, unread: 0 },
  { id: 'yandex', name: 'Yandex Mail', icon: '🔴', connected: false, unread: 0 },
  { id: 'fastmail', name: 'Fastmail', icon: '⚡', connected: false, unread: 0 },
  { id: 'tutanota', name: 'Tuta Mail', icon: '🛡️', connected: false, unread: 0 },
];

export const mockEmails: Email[] = [
  {
    id: '1',
    from: 'Amara Osei',
    fromEmail: 'amara@afromail.com',
    to: 'you@afromail.com',
    subject: 'Welcome to Afromail — Africa\'s Premier Email',
    preview: 'We\'re thrilled to have you join the Afromail community. Discover features built for Africa...',
    body: `Dear User,\n\nWe're thrilled to have you join the Afromail community! Afromail is built from the ground up for the African market, with features like:\n\n• Offline email access for low-connectivity areas\n• Local language support across 50+ African languages\n• Ultra-fast servers across the continent\n• End-to-end encryption\n• Integration with M-Pesa and other mobile money platforms\n\nWelcome aboard!\n\nBest regards,\nAmara Osei\nAfromail Team`,
    date: '2026-04-05T10:30:00',
    read: false,
    starred: true,
    provider: 'afromail',
    labels: ['Important'],
  },
  {
    id: '2',
    from: 'Google Workspace',
    fromEmail: 'no-reply@google.com',
    to: 'you@gmail.com',
    subject: 'Your weekly security summary',
    preview: 'No security issues were found in the last 7 days. Your account is secure...',
    body: 'No security issues were found in the last 7 days. Your account is secure. Review your security settings at any time in your Google Account.',
    date: '2026-04-05T09:15:00',
    read: false,
    starred: false,
    provider: 'gmail',
  },
  {
    id: '3',
    from: 'Kwame Mensah',
    fromEmail: 'kwame.m@afromail.com',
    to: 'you@afromail.com',
    subject: 'Re: Pan-African Tech Summit 2026',
    preview: 'Looking forward to the summit next month! I\'ve confirmed the panel discussion...',
    body: 'Looking forward to the summit next month! I\'ve confirmed the panel discussion on African digital infrastructure. Let me know if you need me to prepare any slides.\n\nKwame',
    date: '2026-04-05T08:45:00',
    read: false,
    starred: false,
    provider: 'afromail',
    labels: ['Events'],
  },
  {
    id: '4',
    from: 'Microsoft 365',
    fromEmail: 'noreply@microsoft.com',
    to: 'you@outlook.com',
    subject: 'Your OneDrive storage is 80% full',
    preview: 'Consider upgrading your plan or freeing up space to continue syncing...',
    body: 'Your OneDrive storage is 80% full. Consider upgrading your plan or freeing up space to continue syncing your files across devices.',
    date: '2026-04-04T18:20:00',
    read: true,
    starred: false,
    provider: 'outlook',
    hasAttachment: true,
  },
  {
    id: '5',
    from: 'Fatima Diallo',
    fromEmail: 'fatima@afromail.com',
    to: 'you@afromail.com',
    subject: 'Invoice #AF-2026-0412',
    preview: 'Please find attached the invoice for the design consultation services...',
    body: 'Please find attached the invoice for the design consultation services rendered in March 2026. Payment can be made via M-Pesa or bank transfer.\n\nThank you,\nFatima',
    date: '2026-04-04T15:30:00',
    read: false,
    starred: true,
    provider: 'afromail',
    hasAttachment: true,
    labels: ['Finance'],
  },
  {
    id: '6',
    from: 'Yahoo Digest',
    fromEmail: 'digest@yahoo.com',
    to: 'you@yahoo.com',
    subject: 'Your daily news briefing',
    preview: 'Top stories: African Union announces new digital trade framework...',
    body: 'Top stories today:\n\n1. African Union announces new digital trade framework\n2. Tech startups in Lagos raise $500M in Q1\n3. Renewable energy projects expand across East Africa',
    date: '2026-04-04T07:00:00',
    read: true,
    starred: false,
    provider: 'yahoo',
  },
  {
    id: '7',
    from: 'ProtonMail Security',
    fromEmail: 'security@protonmail.com',
    to: 'you@protonmail.com',
    subject: 'New login detected from Nairobi, Kenya',
    preview: 'A new login to your account was detected. If this was you, no action needed...',
    body: 'A new login to your account was detected from Nairobi, Kenya. If this was you, no action is needed. Otherwise, please secure your account immediately.',
    date: '2026-04-03T22:10:00',
    read: false,
    starred: false,
    provider: 'protonmail',
    labels: ['Security'],
  },
  {
    id: '8',
    from: 'Chinelo Ibe',
    fromEmail: 'chinelo@gmail.com',
    to: 'you@gmail.com',
    subject: 'Project Baobab — Final Review',
    preview: 'The final designs are ready for your review. I\'ve incorporated all feedback...',
    body: 'The final designs are ready for your review. I\'ve incorporated all the feedback from the last meeting. The client presentation is scheduled for Friday.\n\nBest,\nChinelo',
    date: '2026-04-03T16:45:00',
    read: true,
    starred: true,
    provider: 'gmail',
    hasAttachment: true,
  },
  {
    id: '9',
    from: 'Afromail Updates',
    fromEmail: 'updates@afromail.com',
    to: 'you@afromail.com',
    subject: 'New: Offline Mode & Language Pack Updates',
    preview: 'We\'ve just released offline mode for 12 more countries and added Swahili...',
    body: 'Exciting updates!\n\n• Offline mode now available in 12 more countries\n• Swahili, Yoruba, and Amharic language packs updated\n• New M-Pesa integration for premium subscriptions\n• Dark mode improvements\n\nUpdate your app to get the latest features.',
    date: '2026-04-03T11:00:00',
    read: false,
    starred: false,
    provider: 'afromail',
  },
  {
    id: '10',
    from: 'Teams Notification',
    fromEmail: 'teams@outlook.com',
    to: 'you@outlook.com',
    subject: 'You have 3 unread messages in #general',
    preview: 'David mentioned you in a message. Click to view the conversation...',
    body: 'You have 3 unread messages in the #general channel.\n\nDavid mentioned you: "@you can you review the API docs?"\n\nClick to view the full conversation.',
    date: '2026-04-02T14:30:00',
    read: true,
    starred: false,
    provider: 'outlook',
  },
];
