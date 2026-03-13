# TailwindCSS Copilot Instructions – Modern Frontend UI Standards

These instructions guide GitHub Copilot or any AI coding assistant to generate consistent, modern, and maintainable TailwindCSS UI code for this project.

The frontend is built using **React + TailwindCSS**, and the design philosophy follows modern SaaS dashboard UI patterns.

---

# 1. Design Philosophy

Always generate UI that is:

• clean
• minimal
• modern SaaS-style
• responsive by default
• accessible
• consistent spacing

Follow the design style used in modern applications like:

* dashboard products
* admin panels
* modern SaaS interfaces

Avoid outdated UI patterns.

---



src
│
├── api
│   └── apiClient.js
│
├── assets
│   ├── images
│   └── icons
│
├── components
│
│   ├── ui
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   └── Spinner.jsx
│   │
│   ├── layout
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── PageContainer.jsx
│   │   └── DashboardLayout.jsx
│   │
│   └── attendance
│       ├── QRScanner.jsx
│       ├── AttendanceTable.jsx
│       └── SessionCard.jsx
│
├── context
│   └── AuthContext.jsx
│
├── hooks
│   └── useAuth.js
│
├── pages
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── ScanQR.jsx
│   ├── AttendanceHistory.jsx
│   ├── StartSession.jsx
│   └── AdminReports.jsx
│
├── services
│   ├── authService.js
│   └── attendanceService.js
│
├── utils
│   └── formatDate.js
│
├── App.jsx
└── main.jsx

# 2. Layout Principles

Always use proper layout systems.

Preferred layout tools:

flex
grid
container
max-width

Example:

Good:

<div className="max-w-7xl mx-auto px-4 py-8">

Bad:

<div className="p-2 m-1">

Layouts must scale cleanly across screen sizes.

---

# 3. Responsive Design

All components must be responsive using Tailwind breakpoints.

Use these breakpoints:

sm
md
lg
xl
2xl

Example:

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

Avoid fixed widths unless necessary.

---

# 4. Spacing Consistency

Use Tailwind spacing scale consistently.

Preferred spacing:

p-4
p-6
p-8

gap-4
gap-6
gap-8

py-6
py-10

Avoid random spacing like:

p-3
p-7

Consistency improves UI rhythm.

---

# 5. Typography Standards

Use clear typography hierarchy.

Page titles:

text-2xl
font-semibold

Section titles:

text-xl
font-semibold

Body text:

text-sm
text-gray-600

Example:

<h1 className="text-2xl font-semibold text-gray-900">
Attendance Dashboard
</h1>

---

# 6. Color Usage

Follow a limited color palette.

Primary color:

blue-600

Hover states:

blue-700

Background colors:

bg-white
bg-gray-50

Borders:

border-gray-200

Text:

text-gray-900
text-gray-600

Avoid random colors unless required for status indicators.

---

# 7. Button Design

Buttons must follow consistent styles.

Primary button:

className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"

Secondary button:

className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"

Danger button:

className="bg-red-600 text-white hover:bg-red-700"

Always include:

transition
hover states
rounded corners

---

# 8. Card UI Pattern

Most UI blocks should use card layout.

Example card pattern:

<div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">

Use this pattern for:

forms
statistics
QR display
attendance lists

---

# 9. Form Design

Forms should be modern and readable.

Inputs:

className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"

Labels must always be included.

Example:

<label className="block text-sm font-medium text-gray-700">
Student ID
</label>

Spacing between form elements:

space-y-4

---

# 10. Table Design

Attendance lists should use clean tables.

Example table container:

<div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

Table header:

bg-gray-50
text-gray-600

Rows must have hover effects.

Example:

<tr className="hover:bg-gray-50">

---

# 11. QR Scanner UI Pattern

Scanner page should follow this layout.

Centered container.

Example:

<div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-sm">

Include:

page title
scanner area
instructions text

---

# 12. Dashboard Layout

Dashboard pages should use grid layouts.

Example:

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

Use cards for:

attendance stats
session info
recent scans

---

# 13. Component Reusability

Avoid repeating Tailwind classes everywhere.

Create reusable components:

Button.jsx
Card.jsx
Input.jsx
PageContainer.jsx

Example:

<Button variant="primary">
Start Session
</Button>

---

# 14. Accessibility

Always include accessibility improvements.

Examples:

focus:ring
aria-label
button type attributes

Inputs must be keyboard accessible.

---

# 15. Animations

Use subtle animations only.

Examples:

transition
duration-200
hover:scale-[1.01]

Avoid excessive animations.

---

# 16. Dark Mode Preparation

Write components compatible with dark mode.

Example:

bg-white dark:bg-gray-900
text-gray-900 dark:text-gray-100

---

# 17. File Organization

UI components must follow this structure:

src/components/ui
src/components/layout
src/components/forms

Pages should not contain excessive Tailwind code.

Move complex UI into reusable components.

---

# 18. Performance Best Practices

Avoid:

very long Tailwind class lists
deeply nested DOM structures

Prefer reusable components.

---

# 19. Code Style

React components must:

use functional components
use clear naming
avoid inline logic inside JSX

Keep JSX clean and readable.

---

# 20. Overall UI Goal

The final UI should look like a **modern SaaS dashboard** with:

clean layout
consistent spacing
clear typography
minimalistic design
professional polish
