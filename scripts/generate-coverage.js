
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'script.js');
const rawDir = path.join(root, 'coverage/raw');
const outputPath = path.join(root, 'coverage/lcov.info');

function fail(message) {
    console.error(`Coverage error: ${message}`);
    process.exit(1);
}

if (!fs.existsSync(sourcePath)) {
    fail('script.js was not found');
}

if (!fs.existsSync(rawDir)) {
    fail('coverage/raw does not exist');
}

const files = fs.readdirSync(rawDir)
    .filter(file => file.endsWith('.json'));

if (files.length === 0) {
    fail('No browser coverage files were generated');
}

const source = fs.readFileSync(sourcePath, 'utf8');
const lines = source.split('\n');

const lineStarts = [];
let offset = 0;

for (const line of lines) {
    lineStarts.push(offset);
    offset += line.length + 1;
}

const hits = new Map();
let scriptsCollected = 0;

for (const file of files) {
    const filePath = path.join(rawDir, file);
    const scripts = JSON.parse(
        fs.readFileSync(filePath, 'utf8')
    );

    for (const script of scripts) {
        scriptsCollected++;

        const ranges = [];

        for (const fn of script.functions || []) {
            for (const range of fn.ranges || []) {
                if (range.endOffset > range.startOffset) {
                    ranges.push(range);
                }
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const start = lineStarts[i];
            const end = start + lines[i].length;

            if (!lines[i].trim()) {
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

            const sorted = [...boundaries].sort(
                (a, b) => a - b
            );

            let lineHit = 0;

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

                if (matching.length > 0) {
                    lineHit = Math.max(
                        lineHit,
                        matching[0].count
                    );
                }
            }

            const lineNumber = i + 1;

            hits.set(
                lineNumber,
                Math.max(
                    hits.get(lineNumber) || 0,
                    lineHit
                )
            );
        }
    }
}

if (scriptsCollected === 0) {
    fail('Chromium did not capture script.js');
}

const coveredLines = [...hits.values()]
    .filter(count => count > 0).length;

const lcov = [
    'TN:',
    'SF:script.js'
];

for (const [line, count] of [...hits.entries()]
    .sort((a, b) => a[0] - b[0])) {
    lcov.push(`DA:${line},${count}`);
}

lcov.push(`LF:${hits.size}`);
lcov.push(`LH:${coveredLines}`);
lcov.push('end_of_record');

fs.mkdirSync(path.dirname(outputPath), {
    recursive: true
});

fs.writeFileSync(
    outputPath,
    lcov.join('\n') + '\n',
    'utf8'
);

console.log('LCOV report generated successfully');
console.log(`Coverage files: ${files.length}`);
console.log(`Scripts captured: ${scriptsCollected}`);
console.log(`Lines covered: ${coveredLines}/${hits.size}`);
console.log(`Report: ${outputPath}`);
