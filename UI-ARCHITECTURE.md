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
- [x] Migrate shared notifications to the Shadcn Alert primitive.
- [x] Replace the Alert wrapper with the full Shadcn Alert primitive and variants.
- [x] Add the Shadcn Dialog primitive and migrate company creation.
- [x] Replace Card with the Shadcn Card primitive.
- [x] Add the Shadcn Table primitive for list/table migration.
- [x] Migrate high-visibility secondary actions to Shadcn Button.
- [x] Wire the invoice list to the shared Table primitive.
- [x] Wire the customer list to the shared Table primitive.
- [x] Add responsive overflow, spacing, hover, and alignment rules for shared tables.
- [x] Migrate remaining settings, invoice, customer, and payment select controls to Shadcn Select.
- [x] Migrate application shell navigation and workspace controls to Shadcn Button.
- [x] Migrate company, customer, tab, and logo-picker actions to Shadcn Button.
- [x] Migrate invoice editing, grouping, PDF, print, and draft actions to Shadcn Button.
- [x] Migrate payment form, payment history, invoice utility, search-clear, customer form, and settings action buttons.
- [x] Replace all native button controls in App.tsx with the shared Shadcn Button primitive.
- [x] Replace all native select controls in App.tsx with the shared Shadcn Select primitive.
- [x] Migrate repeated input controls to Shadcn Input.
- [x] Add and migrate textarea controls to Shadcn Textarea.
- [ ] Validate the complete migrated UI in the browser at desktop, tablet, and mobile widths.
