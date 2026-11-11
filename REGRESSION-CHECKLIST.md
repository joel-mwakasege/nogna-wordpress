# Nogna Billing Regression Checklist

Run this checklist after every invoice, payment, navigation, or layout change.

## Navigation and refresh

- [ ] Refresh keeps the current main section open.
- [ ] Refresh does not send the user to My Company unexpectedly.
- [ ] Opening and returning from an invoice preserves the current list view.
- [ ] Sidebar and page-header navigation remain separate.
- [ ] No unimplemented navigation item appears.

## Customers

- [ ] Create a customer.
- [ ] Edit a customer.
- [ ] Move a customer to trash.
- [ ] Success and error notifications use the configured colors.
- [ ] Customer data remains after refresh.

## Invoices

- [ ] Create and save a draft invoice.
- [ ] Reload the invoice and confirm all line items remain.
- [ ] Units remain whole numbers.
- [ ] Days increment in whole numbers.
- [ ] Section repeat multipliers calculate correctly.
- [ ] Section subtotals and grand totals are correct.
- [ ] Dragged line-item order persists after saving.
- [ ] Undo and redo work without losing fields.
- [ ] Remarks remain ordinary notes.
- [ ] Matching Remarks text alone never creates grouping.

## Combined Price

- [ ] Activate Combined Price mode.
- [ ] Select line items in section one.
- [ ] Select line items in another section.
- [ ] Choose one Cost owner per selected section.
- [ ] Apply once and confirm every selected section is updated.
- [ ] Confirm selection mode closes after applying.
- [ ] Reopen Combined Price and confirm existing members are checked.
- [ ] Add a new member and apply.
- [ ] Remove an existing member and apply.
- [ ] Confirm unselected items remain independent.
- [ ] Confirm separate groups do not merge.

## Payments

- [ ] Record a payment.
- [ ] Confirm payment history remains visible after reload.
- [ ] Edit a payment.
- [ ] Delete a payment.
- [ ] Verify paid amount and balance due.
- [ ] Verify partial, paid, and overdue statuses.

## PDF and print

- [ ] PDF includes customer details, sections, line items, Remarks, totals, and payment state.
- [ ] PDF includes explicit Combined Price behavior.
- [ ] PDF shows section subtotals and repeated-section totals.
- [ ] First line item is separated from the table header.
- [ ] PDF has no left/right table borders if not intended.
- [ ] Browser URL, date, time, and page artifacts are absent.

## Responsive layout

- [ ] Test desktop width.
- [ ] Test tablet width.
- [ ] Test mobile width.
- [ ] No horizontal overflow.
- [ ] Settings fields align correctly.
- [ ] Notifications do not crowd forms.
- [ ] Invoice list notifications sit on their own row above search and filters.
- [ ] Combined Price selection controls do not push other fields out of view.

## Build

- [ ] npm run build completes successfully.
- [ ] No TypeScript errors.
- [ ] Hard refresh after deployment and verify the new assets load.
