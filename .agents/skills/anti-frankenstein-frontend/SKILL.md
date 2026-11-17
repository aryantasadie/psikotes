---
name: anti-frankenstein-frontend
description: Audit and refactor frontend code to eliminate patchwork UI, duplicate components, style inconsistencies, and unnecessary dependencies.
---

# Anti-Frankenstein Frontend Skill

Use this skill when auditing, refactoring, or building frontend features to ensure code cohesion, prevent UI fragmentation, and maintain design system integrity.

## Core Directives

1. **Audit for Component Duplication**:
   - Check if similar modals, buttons, table headers, or cards exist across `src/components/` and `src/app/`.
   - Consolidate duplicate UI patterns into shared, parameterized components.

2. **Normalize Styling**:
   - Replace arbitrary inline color hexes and spacing with project design tokens (Tailwind CSS and established theme palettes).
   - Ensure uniform typography hierarchy, button sizing, card padding, and border radius.

3. **Prune Dead and Patchwork Code**:
   - Detect and remove unused states, orphaned imports, commented-out JSX, and obsolete CSS overrides.
   - Verify layout responsiveness across mobile, tablet, and desktop breakpoints.

4. **Verify Dependency Footprint**:
   - Verify that no unnecessary external libraries are introduced when native APIs or existing dependencies suffice.
