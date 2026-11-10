
const base = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const rawCoverageDir = path.resolve(
    process.cwd(),
    'coverage/raw'
);

const test = base.test.extend({
    page: async ({ context }, use, testInfo) => {
        const page = await context.newPage();
        const client = await context.newCDPSession(page);

        await client.send('Profiler.enable');
        await client.send('Profiler.startPreciseCoverage', {
            callCount: true,
            detailed: true
        });

        try {
            await use(page);
        } finally {
            try {
                const result = await client.send(
                    'Profiler.takePreciseCoverage'
                );

                const scripts = (result.result || []).filter(
                    script => {
                        try {
                            const url = new URL(script.url);
                            return url.pathname === '/script.js';
                        } catch {
                            return false;
                        }
                    }
                );

                fs.mkdirSync(rawCoverageDir, {
                    recursive: true
                });

                const id = crypto
                    .createHash('sha256')
                    .update(
                        `${testInfo.testId}-${testInfo.retry}`
                    )
                    .digest('hex');

                const outputPath = path.join(
                    rawCoverageDir,
                    `${id}.json`
                );

                fs.writeFileSync(
                    outputPath,
                    JSON.stringify(scripts),
                    'utf8'
                );

                console.log(
                    `Coverage captured: ${scripts.length} script(s)`
                );
            } finally {
                try {
                    await client.send(
                        'Profiler.stopPreciseCoverage'
                    );
                } finally {
                    await client.detach();
                    await page.close();
                }
            }
        }
    }
});

module.exports = {
    test,
    expect: base.expect
};
