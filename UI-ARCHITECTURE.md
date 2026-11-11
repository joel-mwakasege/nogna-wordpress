# Nogna UI Architecture Contract

Nogna uses actual source-level reusable UI components. Dependency packages alone do not count as using Shadcn.

## Required primitives

Repeated interface elements must use shared components:

- Button
- Input
- Select
- Card
- Alert
- FormField
- PageHeader

These live under src/admin/components/ui and src/admin/components/layout.

## Rules

1. Do not add a new one-off button, input, select, card, alert, or form-field pattern to App.tsx.
2. Page-specific CSS may define composition, but shared controls must use the shared primitives.
3. Every new layout must define its desktop, tablet, and mobile behavior.
4. New elements must be placed inside an intentional layout slot.
5. Verify actual imports and usage before claiming a Shadcn-based implementation.
6. Run the TypeScript build after each migration step.
7. Existing screens are migrated incrementally; no feature is considered fully migrated until its repeated controls use the shared primitives.

## Migration status

- [x] Shadcn configuration added.
- [x] Radix Slot and Select dependencies added.
- [x] Shadcn Button, Input, and Select source components added.
- [x] Shadcn theme tokens added to Tailwind and CSS.
- [x] Settings selectors migrated to Radix Select.
- [x] Repeated primary actions migrated to Shadcn Button.
- [x] Migrate Settings alert and placeholder card.
- [ ] Migrate remaining dialogs, alerts, cards, tables, and secondary actions.
