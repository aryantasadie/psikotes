<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:anti-frankenstein-frontend -->
# Anti-Frankenstein Frontend Guardrails
- **Component Reuse:** Always search existing components in `src/components/` before creating new ones. Never duplicate button, modal, badge, or card primitives.
- **Design System Consistency:** Use project design tokens and Tailwind utility classes. Avoid random conflicting inline styles and mismatched color palettes.
- **Dependency Discipline:** Never install unvetted packages for trivial tasks; reuse existing libraries (`lucide-react`, `tailwindcss`, `jspdf`, `jszip`).
- **Clean Architecture:** Keep `'use client'` minimal and isolated to interactive leaf nodes. Remove dead variables, orphaned imports, and ghost code immediately during refactoring.
<!-- END:anti-frankenstein-frontend -->
