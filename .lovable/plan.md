
## Goal

Turn the app into a feature-complete email client (Gmail/Outlook-class), powered by mock data so we can design and ship every interaction without waiting on real provider integrations. Real Gmail/Outlook/IMAP wiring stays available behind the scenes; the UI and state model become the focus.

## Architecture

Single mock data layer in `src/lib/mockStore.ts` — an in-memory store with localStorage persistence, exposed through React hooks (`useMessages`, `useFolders`, `useLabels`, `useContacts`, `useDrafts`, `useFilters`, `useSettings`). Every UI feature reads/writes through these hooks so the day we swap to live data, only the store changes.

```text
UI components ─► hooks (useMessages…) ─► mockStore (memory + localStorage)
                                              │
                                              └── seed: 80 realistic emails across folders/labels/threads
```

## Feature set

### 1. Mailboxes & navigation
- System folders: Inbox, Starred, Snoozed, Sent, Drafts, Scheduled, Important, Spam, Trash, All Mail
- Custom folders (user-created, nested 1 level)
- Multi-account switcher in the sidebar (Afromail + mock Gmail + mock corporate IMAP) with per-account or unified view
- Unread counts per folder, auto-updating

### 2. Message list
- Conversation threading (group by `thread_id`, show participant chips + count)
- Density toggle (comfortable / compact)
- Hover quick actions: archive, snooze, mark read/unread, delete
- Multi-select with shift-click range, select-all-on-page, "select all in folder"
- Sort: newest, oldest, unread first, starred first, has attachment
- Pagination / infinite scroll
- Empty states per folder

### 3. Message reading
- Full conversation view with collapsed history
- Inline image rendering, safe HTML sanitization
- Attachment previews (image/pdf/text icons + download)
- "Show original", view headers
- Print, forward, reply, reply-all
- Translate stub, summarize stub (mock AI buttons)

### 4. Compose
- Reply / Reply-all / Forward with quoted history
- Rich text (bold/italic/underline/lists/links/code/quote) — already partly there
- Attachments (drag-drop + picker), inline images
- Multiple "From" addresses (account switcher in compose)
- CC / BCC toggle
- Save as draft (auto-save every 5s)
- Schedule send (date/time picker)
- Send later, undo send (5s toast)
- Templates / canned responses
- Email signatures per account
- Confidential mode (mock — just a badge)

### 5. Organization
- Labels/tags (color-coded, multi-apply)
- Stars (yellow + 5 colored variants)
- Snooze (until tomorrow / next week / pick date)
- Pin to top
- Mute thread
- Mark as spam / not spam
- Move to folder
- Bulk actions on selection

### 6. Search & filters
- Top-bar search with operators: `from:`, `to:`, `subject:`, `has:attachment`, `is:unread`, `before:`, `after:`, `label:`
- Saved searches
- Advanced search dialog
- Filter rules engine: "When email matches X → apply label / move / star / forward / mark read / delete"
- Block sender list

### 7. Contacts & directory
- Personal contacts (name, email, avatar, notes, last contacted)
- Frequent / suggested contacts
- Groups (mailing lists)
- Autocomplete in compose To/Cc/Bcc

### 8. Notifications & status
- Toast on new mail, unread badge in tab title
- Desktop notifications (Notification API, opt-in)
- Sound on new mail (opt-in)
- Per-folder notification rules

### 9. Settings (full page with tabs)
- General: language, density, theme, timezone
- Accounts: connected accounts, signatures, default From
- Filters & blocked addresses
- Labels: create/edit/color
- Vacation responder / out-of-office
- Forwarding (mock)
- Keyboard shortcuts (cheat sheet + toggle)
- Notifications
- Privacy: read receipts, image loading
- Import/export (mock)

### 10. Productivity
- Keyboard shortcuts: `j/k` next/prev, `e` archive, `#` delete, `s` star, `r` reply, `a` reply-all, `f` forward, `c` compose, `/` search, `gi` go inbox, `gs` go sent, etc.
- Command palette (`Cmd+K`) — actions, navigation, account switch
- Drag messages between folders/labels
- Right-click context menu on messages

### 11. Calendar-lite hooks
- "Add to calendar" button on messages with detected dates (regex stub)
- RSVP buttons on mock invites

### 12. Mobile responsive
- Bottom nav on mobile (Inbox/Compose/Search/Menu)
- Swipe-to-archive / swipe-to-delete on rows
- Compose as full-screen sheet on mobile

## Mock data seed

`src/data/seed.ts` generates ~80 realistic messages spread across:
- 3 mock accounts (`odenyire@afromail.com`, `eodenyire@gmail.com`, `eric@wekezabank.co.ke`)
- 8 system folders + 4 custom labels (Work, Personal, Receipts, Travel)
- 12 threads (2–6 messages each), the rest singletons
- Mix of plain text, rich HTML, marketing, transactional, newsletters, attachments (mock URLs)
- Mix of read/unread/starred/snoozed/scheduled

## Build order (so the user sees progress fast)

1. Mock store + seed + hooks + account switcher
2. Folder/label sidebar with counts
3. Message list with threading, multi-select, bulk actions
4. Reading view with reply/reply-all/forward + attachments
5. Compose v2 (drafts, scheduling, signatures, multiple From)
6. Search + filter rules
7. Contacts + autocomplete
8. Settings page with all tabs
9. Keyboard shortcuts + command palette
10. Notifications + mobile polish

## Out of scope for this phase

- Real Gmail/Outlook/IMAP sync (code stays in repo, dormant)
- Real send (Compose writes to mock Sent folder)
- Real OAuth / secrets — none required for mock phase
- AI features beyond stub buttons (Summarize/Translate show toast "coming soon")

## Technical notes

- All colors via existing semantic tokens — no new palette work
- Threading model: messages share `thread_id`; list aggregates them
- Use TanStack Query against the mock store for caching/optimistic updates so the swap-to-real layer is trivial later
- Keep `afromail_messages` table untouched; mock layer is parallel to it
- Persist `mockStore` to `localStorage` keyed by user id so each test user sees their own seed

