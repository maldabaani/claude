import { test, expect } from '@playwright/test';
import {
  loginAs,
  loginAsAdmin,
  loginAsAgent,
  loginAsCustomer,
  clearAuth,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  AGENT_EMAIL,
  AGENT_PASSWORD,
  CUSTOMER_EMAIL,
  CUSTOMER_PASSWORD,
} from './helpers/auth';

test.describe('Authentication', () => {
  // ── Successful logins ──────────────────────────────────────────────────────

  test('Admin login redirects to /admin', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin/);
  });

  test('Agent login redirects to /agent', async ({ page }) => {
    await loginAsAgent(page);
    await expect(page).toHaveURL(/\/agent/);
  });

  test('Customer login redirects to /customer', async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page).toHaveURL(/\/customer/);
  });

  // ── Login failure ──────────────────────────────────────────────────────────

  test('Wrong password shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // The login component binds `error` to a div with a red alert style.
    // It contains the text "Invalid email or password."
    const errorAlert = page.locator('text=Invalid email or password');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
  });

  // ── Unauthenticated access / guards ───────────────────────────────────────

  test('Unauthenticated access to /admin redirects to /login', async ({ page }) => {
    // Navigate to the app first so we can clear storage, then visit the protected route.
    await page.goto('/');
    await clearAuth(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('Unauthenticated access to /customer redirects to /login', async ({ page }) => {
    await page.goto('/');
    await clearAuth(page);
    await page.goto('/customer');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  // ── Cross-role access ──────────────────────────────────────────────────────

  test('Customer accessing /admin is redirected to /customer', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/admin');
    // roleGuard redirects non-admins away; the customer should end up back in /customer
    await expect(page).toHaveURL(/\/customer/, { timeout: 10000 });
  });

  test('Admin accessing /customer stays in /customer (admin has CUSTOMER role access)', async ({ page }) => {
    // Per app.routes.ts the customer route allows CUSTOMER | AGENT | TEAM_LEAD | ADMIN,
    // so an admin can visit /customer. They should NOT be bounced to /admin.
    await loginAsAdmin(page);
    await page.goto('/customer');
    await expect(page).toHaveURL(/\/customer/, { timeout: 10000 });
  });

  // ── Logout ────────────────────────────────────────────────────────────────

  test('Logout redirects to /login and clears token', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin/);

    // The admin shell exposes a user-menu popup triggered by the bottom user-area button.
    // Click that button to open the PrimeNG menu popup.
    const userAreaButton = page.locator('aside button').filter({ hasText: /Administrator|admin@/ }).first();
    // Fallback: any button inside <aside> that is not the collapse toggle
    await userAreaButton.click();

    // The logout menu item is labelled "Logout" or "Sign out" via sideMenuItems
    const logoutItem = page.getByText(/Logout|Sign out/i).last();
    await logoutItem.click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Verify localStorage token was cleared
    const token = await page.evaluate(() => localStorage.getItem('hd_access_token'));
    expect(token).toBeNull();
  });
});
