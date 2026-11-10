# Nogna Billing Product Guardrail

## Product purpose

Nogna Billing is a focused billing and invoice-management tool for small businesses. The product should help a business:

1. Create and manage workspaces.
2. Maintain customer records.
3. Create accurate invoices with practical line-item structures.
4. Record received payments and outstanding balances.
5. Produce clear billing documents.
6. Work reliably on desktop, tablet, and mobile screens.

The product must remain simple, fast, understandable, and technically correct.

## Current implemented scope

- Workspace/company creation and selection.
- Customer creation, editing, and moving customers to trash.
- Invoice creation and editing.
- Invoice sections with repeat multipliers.
- Grouped line items with shared cost-owner values.
- Editable units, days, unit amount, group name, and cost owner.
- Whole-number units and days.
- Invoice subtotal, discount, tax, and grand-total calculations.
- Draft persistence and invoice restoration.
- Undo and redo for invoice editing.
- Manual payment recording.
- Partial payments.
- Paid amount and balance due.
- Payment history.
- Payment editing and deletion.
- Invoice status based on payment state.
- Appearance controls in Settings.
- Responsive desktop, tablet, and mobile layouts.

## Immediate roadmap

### Phase 1 — Invoice output

- Finalise invoice document presentation.
- Respect section-header visibility.
- Preserve section order, line-item order, grouped items, totals, customer data, and payment state.
- Add print/PDF output only after the on-screen invoice data is stable.
- Verify the output at desktop and mobile widths.

### Phase 2 — Invoice list workflow

- Reliable invoice list loading.
- Status filtering.
- Search by invoice number and customer.
- Clear states for draft, open, partially paid, paid, overdue, and deleted.
- Preserve the user's current list view after opening and returning from an invoice.

### Phase 3 — Expenses

- Expense/receipt records.
- Supplier or payee.
- Category.
- Amount and payment status.
- Receipt attachment.
- Review state.
- List and detail views using the same responsive rules.

### Phase 4 — Reporting

- Receivables.
- Outstanding balances.
- Paid income.
- Expenses.
- Basic income versus expense summaries.

## Explicitly out of scope until approved

Do not add these merely because they are common in billing software:

- Online payment gateways.
- Cloud synchronization.
- Bank feeds.
- Team invitations and advanced permissions.
- Inventory or products.
- Quotes beyond the already-supported document structure.
- Multi-currency accounting logic.
- Tax-compliance integrations.
- AI features.
- New dashboard KPIs before the underlying financial data exists.

## Guardrail questions for every proposed change

Before implementing a feature, answer:

1. Which current product purpose does it support?
2. Which roadmap phase does it belong to?
3. Does it use data that already exists?
4. Does it introduce a new external service or integration?
5. Does it change an existing calculation or saved-data structure?
6. Does it work at desktop, tablet, and mobile widths?
7. What is the smallest complete implementation?
8. What will deliberately not be implemented yet?

If a change cannot answer these questions clearly, pause before implementation.

## Data and calculation rules

- Server calculations are authoritative for saved invoice totals, payments, balances, and statuses.
- The UI may preview calculations but must not silently disagree with saved server values.
- A payment cannot exceed the remaining balance.
- Paid amount is the sum of active payment records.
- Balance due is invoice total minus active payments, never below zero.
- Payment status is derived from total, paid amount, balance, and due date.
- Reordering line items must persist through the invoice save operation.
- Deleted records should use the existing soft-delete approach where applicable.

## UI rules

- Do not add navigation items for features that are not implemented.
- Do not place workspace controls in locations that do not match the established layout.
- Keep the main navigation and page header separate.
- Use readable font sizes and icon sizes.
- Use the existing appearance settings instead of hardcoding a new visual system.
- Every desktop layout change must include tablet and mobile behavior.
- Notifications must be close enough to the action to be understood, but never cover or crowd the form.
- Destructive actions require clear confirmation.

## Completion standard

A feature is not complete when it only renders.

It is complete when:

- It saves correctly.
- It reloads correctly.
- It handles errors visibly in the UI.
- It preserves existing records.
- It works on smaller viewports.
- Its calculations agree with the server.
- It does not add unimplemented concepts to the navigation or dashboard.
- The local build completes successfully.
