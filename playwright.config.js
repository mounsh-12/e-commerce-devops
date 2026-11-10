
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',

    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 1,

    reporter: [
        ['list'],
        ['html', {
            outputFolder: 'playwright-report',
            open: 'never'
        }],
        ['junit', {
            outputFile: 'test-results/e2e-results.xml'
        }]
    ],

    use: {
        baseURL: 'http://127.0.0.1:4173',
        browserName: 'chromium',
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure'
    },

    webServer: {
        command: 'npm start',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 30000
    }
});
