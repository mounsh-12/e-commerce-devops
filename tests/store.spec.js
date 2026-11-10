const { test, expect } = require('./coverage-fixtures');
const testUser = {
  name: 'Mounish Test',
  email: 'mounish.test@example.com',
  password: 'TestPassword123!'
};

test.describe('E-Commerce Application E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#loginPage')).toBeVisible();
  });

  // Navigate to signup using the actual HTML onclick attribute.
  async function openSignup(page) {
    const signupLink = page.locator(
      '#loginPage [onclick*="showSignup"]'
    );

    await expect(signupLink).toBeVisible();
    await signupLink.click();

    await expect(page.locator('#signupPage')).toBeVisible();
  }

  // Create a test user in localStorage and log in.
  async function loginToStore(page) {
    await page.evaluate((user) => {
      localStorage.setItem('user', JSON.stringify(user));
    }, testUser);

    await page.locator('#loginEmail').fill(testUser.email);
    await page.locator('#loginPassword').fill(testUser.password);

    await page.locator('#loginPage').getByRole('button', {
      name: 'Login',
      exact: true
    }).click();

    await expect(page.locator('#storePage')).toBeVisible();
  }

  test('01 - Homepage loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/E-Commerce/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('02 - Login page is displayed by default', async ({ page }) => {
    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#signupPage')).toBeHidden();
    await expect(page.locator('#storePage')).toBeHidden();
  });

  test('03 - User can navigate from Login to Sign Up', async ({ page }) => {
    await openSignup(page);

    await expect(page.locator('#loginPage')).toBeHidden();
    await expect(page.locator('#signupPage')).toBeVisible();
  });

  test('04 - User can navigate from Sign Up back to Login', async ({ page }) => {
    await openSignup(page);

    const loginLink = page.locator(
      '#signupPage [onclick*="showLogin"]'
    );

    await expect(loginLink).toBeVisible();
    await loginLink.click();

    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#signupPage')).toBeHidden();
  });

  test('05 - User can create an account', async ({ page }) => {
    await openSignup(page);

    await page.locator('#signupName').fill(testUser.name);
    await page.locator('#signupEmail').fill(testUser.email);
    await page.locator('#signupPassword').fill(testUser.password);

    await page.locator('#signupPage').getByRole('button', {
      name: 'Create Account',
      exact: true
    }).click();

    await expect(page.locator('#loginPage')).toBeVisible();

    const savedUser = await page.evaluate(() => {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    });

    expect(savedUser).not.toBeNull();
    expect(savedUser.name).toBe(testUser.name);
    expect(savedUser.email).toBe(testUser.email);
    expect(savedUser.password).toBe(testUser.password);
  });

  test('06 - User can log in successfully', async ({ page }) => {
    await loginToStore(page);

    await expect(page.locator('#storePage')).toBeVisible();
  });

  test('07 - Invalid login does not open the store', async ({ page }) => {
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.locator('#loginEmail').fill('wrong@example.com');
    await page.locator('#loginPassword').fill('WrongPassword123!');

    await page.locator('#loginPage').getByRole('button', {
      name: 'Login',
      exact: true
    }).click();

    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#storePage')).toBeHidden();
  });

  test('08 - All five products are displayed', async ({ page }) => {
    await loginToStore(page);

    await expect(
      page.locator('#productList .product')
    ).toHaveCount(5);
  });

  test('09 - Product names and prices are displayed', async ({ page }) => {
    await loginToStore(page);

    const products = page.locator('#productList .product');

    const expectedProducts = [
      { name: "Men's White Shirt", price: '799' },
      { name: "Women's Floral Dress", price: '1199' },
      { name: 'Blue Denim Jeans', price: '1499' },
      { name: 'Black Hoodie', price: '999' },
      { name: 'Cotton T-Shirt', price: '499' }
    ];

    await expect(products).toHaveCount(expectedProducts.length);

    for (let i = 0; i < expectedProducts.length; i++) {
      const product = products.nth(i);

      await expect(product).toContainText(expectedProducts[i].name);
      await expect(product).toContainText(expectedProducts[i].price);
    }
  });

  test('10 - Every product has an Add to Cart button', async ({ page }) => {
    await loginToStore(page);

    const buttons = page.locator(
      '#productList .product button'
    );

    await expect(buttons).toHaveCount(5);

    for (let i = 0; i < 5; i++) {
      await expect(buttons.nth(i)).toContainText(/Add to Cart/i);
    }
  });

  test('11 - User can add a product to the cart', async ({ page }) => {
    await loginToStore(page);

    await page.locator('#productList .product').first()
      .getByRole('button', { name: /Add to Cart/i })
      .click();

    await expect(page.locator('#cartItems li')).toHaveCount(1);
  });

  test('12 - Cart calculates the total correctly', async ({ page }) => {
    await loginToStore(page);

    const products = page.locator('#productList .product');

    await products.nth(0)
      .getByRole('button', { name: /Add to Cart/i })
      .click();

    await products.nth(1)
      .getByRole('button', { name: /Add to Cart/i })
      .click();

    await expect(page.locator('#total')).toContainText('1998');
  });

  test('13 - Checkout rejects incomplete payment details', async ({ page }) => {
    await loginToStore(page);

    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.getByRole('button', {
      name: /Proceed to Payment/i
    }).click();

    await expect(page.locator('#storePage')).toBeVisible();
  });

  test('14 - Cash on Delivery checkout completes successfully', async ({ page }) => {
    await loginToStore(page);

    await page.locator('#productList .product').first()
      .getByRole('button', { name: /Add to Cart/i })
      .click();

    await page.locator('#custName').fill('Mounish Test');
    await page.locator('#custAddress').fill('Tirupati, Andhra Pradesh');

    await page.locator('#paymentMethod').selectOption({
      label: 'Cash on Delivery'
    });

    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.getByRole('button', {
      name: /Proceed to Payment/i
    }).click();

    await expect(page.locator('#cartItems li')).toHaveCount(0);
  });

  test('15 - User can log out successfully', async ({ page }) => {
    await loginToStore(page);

    await page.getByRole('button', {
      name: /Logout/i
    }).click();

    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#storePage')).toBeHidden();
  });

});
