Step 2: Configure Vite Plugin

Add the @tailwindcss/vite plugin to your Vite configuration file:

// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})

For React projects with Vite:

// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})

Step 3: Import Tailwind CSS

Add the Tailwind CSS import to your main CSS file (e.g., src/index.css or src/App.css):

@import "tailwindcss";

Step 4: Verify CSS Import in Entry Point

Ensure your main CSS file is imported in your application entry point:

// src/main.tsx or src/main.ts
import './index.css'

Step 5: Start Development Server

Run the development server to verify installation:

npm run dev

What NOT to Do in Tailwind v4
Do NOT Create tailwind.config.js

Tailwind v4 uses CSS-first configuration. Do not create a tailwind.config.js file unless you have specific legacy requirements.

// ❌ NOT NEEDED in Tailwind v4
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}

Do NOT Create postcss.config.js for Tailwind

When using the @tailwindcss/vite plugin, PostCSS configuration for Tailwind is not required.

// ❌ NOT NEEDED when using @tailwindcss/vite
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

Do NOT Use Old Directives

The old @tailwind directives are replaced by a single import:

/* ❌ OLD - Do not use in Tailwind v4 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ NEW - Use this in Tailwind v4 */
@import "tailwindcss";

CSS-First Configuration (Tailwind v4)
Custom Theme Configuration

Use the @theme directive in your CSS to customize your design tokens:

@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --font-sans: 'Inter', system-ui, sans-serif;
  --radius-lg: 0.75rem;
}

Adding Custom Utilities

Define custom utilities directly in CSS:

@import "tailwindcss";

@utility content-auto {
  content-visibility: auto;
}

@utility scrollbar-hidden {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

Adding Custom Variants

Define custom variants in CSS:

@import "tailwindcss";

@variant hocus (&:hover, &:focus);
@variant group-hocus (:merge(.group):hover &, :merge(.group):focus &);