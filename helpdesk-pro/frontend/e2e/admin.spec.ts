import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Admin Panel', () => {

  // ── Users ─────────────────────────────────────────────────────────────────

  test('Admin can view the Users list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByRole('heading', { name: /Users/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });
  });

  // ── Analytics ─────────────────────────────────────────────────────────────

  test('Admin can view the Analytics page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/analytics');
    await expect(page).toHaveURL(/\/admin\/analytics/);
    await expect(page.getByRole('heading', { name: /Analytics/i })).toBeVisible({ timeout: 10000 });

    // KPI cards appear once the analytics data loads
    // The component uses `*ngIf="data()"` so we wait for any stat card content
    await expect(page.locator('text=Total Tickets').or(page.locator('text=Resolved'))).first().toBeVisible({ timeout: 15000 });
  });

  // ── Automation Rules ──────────────────────────────────────────────────────

  test('Admin can view the Automation Rules page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/automation-rules');
    await expect(page).toHaveURL(/\/admin\/automation-rules/);
    await expect(page.getByRole('heading', { name: /Automation Rules/i })).toBeVisible({ timeout: 10000 });

    // The page shows either the table of rules or an empty-state message
    await expect(
      page.locator('text=No automation rules defined').or(page.locator('table'))
    ).toBeVisible({ timeout: 15000 });
  });

  test('Admin can create an automation rule', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/automation-rules');
    await expect(
      page.locator('app-skeleton-loader').or(page.locator('text=No automation rules defined')).or(page.locator('table'))
    ).first().toBeVisible({ timeout: 15000 });

    // Click the "Add Rule" button to reveal the create form
    await page.getByRole('button', { name: /Add Rule/i }).click();

    // The form header says "New Automation Rule"
    await expect(page.getByText('New Automation Rule')).toBeVisible({ timeout: 5000 });

    const ruleName = `E2E Rule ${Date.now()}`;
    await page.locator('input[placeholder*="Auto-close"]').fill(ruleName);

    // Trigger event field
    await page.locator('input[placeholder*="ticket.created"]').fill('ticket.created');

    // Save the rule
    await page.getByRole('button', { name: /Save Rule/i }).click();

    // After save the form closes and the new rule should appear in the table
    await expect(page.getByText('New Automation Rule')).toHaveCount(0, { timeout: 8000 });
    await expect(page.getByText(ruleName)).toBeVisible({ timeout: 10000 });
  });

  test('Admin can toggle an automation rule active/inactive', async ({ page }) => {
    // NOTE: The current automation-rules component does not expose a toggle
    // button — it only shows active/inactive text badges and a delete button.
    // This test is skipped until a toggle action is added to the UI.
    test.skip(true, 'Toggle action not yet implemented in automation-rules UI');
  });

  test('Admin can delete an automation rule', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/automation-rules');

    // First create a rule so we have something to delete
    await expect(
      page.locator('app-skeleton-loader').or(page.locator('text=No automation rules defined')).or(page.locator('table'))
    ).first().toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Add Rule/i }).click();
    await expect(page.getByText('New Automation Rule')).toBeVisible({ timeout: 5000 });

    const ruleName = `E2E Delete Rule ${Date.now()}`;
    await page.locator('input[placeholder*="Auto-close"]').fill(ruleName);
    await page.locator('input[placeholder*="ticket.created"]').fill('ticket.created');
    await page.getByRole('button', { name: /Save Rule/i }).click();

    // Wait for the rule to appear
    await expect(page.getByText(ruleName)).toBeVisible({ timeout: 10000 });

    // Find the delete button in the same table row
    const ruleRow = page.locator('tr').filter({ hasText: ruleName });
    await ruleRow.locator('button').filter({ has: page.locator('.pi-trash') }).click();

    // Rule should be removed from the list
    await expect(page.getByText(ruleName)).toHaveCount(0, { timeout: 8000 });
  });

  // ── Departments ───────────────────────────────────────────────────────────

  test('Admin can view the Departments page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/departments');
    await expect(page).toHaveURL(/\/admin\/departments/);
    await expect(page.getByRole('heading', { name: /Departments/i })).toBeVisible({ timeout: 10000 });

    // The page shows either existing departments or an empty state
    await expect(
      page.locator('text=No departments yet').or(page.locator('text=Active').or(page.locator('text=Inactive')))
    ).toBeVisible({ timeout: 15000 });
  });

  // ── SLA Policies ──────────────────────────────────────────────────────────

  test('Admin can view the SLA Policies page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/sla');
    await expect(page).toHaveURL(/\/admin\/sla/);
    await expect(page.getByRole('heading', { name: /SLA Policies/i })).toBeVisible({ timeout: 10000 });

    // Wait for spinner/skeleton to clear
    await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });

    // Either policies appear or an empty state is shown
    await expect(
      page.locator('text=No SLA policies').or(
        page.locator('text=First Response').or(page.locator('text=Resolution'))
      )
    ).toBeVisible({ timeout: 10000 });
  });
});
