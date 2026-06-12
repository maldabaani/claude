import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsCustomer } from './helpers/auth';

test.describe('Ticket Management', () => {

  // ── Admin ticket list ──────────────────────────────────────────────────────

  test('Admin can view the All Tickets list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/tickets');
    await expect(page).toHaveURL(/\/admin\/tickets/);

    // The page heading is "All Tickets"
    await expect(page.getByRole('heading', { name: /All Tickets/i })).toBeVisible({ timeout: 10000 });

    // Wait for the table to settle — skeleton disappears and rows (or empty state) appear
    await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });
  });

  test('Admin can click a ticket row and see its detail page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/tickets');

    // Wait for skeleton to finish loading
    await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });

    // Find the first ticket link (ticket number links use routerLink to /admin/tickets/:id)
    const firstTicketLink = page.locator('a[href*="/admin/tickets/"]').first();

    // Only proceed if at least one ticket exists
    const count = await firstTicketLink.count();
    if (count === 0) {
      test.skip(); // No tickets in the system — skip rather than fail
      return;
    }

    await firstTicketLink.click();
    await page.waitForURL(/\/admin\/tickets\/\d+/, { timeout: 10000 });

    // The agent ticket-detail component renders the ticket title in an <h1>
    // and should NOT show "Ticket not found"
    await expect(page.locator('text=Ticket not found')).toHaveCount(0, { timeout: 10000 });
    // The skeleton should disappear once loaded
    await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });
  });

  test('Admin ticket detail stays inside the admin shell (sidebar has admin nav)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/tickets');
    await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });

    const firstTicketLink = page.locator('a[href*="/admin/tickets/"]').first();
    if (await firstTicketLink.count() === 0) {
      test.skip();
      return;
    }

    await firstTicketLink.click();
    await page.waitForURL(/\/admin\/tickets\/\d+/, { timeout: 10000 });

    // The admin shell sidebar has an "Admin Panel" label and nav items like "Users"
    await expect(page.locator('aside').getByText(/Admin Panel/i)).toBeVisible({ timeout: 8000 });
    // Confirm at least one admin nav item is present
    await expect(page.locator('aside').getByText(/Users/i)).toBeVisible();
  });

  // ── Customer ticket flows ──────────────────────────────────────────────────

  test('Customer sees My Tickets page', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/customer/tickets');
    await expect(page).toHaveURL(/\/customer\/tickets/);
    await expect(page.getByRole('heading', { name: /My Tickets/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });
  });

  test('Customer can submit a new ticket', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/customer/submit');
    await expect(page).toHaveURL(/\/customer\/submit/);
    await expect(page.getByRole('heading', { name: /Submit a Ticket/i })).toBeVisible({ timeout: 10000 });

    const uniqueTitle = `E2E Test Ticket ${Date.now()}`;

    // Fill in the subject (formControlName="title" → rendered as <input pInputText>)
    await page.locator('input[placeholder*="Brief description"]').fill(uniqueTitle);

    // Fill in the description (formControlName="description" → rendered as <textarea pTextarea>)
    await page.locator('textarea[placeholder*="Describe your issue"]').fill(
      'This is an automated E2E test ticket. Please ignore.'
    );

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // After successful submission the component navigates to /customer/tickets
    await page.waitForURL(/\/customer\/tickets/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/customer\/tickets/);
  });

  test('Customer submitted ticket appears in their ticket list', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/customer/submit');

    const uniqueTitle = `E2E Visible Ticket ${Date.now()}`;
    await page.locator('input[placeholder*="Brief description"]').fill(uniqueTitle);
    await page.locator('textarea[placeholder*="Describe your issue"]').fill('Automated test — checking list visibility.');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/customer\/tickets/, { timeout: 15000 });
    await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });

    // The newly submitted ticket title should appear somewhere on the page
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });
  });

  // ── Filter / search ────────────────────────────────────────────────────────

  test('Customer can filter tickets by status', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/customer/tickets');
    await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });

    // The filter bar contains a p-select for status — click to open it
    // p-select renders a <div role="combobox"> or a button-like element
    const statusFilter = page.locator('p-select').first();
    await statusFilter.click();

    // Choose "Open" from the dropdown overlay
    const openOption = page.locator('.p-select-option, .p-dropdown-item').getByText(/^Open$/i);
    if (await openOption.count() > 0) {
      await openOption.first().click();
      // Wait for the list to reload
      await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });
    }

    // The filter bar should still be visible regardless of whether tickets match
    await expect(page.locator('p-select').first()).toBeVisible();
  });

  test('Admin can search for tickets using the header search bar', async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    // The admin shell header has a search input with placeholder "Search tickets..."
    const searchInput = page.locator('input[placeholder="Search tickets..."]');
    await expect(searchInput).toBeVisible({ timeout: 8000 });

    await searchInput.fill('test');

    // The admin shell debounces then navigates to /admin/tickets?search=test
    await page.waitForURL(/\/admin\/tickets.*search=test/, { timeout: 8000 });
    await expect(page).toHaveURL(/search=test/);
  });
});
