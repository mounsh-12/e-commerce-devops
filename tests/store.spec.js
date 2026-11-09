
const { test, expect } = require('@playwright/test');

const testUser = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'Test@12345'
};

test.describe('E-Commerce Application E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.goto('/');
    await expect(page.locator('#loginPage')).toBeVisible();
  });

  async function loginToStore(page) {
    await page.evaluate((user) => {
      localStorage.setItem('user', JSON.stringify(user));
    }, testUser);

    await page.reload();

    await page.locator('#loginEmail').fill(testUser.email);
    await page.locator('#loginPassword').fill(testUser.password);

    await page.locator('#loginPage button')
      .filter({ hasText: /^Login$/ })
      .click();

    await expect(page.locator('#storePage')).toBeVisible();
  }

  test('01 - Homepage loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Clothing Store/i);
    await expect(page.locator('header')).toBeVisible();
  });

  test('02 - Login page is displayed by default', async ({ page }) => {
    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#signupPage')).toBeHidden();
    await expect(page.locator('#storePage')).toBeHidden();
  });

  test('03 - User can navigate from Login to Sign Up', async ({ page }) => {
    const signupButton = page.locator(
      '#loginPage button[onclick="showSignup()"]'
    );

    await expect(signupButton).toBeVisible();
    await signupButton.click();

    await expect(page.locator('#signupPage')).toBeVisible();
    await expect(page.locator('#loginPage')).toBeHidden();
  });

  test('04 - User can navigate from Sign Up back to Login', async ({ page }) => {
    await page.locator(
      '#loginPage button[onclick="showSignup()"]'
    ).click();

    await expect(page.locator('#signupPage')).toBeVisible();

    const loginButton = page.locator(
      '#signupPage button[onclick="showLogin()"]'
    );

    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#signupPage')).toBeHidden();
  });

  test('05 - User can create an account', async ({ page }) => {
    await page.locator(
      '#loginPage button[onclick="showSignup()"]'
    ).click();

    await page.locator('#signupName').fill(testUser.name);
    await page.locator('#signupEmail').fill(testUser.email);
    await page.locator('#signupPassword').fill(testUser.password);

    await page.locator('#signupPage button')
      .filter({ hasText: 'Create Account' })
      .click();

    const savedUser = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('user'))
    );

    expect(savedUser.email).toBe(testUser.email);
    await expect(page.locator('#loginPage')).toBeVisible();
  });

  test('06 - User can log in successfully', async ({ page }) => {
    await loginToStore(page);
    await expect(page.locator('#storePage')).toBeVisible();
  });

  test('07 - Invalid login does not open the store', async ({ page }) => {
    await page.locator('#loginEmail').fill('wrong@example.com');
    await page.locator('#loginPassword').fill('WrongPassword');

    await page.locator('#loginPage button')
      .filter({ hasText: /^Login$/ })
      .click();

    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#storePage')).toBeHidden();
  });

  test('08 - All five products are displayed', async ({ page }) => {
    await loginToStore(page);
    await expect(page.locator('#productList .product')).toHaveCount(5);
  });

  test('09 - Product names and prices are displayed', async ({ page }) => {
    await loginToStore(page);

    const expectedProducts = [
      "Men's White Shirt",
      "Women's Floral Dress",
      'Blue Denim Jeans',
      'Black Hoodie',
      'Cotton T-Shirt'
    ];

    for (const product of expectedProducts) {
      await expect(
        page.locator('#productList').getByText(product)
      ).toBeVisible();
    }

    for (const price of ['₹799', '₹1199', '₹1499', '₹999', '₹499']) {
      await expect(page.locator('#productList')).toContainText(price);
    }
  });

  test('10 - Every product has an Add to Cart button', async ({ page }) => {
    await loginToStore(page);

    await expect(
      page.locator('#productList .product button')
    ).toHaveCount(5);
  });

  test('11 - User can add a product to the cart', async ({ page }) => {
    await loginToStore(page);

    await page.locator('#productList .product')
      .filter({ hasText: "Men's White Shirt" })
      .getByRole('button', { name: 'Add to Cart' })
      .click();

    await expect(page.locator('#cartItems li')).toHaveCount(1);
    await expect(page.locator('#cartItems')).toContainText("Men's White Shirt");
    await expect(page.locator('#total')).toHaveText('799');
  });

  test('12 - Cart calculates the total correctly', async ({ page }) => {
    await loginToStore(page);

    const productsToAdd = [
      "Men's White Shirt",
      "Women's Floral Dress"
    ];

    for (const product of productsToAdd) {
      await page.locator('#productList .product')
        .filter({ hasText: product })
        .getByRole('button', { name: 'Add to Cart' })
        .click();
    }

    await expect(page.locator('#cartItems li')).toHaveCount(2);
    await expect(page.locator('#total')).toHaveText('1998');
  });

  test('13 - Checkout rejects incomplete payment details', async ({ page }) => {
    await loginToStore(page);

    await page.getByRole('button', {
      name: 'Proceed to Payment'
    }).click();

    await expect(page.locator('#storePage')).toBeVisible();
    await expect(page.locator('#total')).toHaveText('0');
  });

  test('14 - Cash on Delivery checkout completes successfully', async ({ page }) => {
    await loginToStore(page);

    await page.locator('#productList .product')
      .filter({ hasText: "Men's White Shirt" })
      .getByRole('button', { name: 'Add to Cart' })
      .click();

    await page.locator('#custName').fill(testUser.name);
    await page.locator('#custAddress').fill('Tirupati, Andhra Pradesh');
    await page.locator('#paymentMethod').selectOption('cod');

    await page.getByRole('button', {
      name: 'Proceed to Payment'
    }).click();

    await expect(page.locator('#cartItems li')).toHaveCount(0);
    await expect(page.locator('#total')).toHaveText('0');
  });

  test('15 - User can log out successfully', async ({ page }) => {
    await loginToStore(page);

    await page.getByRole('button', { name: 'Logout' }).click();

    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#storePage')).toBeHidden();
  });

});
