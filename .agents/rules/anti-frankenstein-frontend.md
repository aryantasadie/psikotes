---
description: Anti-Frankenstein Frontend guardrails to prevent patchwork UI, component duplication, inconsistent styling, and library bloat.
globs: "**/*.{tsx,jsx,ts,js,css,html}"
---

# Anti-Frankenstein Frontend Guardrails

You are strictly prohibited from building "Frankenstein" frontends—patchwork UI, inconsistent styling, duplicate components, or cobbled-together libraries. Every frontend modification must adhere to these rules:

## 1. Zero Duplicate Primitives & Component Reuse (The "Check First" Rule)
- **Search Before You Build:** Before creating any new UI component, modal, table, card, button, or badge, always inspect existing components (`src/components/`, common UI folders) to see what already exists.
- **Never Re-invent Primitives:** If a project-approved primitive (e.g. Button, Modal, Card, Dropdown, Report Layout) already exists, reuse or extend it. Never create a separate slightly-different version.
- **Single Source of Truth:** Keep shared logic and reusable layouts (such as report headers, badges, assessment score cards) unified in single canonical components.

## 2. Design System & Styling Discipline (No Patchwork Visuals)
- **Stick to Established Tokens:** Follow the established project color palette (Primary Teal `#0d9488` / `#0f766e`, Dark Slate `#0F172A` / `#1E293B`, Neutral Slate `#64748B` / `#E2E8F0`, Accent Indigo `#4F46E5`, Status Emerald/Amber/Rose).
- **No Random Inline Style Chaos:** Do not inject random, conflicting inline styles with hardcoded arbitrary values when Tailwind utilities or existing design system classes are available.
- **Visual Harmony:** Maintain consistent border-radius (e.g. `rounded-xl` / `12px`), shadows (`0 4px 6px -1px rgba(0,0,0,0.05)`), typography scale, and spacing across all pages.

## 3. Dependency & Library Discipline (No Unvetted Body Parts)
- **No Random npm Packages:** Never run `npm install` for trivial tasks (e.g. date formatting, small icons, basic animations) that can be handled natively or with already installed libraries.
- **Unified Icon System:** Use existing installed icon packages (e.g. `lucide-react` or established clean inline SVG icons) rather than mixing multiple competing icon styles.

## 4. Architectural Boundaries (Server vs. Client Components)
- **Minimal `'use client'`:** Only place `'use client'` on components that require browser interactivity, state, or client hooks.
- **Data Flow Discipline:** Keep data fetching and heavy computations clean, typed, and decoupled from presentation logic.

## 5. Surgical Refactoring & Cleanup
- **No Ghost Code:** When refactoring or replacing a UI section, completely remove old unused implementations, dead states, orphaned imports, and commented-out code blocks.
- **Responsive & Accessible:** Ensure all UI elements scale cleanly on mobile, tablet, and desktop without broken overflow, horizontal clipping, or unreadable contrast.
