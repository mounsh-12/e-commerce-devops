
const base = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.resolve(__dirname, '../script.js');
const coveragePath = path.resolve(
    process.cwd(),
    'coverage/lcov.info'
);

const source = fs.readFileSync(sourcePath, 'utf8');

const lineStarts = [0];

for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') {
        lineStarts.push(i + 1);
    }
}

const lineHits = new Map();
let collectedScripts = 0;

function collectCoverage(scriptCoverage) {
    const ranges = [];

    for (const fn of scriptCoverage.functions || []) {
        for (const range of fn.ranges || []) {
            if (range.endOffset > range.startOffset) {
                ranges.push(range);
            }
        }
    }

    for (let i = 0; i < lineStarts.length; i++) {
        const start = lineStarts[i];

        const end = i + 1 < lineStarts.length
            ? lineStarts[i + 1]
            : source.length;

        if (end <= start) {
            continue;
        }

        const boundaries = new Set([start, end]);

        for (const range of ranges) {
            if (
                range.startOffset > start &&
                range.startOffset < end
            ) {
                boundaries.add(range.startOffset);
            }

            if (
                range.endOffset > start &&
                range.endOffset < end
            ) {
                boundaries.add(range.endOffset);
            }
        }

        const sorted = [...boundaries].sort((a, b) => a - b);

        let hits = 0;

        for (let j = 0; j < sorted.length - 1; j++) {
            const midpoint = (
                sorted[j] + sorted[j + 1]
            ) / 2;

            const matching = ranges
                .filter(range =>
                    range.startOffset <= midpoint &&
                    range.endOffset > midpoint
                )
                .sort((a, b) =>
                    (a.endOffset - a.startOffset) -
                    (b.endOffset - b.startOffset)
                );

            if (
                matching.length > 0 &&
                matching[0].count > 0
            ) {
                hits = Math.max(
                    hits,
                    matching[0].count
                );
            }
        }

        lineHits.set(
            i + 1,
            Math.max(lineHits.get(i + 1) || 0, hits)
        );
    }
}

const test = base.test.extend({
    page: async ({ context }, use) => {
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

                for (const script of result.result || []) {
                    let pathname;

                    try {
                        pathname = new URL(script.url).pathname;
                    } catch {
                        continue;
                    }

                    if (
                        pathname === '/script.js' ||
                        pathname.endsWith('/script.js')
                    ) {
                        collectCoverage(script);
                        collectedScripts++;
                    }
                }

                await client.send(
                    'Profiler.stopPreciseCoverage'
                );
            } finally {
                await client.detach();
                await page.close();
            }
        }
    }
});

// IMPORTANT: Register afterAll on the extended test object.
test.afterAll(async () => {
    console.log('Generating LCOV coverage report');

    console.log(
        `JavaScript coverage scripts collected: ${collectedScripts}`
    );

    if (collectedScripts === 0 || lineHits.size === 0) {
        throw new Error(
            'Coverage collection failed. No script.js coverage was captured.'
        );
    }

    fs.mkdirSync(path.dirname(coveragePath), {
        recursive: true
    });

    const lcovLines = [
        'TN:',
        `SF:${path.relative(process.cwd(), sourcePath)
            .split(path.sep)
            .join('/')}`
    ];

    for (const [line, hits] of [...lineHits.entries()]
        .sort((a, b) => a[0] - b[0])) {
        lcovLines.push(`DA:${line},${hits}`);
    }

    lcovLines.push('end_of_record');

    fs.writeFileSync(
        coveragePath,
        lcovLines.join('\n') + '\n',
        'utf8'
    );

    if (!fs.existsSync(coveragePath)) {
        throw new Error('LCOV report was not created.');
    }

    if (fs.statSync(coveragePath).size === 0) {
        throw new Error('LCOV report is empty.');
    }

    console.log(
        `Coverage report successfully generated: ${coveragePath}`
    );

    console.log(
        `Coverage lines recorded: ${lineHits.size}`
    );
});

module.exports = {
    test,
    expect: base.expect
};
