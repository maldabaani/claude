import { Page } from '@playwright/test';

export const ADMIN_EMAIL = 'admin@helpdesk.com';
export const ADMIN_PASSWORD = 'Admin@123';
export const AGENT_EMAIL = 'agent@helpdesk.com';
export const AGENT_PASSWORD = 'Agent@123';
export const CUSTOMER_EMAIL = 'customer@helpdesk.com';
export const CUSTOMER_PASSWORD = 'Customer@123';

/**
 * Log in as the given user. Waits for the post-login URL to match
 * one of the known shell routes before returning.
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');

  // The login form uses pInputText with formControlName bindings.
  // The underlying <input> elements have type="email" and type="password".
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);

  // The submit button is a <button pButton type="submit">
  await page.locator('button[type="submit"]').click();

  // Wait until the router has navigated into the authenticated shell
  await page.waitForURL(/\/(admin|agent|customer)/, { timeout: 15000 });
}

export async function loginAsAdmin(page: Page) {
  return loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
}

export async function loginAsAgent(page: Page) {
  return loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
}

export async function loginAsCustomer(page: Page) {
  return loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
}

/**
 * Clear all auth keys that AuthService writes to localStorage.
 * Call this after navigating to the app so the page context is available.
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('hd_access_token');
    localStorage.removeItem('hd_refresh_token');
    localStorage.removeItem('hd_user');
  });
}
