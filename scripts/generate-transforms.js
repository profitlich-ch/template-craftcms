import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const MIN_VIEWPORT = 375; // Kleinste CSS-Viewport-Breite eines aktuellen Highres-Phones (iPhone SE)
const MIN_DPR = 2;        // Minimaler DPR für Highres-Phones
const MAX_VIEWPORT = 4000;
const FILL_INTERVAL = 300;

function findTwigFiles(dir) {
    const results = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            results.push(...findTwigFiles(full));
        } else if (extname(entry) === '.twig') {
            results.push(full);
        }
    }
    return results;
}

function toDisplayName(camelCase) {
    return camelCase
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, c => c.toUpperCase())
        .trim();
}

// Match macros.picture(image, 'transformName', 'sizes', ...) calls
const blockRegex = /macros\.picture\s*\(\s*[^,]+,\s*'([a-zA-Z][a-zA-Z0-9]*)'\s*,\s*'([^']*)'/g;

const transforms = {};

for (const file of findTwigFiles(join(root, 'src/modules'))) {
    const content = readFileSync(file, 'utf-8');
    let match;
    while ((match = blockRegex.exec(content)) !== null) {
        const name = match[1];
        const sizesStr = match[2];

        const vwValues = [...sizesStr.matchAll(/(\d+)vw/g)].map(m => parseInt(m[1]));
        if (vwValues.length === 0) continue;

        const smartphoneVw = vwValues[0];
        const desktopVw = vwValues[vwValues.length - 1];
        const minWidth = Math.round(smartphoneVw / 100 * MIN_VIEWPORT * MIN_DPR);
        const maxWidth = Math.round(desktopVw / 100 * MAX_VIEWPORT);

        if (!transforms[name]) {
            transforms[name] = { minWidth, maxWidth };
        } else {
            transforms[name].minWidth = Math.min(transforms[name].minWidth, minWidth);
            transforms[name].maxWidth = Math.max(transforms[name].maxWidth, maxWidth);
        }
    }
}

const entries = Object.entries(transforms)
    .map(([name, { minWidth, maxWidth }]) => {
        const displayName = toDisplayName(name);
        return `    '${name}' => [
        'displayName' => '${displayName}',
        'transforms' => [
            ['width' => ${minWidth}],
            ['width' => ${maxWidth}],
        ],
        'defaults' => [
            'format' => 'webp',
        ],
        'configOverrides' => [
            'fillTransforms' => true,
            'fillInterval' => ${FILL_INTERVAL},
        ]
    ]`;
    })
    .join(',\n');

const php = `<?php\n\nreturn [\n${entries},\n];\n`;

writeFileSync(join(root, 'config/imager-x-transforms.php'), php, 'utf-8');
console.log(`✓ ${Object.keys(transforms).length} transforms generiert: ${Object.keys(transforms).join(', ')}`);
