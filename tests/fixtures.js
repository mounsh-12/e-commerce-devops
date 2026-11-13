
const { test: base, expect } = require('@playwright/test');
const { addCoverageReport } = require('monocart-reporter');

const test = base.extend({
  autoCoverage: [
    async ({ page }, use) => {
      await page.coverage.startJSCoverage({
        resetOnNavigation: false
      });

      await use();

      const coverage = await page.coverage.stopJSCoverage();

      await addCoverageReport(sticoverage, test.info());
    },
    {
      scope: 'test',
      auto: true
    }
  ]
});

module.exports = {
  test,
  expect
};
