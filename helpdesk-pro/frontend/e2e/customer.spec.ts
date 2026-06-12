import { test, expect } from '@playwright/test';
import { loginAsCustomer } from './helpers/auth';

test.describe('Customer Portal', () => {

  // ── Home / Portal ──────────────────────────────────────────────────────────

  test('Customer home screen loads with welcome hero', async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page).toHaveURL(/\/customer/);

    // The portal hero contains "Customer Portal" label and a greeting
    await expect(page.locator('text=Customer Portal')).toBeVisible({ timeout: 10000 });

    // The welcome h1 contains "Hello,"
    await expect(page.locator('h1').filter({ hasText: /Hello,/i })).toBeVisible({ timeout: 10000 });

    // The "Submit New Ticket" CTA should be present
    await expect(page.getByRole('link', { name: /Submit New Ticket/i })).toBeVisible();
  });

  test('Customer home shows recent-tickets section', async ({ page }) => {
    await loginAsCustomer(page);

    // Skeleton loaders clear once data is fetched
    await expect(page.locator('app-skeleton-loader')).toHaveCount(0, { timeout: 15000 });

    // Either "Recent Tickets" heading or "No tickets yet" empty state appears
    await expect(
      page.locator('text=Recent Tickets').or(page.locator('text=No tickets yet'))
    ).toBeVisible({ timeout: 10000 });
  });

  // ── Knowledge Base ────────────────────────────────────────────────────────

  test('Customer can navigate to Knowledge Base', async ({ page }) => {
    await loginAsCustomer(page);

    // Click the KB nav item in the sidebar
    await page.locator('aside').getByRole('link', { name: /Knowledge Base/i }).click();
    await expect(page).toHaveURL(/\/customer\/kb/);

    // The KB hero heading says "How can we help?"
    await expect(page.getByRole('heading', { name: /How can we help/i })).toBeVisible({ timeout: 10000 });

    // The search input is present
    await expect(page.locator('input[placeholder*="Search articles"]')).toBeVisible();
  });

  // ── Notifications ────────────────────────────────────────────────────────

  test.skip('Customer can navigate to Notifications', () => {
    // The customer shell navItems array (customer-shell.component.ts) does not
    // include a dedicated Notifications route. Notification preferences are
    // accessible via the profile page (NotificationPreferenceService), not a
    // standalone /customer/notifications route.
    // Skip until a Notifications nav item / route is added.
  });

  // ── Profile ───────────────────────────────────────────────────────────────

  test('Customer profile page loads', async ({ page }) => {
    await loginAsCustomer(page);

    // The customer shell sidebar has a "My Profile" nav item pointing to /profile
    await page.locator('aside').getByRole('link', { name: /My Profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);

    // The profile page heading is "My Profile"
    await expect(page.getByRole('heading', { name: /My Profile/i })).toBeVisible({ timeout: 10000 });

    // The user's email should appear on the page
    await expect(page.locator('text=customer@helpdesk.com')).toBeVisible({ timeout: 10000 });
  });

  test('Customer profile shows account settings sections', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /My Profile/i })).toBeVisible({ timeout: 10000 });

    // Avatar initials block is visible
    await expect(page.locator('.rounded-full').filter({ hasText: /[A-Z]/ }).first()).toBeVisible();
  });

  // ── My Tickets navigation ──────────────────────────────────────────────────

  test('Customer can navigate to My Tickets via sidebar', async ({ page }) => {
    await loginAsCustomer(page);

    await page.locator('aside').getByRole('link', { name: /My Tickets/i }).click();
    await expect(page).toHaveURL(/\/customer\/tickets/);
    await expect(page.getByRole('heading', { name: /My Tickets/i })).toBeVisible({ timeout: 10000 });
  });
});
