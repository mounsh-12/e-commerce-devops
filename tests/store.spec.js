
const { test, expect } = require('@playwright/test');

test.describe('E-commerce Store - Browser Tests', () => {

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(
      'Clothing Store | Simple E-Commerce Project'
    );

    await expect(
      page.getByRole('heading', {
        name: /simple e-commerce clothing store/i
      })
    ).toBeVisible();
  });

  test('Login page is visible by default', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#signupPage')).toBeHidden();
  });

  test('User can navigate from Login to Sign Up', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /sign up/i }).click();

    await expect(page.locator('#signupPage')).toBeVisible();
    await expect(page.locator('#loginPage')).toBeHidden();
  });

  test('User can navigate from Sign Up back to Login', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /sign up/i }).click();

    await page.getByRole('link', { name: /login/i }).click();

    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#signupPage')).toBeHidden();
  });

});
