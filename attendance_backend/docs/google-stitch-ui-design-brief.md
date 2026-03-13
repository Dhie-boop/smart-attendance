# Google Stitch UI Design Brief

## Product Summary

Design a modern university attendance platform for QR-based class check-in for Cavendish University Uganda. The product is used by three roles:

- `admin`
- `lecturer`
- `student`

The backend already exists. The UI should feel like an official Cavendish University Uganda digital product, not like a generic internal admin panel prototype.

## Product Goals

- Make class attendance fast and low-friction
- Make QR session start and scan feel obvious
- Keep lecturer actions efficient during live classes
- Give students a focused scan experience with immediate feedback
- Give admins clear oversight of users, analytics, and exports

## Design Direction

Use a clean academic-tech visual language.

- Tone: trustworthy, efficient, modern, calm
- Style: institution-led, bright, structured, and official with branding cues from the Cavendish University Uganda logo
- Avoid: generic startup dashboard styling, purple-heavy gradients, cluttered admin tables, oversized glassmorphism
- Emphasize: clear hierarchy, large typography for live classroom use, obvious status states, confident use of spacing, and visible but controlled university branding

## Brand Anchoring

Design this as a Cavendish University Uganda platform.

- Use the Cavendish identity as the primary visual reference
- Derive the palette from the provided university logo
- Treat the logo as an institutional mark, not a decorative sticker
- Use brand blue as the dominant visual anchor across navigation, headers, QR session pages, and key actions
- Use white and pale blue neutrals to keep the interface crisp and academic
- Use crest-inspired gold only as a restrained accent, not as a dominant color
- Avoid introducing unrelated brand colors that dilute the university identity

## Visual System

### Color Direction

Use the Cavendish University Uganda logo palette as the base system.

- Background: soft white or very pale blue-white
- Primary accent: Cavendish royal blue from the logo
- Secondary accent: deeper institutional navy from the logo
- Supporting accent: muted slate blue derived from the crest and wordmark tones
- Highlight accent: restrained crest gold taken from the shield details
- Surfaces: white cards with cool blue-gray borders
- Semantic colors: success, warning, and error should be muted and sit alongside the brand palette rather than overpower it

Suggested palette:

- `#F6F8FC` background
- `#173F7A` primary brand blue
- `#0D2A56` deep institutional navy
- `#5E7FA8` supporting blue
- `#C8B27A` crest gold accent
- `#D8E1EE` border / cool neutral
- `#17263C` primary text
- `#2F7D5A` success
- `#B7791F` warning
- `#B4473D` destructive

Color usage guidance:

- Use `#173F7A` for navigation, primary actions, key headings, and session emphasis
- Use `#0D2A56` for darker surfaces, strong headers, and high-contrast sections
- Use `#5E7FA8` sparingly for secondary actions, charts, and supportive UI details
- Use `#C8B27A` for fine accents such as badges, dividers, or institutional highlights
- Keep success, warning, and error states functional and subordinate to the brand colors

### Typography

Avoid default dashboard fonts.

- Headings: `Space Grotesk` or `Sora`
- Body: `Manrope` or `Source Sans 3`
- Numeric countdowns and session metadata: use tabular-looking text styling

### Shape And Components

- Medium radius cards, not fully rounded bubbles
- Visible section dividers
- Clear table headers and filters
- Strong button hierarchy
- Large QR display frame for lecturer session screens

## Core Screens To Generate

### 1. Authentication

Create:

- Login page
- Register page

Requirements:

- Split layout or strong hero panel
- Role-aware messaging
- Clear form validation states
- Professional, not playful

### 2. Lecturer Dashboard

Create a lecturer home page showing:

- Welcome header
- Quick stats cards
- Course list
- Active sessions
- Primary CTA to start session

Requirements:

- Designed for frequent repeated use
- Dense enough to be useful, but not cramped

### 3. Course Management

Create:

- Course list page
- Create course modal or side panel
- Enrolled students view

Requirements:

- Strong table layout
- Search or filter affordances
- Clear enrollment action

### 4. Start Session Screen

Create a lecturer session-start page with:

- Course selector
- Optional room and location fields
- Session summary panel
- Large primary button: `Start Session`

Requirements:

- Must feel decisive and classroom-ready
- Reduce friction for starting a class quickly

### 5. Live QR Session Screen

This is the most important lecturer screen.

Create a page with:

- Very large QR code centered or slightly right-weighted
- Course code and course title prominent
- Session status badge
- Expiry countdown timer
- Optional location or room info
- Attendance count area
- End session button

Requirements:

- Readable from across a classroom
- Minimal distractions
- Strong contrast
- Large type and large whitespace blocks

### 6. Student Dashboard

Create a student home page showing:

- Active sessions list
- Primary CTA to scan QR
- Recent attendance history preview
- Status cards for today or this week

Requirements:

- Mobile-first
- Simple and focused

### 7. Student QR Scanner Screen

This is the most important student screen.

Create a mobile-first page with:

- Large scan frame
- Camera permission state
- Scanning state
- Success state
- Duplicate scan state
- Expired QR state
- Retry action

Requirements:

- Minimal chrome
- High visibility status messages
- Designed for poor lighting and quick interactions

### 8. Attendance Report Screen

Create a lecturer report page with:

- Session summary header
- Attendance table
- Export action
- Empty state when no students have checked in

Requirements:

- Clear timestamps
- Status badges
- Filter or search-ready layout

### 9. Admin Users Screen

Create an admin page with:

- User table
- Role chips
- Status chips
- Pagination controls
- Search/filter bar

Requirements:

- Strong information density
- Good readability at laptop widths

### 10. Admin Analytics Screen

Create an analytics page with:

- Course summary cards
- Attendance trends or bar charts
- Sessions count
- Attendance totals
- Export shortcuts

Requirements:

- Practical and data-led
- No decorative fake charts

## Real Content To Use In Mockups

Use the actual academic content from the project files.

Institution branding context:

- `Cavendish University Uganda`
- Official university attendance platform
- Use the Cavendish logo in a restrained, official way in auth screens, app shell, and branded headers

Example course data:

- `BIT311` — `ICT Project Planning and Management`
- `BIT213/BSE213` — `Web Development and Management / Advanced internet & Web programming`
- `BIT113` — `Fundamentals of Information Systems`
- `BIT212` — `Systems Analysis and Design`

Example student data:

- `Musa Yahya Ali Omer`
- `SIMON SACARAN MICHAEL GEORGE`
- `Amani Abdul Ali`

Example institution context:

- Cavendish University Uganda attendance platform
- Classroom and timetable workflow
- QR code expires quickly after a session starts

## Layout Guidance

### Desktop

- Use a left sidebar for authenticated screens
- Keep content in a strong grid
- Use a top utility bar for profile and session context

### Mobile

- Prioritize bottom navigation or simple header tabs
- Student scan flow should feel native and focused
- Avoid dense tables on student screens

## Component Inventory

Ask Stitch to generate these reusable pieces:

- App shell with sidebar
- Header with profile menu
- Metric cards
- Search and filter bars
- Data tables
- Status badges
- Form panels
- Session countdown card
- QR display card
- QR scan frame
- Success, warning, and error feedback panels
- Empty states

## States To Include

For each relevant screen, include:

- Default state
- Loading state
- Empty state
- Success state
- Error state
- Permission denied state where relevant

Especially for the student scan page, include:

- camera blocked
- scanning
- scan success
- duplicate scan
- expired QR
- network failure

## Stitch Prompt Template

Use this prompt as a starting point in Google Stitch:

```text
Design a modern React web app UI for Cavendish University Uganda for a smart attendance system that uses QR codes for classroom check-in. The app has three roles: admin, lecturer, and student. Use the Cavendish University Uganda logo as the brand reference and derive the visual palette from it: royal brand blue, deep institutional navy, cool pale backgrounds, white surfaces, and restrained crest-gold accents. Keep the interface official, academic, and production-ready. Avoid generic startup dashboards, purple-heavy visuals, and unrelated colors that conflict with the university brand.

Create responsive screens for login, lecturer dashboard, course management, session start, live QR display, student dashboard, student QR scanner, attendance reports, admin user management, and admin analytics. Lecturer screens should be optimized for fast classroom use. Student scan screens should be mobile-first and very focused. Admin screens should be data-dense but readable.

Use realistic content such as Cavendish University Uganda branding, BIT311 ICT Project Planning and Management, BIT213/BSE213 Web Development and Management, and student names like Musa Yahya Ali Omer. Include status badges, tables, countdown timer UI, export actions, and empty/loading/error states.
```

## Page-Specific Stitch Prompts

### Lecturer Live QR Screen Prompt

```text
Design a lecturer live session screen for Cavendish University Uganda in a smart attendance app. The page should prominently display a large QR code for students to scan in class, with the course code BIT311 and the title ICT Project Planning and Management. Use Cavendish brand blue and deep navy from the university logo, with white and pale blue surfaces and restrained gold accents. Show a visible countdown timer until QR expiry, a session active badge, room details, attendance count, and a strong End Session button. The layout should be readable from across a classroom and use large typography, strong contrast, and minimal distractions.
```

### Student Scanner Prompt

```text
Design a mobile-first QR scanner screen for Cavendish University Uganda in a university attendance app. The screen should focus on the camera scan frame, with minimal surrounding UI, high visibility instructions, and clear states for camera permission denied, scanning, success, duplicate scan, expired QR, and network failure. Use the university logo palette: royal blue, deep navy, pale backgrounds, white surfaces, and restrained gold accents. Keep the screen calm, official, and highly legible.
```

### Admin Analytics Prompt

```text
Design an admin analytics dashboard for Cavendish University Uganda for a smart attendance system. Show course-level attendance summaries, total sessions, total attendance records, export actions, and clean charts or tables. Use real-looking academic data such as BIT311 ICT Project Planning and Management. Use the Cavendish logo palette with strong institutional blue branding and restrained gold accents. The UI should feel professional, efficient, official, and information-dense without looking cluttered.
```

## Handoff Notes For Implementation

When converting Stitch output into the real frontend:

- Preserve layout and interaction hierarchy first
- Replace fake charts with real API-backed components later
- Keep QR display and QR scan screens simpler than the rest of the app
- Use backend role rules exactly as implemented in the API
- Do not depend on UI-only permissions for security
