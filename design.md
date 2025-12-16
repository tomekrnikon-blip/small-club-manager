# Small Club Manager (SKM) - Mobile App Design

## Design Philosophy
Native iOS-style app with dark theme (slate/navy background), green accent color (#22c55e), and clean modern interface following Apple Human Interface Guidelines.

---

## Color Palette

| Role | Color | Usage |
|------|-------|-------|
| **Primary Accent** | `#22c55e` (Green) | CTAs, active states, highlights |
| **Secondary** | `#1e40af` (Blue) | Links, info elements |
| **Background** | `#0f172a` (Slate 900) | Main background |
| **Surface** | `#1e293b` (Slate 800) | Cards, elevated surfaces |
| **Surface Elevated** | `#334155` (Slate 700) | Modals, sheets |
| **Text Primary** | `#f8fafc` (Slate 50) | Main text |
| **Text Secondary** | `#94a3b8` (Slate 400) | Subtitles, hints |
| **Text Disabled** | `#64748b` (Slate 500) | Disabled states |
| **Danger** | `#ef4444` (Red) | Errors, delete actions |
| **Warning** | `#f59e0b` (Amber) | Warnings, alerts |
| **Success** | `#22c55e` (Green) | Success states |

---

## Typography Scale

| Type | Size | Weight | Line Height |
|------|------|--------|-------------|
| **Title** | 28pt | Bold | 36pt |
| **Subtitle** | 20pt | Semibold | 28pt |
| **Body** | 16pt | Regular | 24pt |
| **Body Bold** | 16pt | Semibold | 24pt |
| **Caption** | 14pt | Regular | 20pt |
| **Small** | 12pt | Regular | 16pt |

---

## Spacing System (8pt Grid)

- **xs**: 4pt
- **sm**: 8pt
- **md**: 12pt
- **lg**: 16pt
- **xl**: 24pt
- **2xl**: 32pt

---

## Border Radius

- **Buttons**: 12pt
- **Cards**: 16pt
- **Sheets/Modals**: 24pt
- **Avatars**: Full (50%)
- **Inputs**: 12pt

---

## Screen List

### Authentication
1. **Welcome Screen** - App logo, login button, app description
2. **Login Screen** - OAuth login with Manus

### Main Tabs (Bottom Navigation)
1. **Home (Dashboard)** - Quick stats, recent activity, shortcuts
2. **Players** - Player list, search, filters
3. **Matches** - Match list, results, upcoming
4. **Calendar** - Monthly view with events
5. **More** - Extended menu (slide-up sheet)

### Club Management
6. **Club Profile** - Club info, logo, settings
7. **Club Members** - Member list, roles, invitations
8. **Teams** - Team list, age groups

### Player Management
9. **Player List** - Grid/list view, search, filters
10. **Player Detail** - Stats, history, profile
11. **Add/Edit Player** - Form with photo upload
12. **Player Stats** - Circular progress indicators

### Match Management
13. **Match List** - Upcoming/past matches
14. **Match Detail** - Score, stats, lineup
15. **Add/Edit Match** - Form with opponent, date
16. **Match Stats Entry** - Per-player stats input
17. **Call-ups** - Player selection for match

### Training Management
18. **Training List** - Schedule, locations
19. **Training Detail** - Attendance, notes
20. **Add/Edit Training** - Form
21. **Attendance Sheet** - Check-in list

### Finance (Admin only)
22. **Finance Dashboard** - Charts, summary
23. **Transaction List** - Income/expense list
24. **Add Transaction** - Form with categories
25. **Finance Categories** - Manage categories

### Academy (Szkółka)
26. **Academy Dashboard** - Stats, paid/unpaid
27. **Student List** - Age group filters
28. **Student Detail** - Payments, attendance
29. **Add/Edit Student** - Form with parent info
30. **Payment History** - Per-student payments

### Calendar
31. **Calendar View** - Monthly with dots
32. **Day Detail** - Events for selected day
33. **Add Event** - Quick add match/training

### Settings & Admin
34. **Settings** - User preferences, notifications
35. **Notifications** - List with badges
36. **Master Admin Panel** - Users, clubs, subscriptions
37. **Subscription** - Plans, payment

### Other
38. **Gallery** - Photo grid, albums
39. **Photo Viewer** - Full-screen with zoom
40. **PDF Reports** - Export options

---

## Primary Content by Screen

### Home (Dashboard)
- **Header**: Club logo, name, notification bell
- **Quick Stats Cards**: Players count, upcoming match, training attendance %
- **Recent Activity**: Last 5 events (matches, trainings)
- **Shortcuts**: Quick actions (add player, add match)

### Players List
- **Search Bar**: Filter by name
- **Segment Control**: All / Goalkeepers / Defenders / Midfielders / Forwards
- **Player Cards**: Photo, name, position, jersey number
- **FAB**: Add new player

### Player Detail
- **Header**: Large photo, name, position badge
- **Stats Ring**: Goals, assists, minutes (circular progress)
- **Season Stats**: Table with detailed numbers
- **Match History**: Recent matches played
- **Injury Status**: Current injury if any

### Match Detail
- **Score Display**: Large centered score
- **Match Info**: Date, opponent, location, home/away
- **Lineup**: Player list with stats
- **Stats Summary**: Goals, cards, etc.

### Finance Dashboard
- **Balance Card**: Total income vs expenses
- **Chart**: Line chart (6 months)
- **Pie Chart**: Budget breakdown by category
- **Recent Transactions**: List with icons

### Academy Dashboard
- **Stats Cards**: Total students, paid, unpaid
- **Age Group Tabs**: Żak, Orlik, Młodzik, etc.
- **Student Cards**: Name, parent, payment status
- **Payment Reminders**: Quick send button

---

## Key User Flows

### 1. Login Flow
```
Welcome → Login Button → OAuth → Dashboard
```

### 2. Add Player Flow
```
Players Tab → FAB (+) → Player Form → Save → Player List (updated)
```

### 3. Record Match Flow
```
Matches Tab → Add Match → Fill Form → Save → Match Detail → Add Stats → Done
```

### 4. Check Attendance Flow
```
Calendar → Select Training → Attendance Sheet → Mark Present/Absent → Save
```

### 5. Send Payment Reminder Flow
```
Academy → Student → Payment History → Send Reminder → Confirm → Sent
```

### 6. Master Admin Grant PRO Flow
```
More → Master Admin → Users → Select User → Grant PRO → Confirm
```

---

## Bottom Navigation Structure

| Tab | Icon | Label | Screen |
|-----|------|-------|--------|
| 1 | house.fill | Start | Dashboard |
| 2 | person.2.fill | Kadra | Players |
| 3 | sportscourt.fill | Mecze | Matches |
| 4 | calendar | Kalendarz | Calendar |
| 5 | ellipsis | Więcej | More Menu |

### More Menu (Slide-up Sheet)
- Treningi (Training)
- Szkółka (Academy)
- Finanse (Finance) - Admin only
- Galeria (Gallery)
- Powiadomienia (Notifications)
- Ustawienia (Settings)
- Wyloguj (Logout)

---

## Component Patterns

### Card Style
```
- Background: Slate 800
- Border: 1px Slate 700 or Green/30%
- Border Radius: 16pt
- Padding: 16pt
- Shadow: subtle dark shadow
```

### Button Styles
```
Primary: Green background, white text
Secondary: Slate 700 background, white text
Danger: Red background, white text
Ghost: Transparent, green text
```

### Input Fields
```
- Background: Slate 800
- Border: 1px Slate 600
- Focus Border: Green
- Border Radius: 12pt
- Padding: 12pt horizontal, 14pt vertical
```

### List Items
```
- Separator: 1px Slate 700
- Chevron: Slate 500
- Active: Green tint background
```

---

## Accessibility

- Touch targets: Minimum 44pt
- Color contrast: WCAG AA compliant
- Font sizes: Minimum 14pt for body text
- Icons: Always with labels in navigation
- Safe areas: Respect notch and home indicator
