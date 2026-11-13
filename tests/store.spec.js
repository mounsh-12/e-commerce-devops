const { test, expect } = require('./coverage-fixtures');

const testUser = {
    name: 'Mounish Test',
    email: 'mounish.test@example.com',
    password: 'TestPassword123!'
};

const products = [
    { name: "Men's White Shirt", price: 799 },
    { name: "Women's Floral Dress", price: 1199 },
    { name: 'Blue Denim Jeans', price: 1499 },
    { name: 'Black Hoodie', price: 999 },
    { name: 'Cotton T-Shirt', price: 499 }
];

async function acceptDialogs(page) {
    page.on('dialog', async dialog => {
        await dialog.accept();
    });
}

async function openSignup(page) {
    const signupButton = page.locator(
        '#loginPage [onclick*="showSignup"]'
    );
    await expect(signupButton).toBeVisible();
    await signupButton.click();
    await expect(page.locator('#signupPage')).toBeVisible();
}

async function loginToStore(page) {
    await page.evaluate(user => {
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

async function addFirstProduct(page) {
    await page.locator('#productList .product').first()
        .getByRole('button', { name: /Add to Cart/i })
        .click();
}

async function fillCheckout(page, method = 'cod') {
    await page.locator('#custName').fill('Mounish Test');
    await page.locator('#custAddress').fill('Tirupati, Andhra Pradesh');
    await page.locator('#paymentMethod').selectOption(method);
}

test.describe('E-Commerce Application E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#loginPage')).toBeVisible();
    });

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
    });

    test('04 - User can navigate from Sign Up back to Login', async ({ page }) => {
        await openSignup(page);
        await page.locator('#signupPage [onclick*="showLogin"]').click();
        await expect(page.locator('#loginPage')).toBeVisible();
        await expect(page.locator('#signupPage')).toBeHidden();
    });

    test('05 - User can create an account', async ({ page }) => {
        await openSignup(page);
        await page.locator('#signupName').fill(testUser.name);
        await page.locator('#signupEmail').fill(testUser.email);
        await page.locator('#signupPassword').fill(testUser.password);
        await acceptDialogs(page);

        await page.locator('#signupPage').getByRole('button', {
            name: 'Create Account',
            exact: true
        }).click();

        await expect(page.locator('#loginPage')).toBeVisible();
        const savedUser = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('user'))
        );
        expect(savedUser).toMatchObject(testUser);
    });

    test('06 - Signup rejects empty fields', async ({ page }) => {
        await openSignup(page);
        await acceptDialogs(page);

        await page.locator('#signupPage').getByRole('button', {
            name: 'Create Account',
            exact: true
        }).click();

        await expect(page.locator('#signupPage')).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem('user'))).toBeNull();
    });

    test('07 - User can log in successfully', async ({ page }) => {
        await loginToStore(page);
        await expect(page.locator('#productList .product')).toHaveCount(5);
    });

    test('08 - Invalid login does not open the store', async ({ page }) => {
        await acceptDialogs(page);
        await page.locator('#loginEmail').fill('wrong@example.com');
        await page.locator('#loginPassword').fill('WrongPassword123!');
        await page.locator('#loginPage').getByRole('button', {
            name: 'Login',
            exact: true
        }).click();

        await expect(page.locator('#loginPage')).toBeVisible();
        await expect(page.locator('#storePage')).toBeHidden();
    });

    test('09 - Login handles corrupted saved account data', async ({ page }) => {
        await page.evaluate(() => localStorage.setItem('user', '{invalid-json'));
        await acceptDialogs(page);
        await page.locator('#loginEmail').fill(testUser.email);
        await page.locator('#loginPassword').fill(testUser.password);
        await page.locator('#loginPage').getByRole('button', {
            name: 'Login',
            exact: true
        }).click();

        await expect(page.locator('#loginPage')).toBeVisible();
        await expect(page.locator('#storePage')).toBeHidden();
    });

    test('10 - All five products are displayed', async ({ page }) => {
        await loginToStore(page);
        await expect(page.locator('#productList .product')).toHaveCount(5);
    });

    test('11 - Product names and prices are displayed', async ({ page }) => {
        await loginToStore(page);
        const cards = page.locator('#productList .product');
        await expect(cards).toHaveCount(products.length);

        for (let index = 0; index < products.length; index++) {
            await expect(cards.nth(index)).toContainText(products[index].name);
            await expect(cards.nth(index)).toContainText(String(products[index].price));
        }
    });

    test('12 - Every product has an Add to Cart button', async ({ page }) => {
        await loginToStore(page);
        await expect(
            page.locator('#productList .product button')
        ).toHaveCount(5);
    });

    test('13 - Product image failure displays fallback text and border', async ({ page }) => {
        await page.route('**/images/**', route => route.abort());
        await loginToStore(page);

        const firstImage = page.locator('#productList .product img').first();
        await expect(firstImage).toHaveAttribute(
            'alt',
            "Men's White Shirt image unavailable"
        );
        await expect(firstImage).toHaveCSS('border-top-style', 'solid');
    });

    test('14 - User can add a product to the cart', async ({ page }) => {
        await loginToStore(page);
        await addFirstProduct(page);
        await expect(page.locator('#cartItems li')).toHaveCount(1);
        await expect(page.locator('#total')).toHaveText('799');
    });

    test('15 - Cart calculates totals for multiple products', async ({ page }) => {
        await loginToStore(page);
        const cards = page.locator('#productList .product');

        await cards.nth(0).getByRole('button', { name: /Add to Cart/i }).click();
        await cards.nth(1).getByRole('button', { name: /Add to Cart/i }).click();

        await expect(page.locator('#cartItems li')).toHaveCount(2);
        await expect(page.locator('#total')).toHaveText('1998');
    });

    test('16 - Invalid product IDs do not change the cart', async ({ page }) => {
        await loginToStore(page);
        await page.evaluate(() => addToCart(999));

        await expect(page.locator('#cartItems li')).toHaveCount(0);
        await expect(page.locator('#total')).toHaveText('0');
    });

    test('17 - Checkout rejects incomplete payment details', async ({ page }) => {
        await loginToStore(page);
        await addFirstProduct(page);
        await acceptDialogs(page);

        await page.getByRole('button', {
            name: /Proceed to Payment/i
        }).click();

        await expect(page.locator('#cartItems li')).toHaveCount(1);
        await expect(page.locator('#total')).toHaveText('799');
    });

    test('18 - Checkout rejects an empty cart when details are complete', async ({ page }) => {
        await loginToStore(page);
        await fillCheckout(page, 'cod');
        await acceptDialogs(page);

        await page.getByRole('button', {
            name: /Proceed to Payment/i
        }).click();

        await expect(page.locator('#cartItems li')).toHaveCount(0);
        await expect(page.locator('#total')).toHaveText('0');
    });

    test('19 - Cash on Delivery checkout completes successfully', async ({ page }) => {
        await loginToStore(page);
        await addFirstProduct(page);
        await fillCheckout(page, 'cod');
        await acceptDialogs(page);

        await page.getByRole('button', {
            name: /Proceed to Payment/i
        }).click();

        await expect(page.locator('#cartItems li')).toHaveCount(0);
        await expect(page.locator('#total')).toHaveText('0');
    });

    for (const payment of [
        { name: 'Google Pay', value: 'gpay', url: 'https://pay.google.com/' },
        { name: 'Paytm', value: 'paytm', url: 'https://paytm.com/' },
        { name: 'PhonePe', value: 'phonepe', url: 'https://www.phonepe.com/' }
    ]) {
        test(`20 - ${payment.name} checkout opens its payment provider`, async ({ page }) => {
            await loginToStore(page);
            await page.evaluate(() => {
                window.__openedPaymentUrls = [];
                window.open = (url, target, features) => {
                    window.__openedPaymentUrls.push({ url, target, features });
                    return null;
                };
            });
            await addFirstProduct(page);
            await fillCheckout(page, payment.value);
            await acceptDialogs(page);

            await page.getByRole('button', {
                name: /Proceed to Payment/i
            }).click();

            const opened = await page.evaluate(() => window.__openedPaymentUrls);
            expect(opened).toHaveLength(1);
            expect(opened[0].url).toBe(payment.url);
            expect(opened[0].target).toBe('_blank');
            expect(opened[0].features).toContain('noopener');

            await expect(page.locator('#cartItems li')).toHaveCount(0);
        });
    }

    test('23 - User can log out successfully', async ({ page }) => {
        await loginToStore(page);
        await acceptDialogs(page);

        await page.getByRole('button', { name: /Logout/i }).click();

        await expect(page.locator('#loginPage')).toBeVisible();
        await expect(page.locator('#storePage')).toBeHidden();
    });
});
