import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladeProjectConfig } from './lib/projectConfig.js';
import { liesBildaufrufe, liesDirektaufrufe, liesRenderkanten, transformBreiten } from './lib/bildaufrufe.js';
import { pruefeBildquellen } from './lib/pruefung.js';
import { markdownBericht, renderbaum, speicherbaum } from './lib/bericht.js';
import { SEOMATE_TRANSFORMS } from './lib/seomate.js';

/**
 * Erzeugt aus den Bildquellen-Deklarationen in src/ drei Dateien:
 * config/imager-x-transforms.php (Breiten je Transform),
 * config/imager-x-generate.php (Vorgenerieren beim Speichern)
 * und docs/bildquellen.md (Speicher- und Renderbaum).
 *
 * Bei Fehlern in den Deklarationen wird nichts geschrieben.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const FILL_INTERVAL = 300;

function toDisplayName(camelCase) {
    return camelCase
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, c => c.toUpperCase())
        .trim();
}

// Die seomate*-Transforms übernehmen die Masse aus config/seomate.php zur
// Laufzeit. Ohne defaults und configOverrides, weil beides in Imagers
// Dateinamen eingeht und die Vorgenerierung sonst SEOMates Datei verfehlt.
function phpTransforms(breiten, seomateHandles) {
    const entries = [...breiten.entries()]
        .map(([name, { minWidth, maxWidth }]) => `    '${name}' => [
        'displayName' => '${toDisplayName(name)}',
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
    ]`);

    if (seomateHandles.length === 0) {
        return `<?php\n\nreturn [\n${entries.join(',\n')},\n];\n`;
    }

    const seoEntries = seomateHandles.map(handle => `    '${handle}' => [
        'displayName' => 'SEOMate ${SEOMATE_TRANSFORMS[handle]}',
        'transforms' => [$seoMap['${SEOMATE_TRANSFORMS[handle]}']],
    ]`);

    return `<?php

// Die seomate*-Einträge am Ende lesen ihre Masse aus config/seomate.php,
// damit Vorgenerierung und SEOMate dieselbe Datei erzeugen.
$seomate = require __DIR__ . '/seomate.php';
$seoMap = $seomate['imageTransformMap'] ?? throw new \\RuntimeException('config/seomate.php ohne imageTransformMap — die seomate*-Transforms brauchen sie.');

return [
${[...entries, ...seoEntries].join(',\n')},
];
`;
}

// Eine Regel je Entry-Type, Herkunftsrelation und Transform-Menge. Felder
// desselben Entry-Types mit derselben Menge teilen sich eine Regel; nur nach
// Entry-Type zu gruppieren würde jedem Feld alle Transforms des Typs geben.
function gruppiereRegeln(aufrufe) {
    const nachQuelle = new Map();
    for (const { transform, quellen } of aufrufe) {
        for (const { entryType, feld, via } of quellen) {
            const viaKey = via ? `${via.entryType}.${via.feld}` : '';
            const schluessel = `${entryType}.${feld}|${viaKey}`;
            if (!nachQuelle.has(schluessel)) nachQuelle.set(schluessel, { entryType, feld, via, viaKey, transforms: new Set() });
            nachQuelle.get(schluessel).transforms.add(transform);
        }
    }

    const regeln = new Map();
    for (const { entryType, feld, via, viaKey, transforms } of nachQuelle.values()) {
        const sortiert = [...transforms].sort();
        const schluessel = `${entryType}|${viaKey}|${sortiert.join(',')}`;
        if (!regeln.has(schluessel)) regeln.set(schluessel, { entryType, via, viaKey, felder: [], transforms: sortiert });
        regeln.get(schluessel).felder.push(feld);
    }

    return [...regeln.values()]
        .map(r => ({ ...r, felder: r.felder.sort() }))
        .sort((a, b) => a.entryType.localeCompare(b.entryType)
            || a.viaKey.localeCompare(b.viaKey)
            || a.felder.join().localeCompare(b.felder.join()));
}

// Standalone-Deklarationen werden zum Top-Level-`fields`-Block: global je Feld-Handle.
function gruppiereFelder(standalone) {
    const nachFeld = new Map();
    for (const { feld, transforms } of standalone) {
        if (!nachFeld.has(feld)) nachFeld.set(feld, new Set());
        for (const t of transforms) nachFeld.get(feld).add(t);
    }
    return [...nachFeld.entries()]
        .map(([feld, transforms]) => ({ feld, transforms: [...transforms].sort() }))
        .sort((a, b) => a.feld.localeCompare(b.feld));
}

function phpListe(werte) {
    return `[${werte.map(w => `'${w}'`).join(', ')}]`;
}

function phpCriteria(regel) {
    if (!regel.via) return `['type' => '${regel.entryType}']`;
    return `[
                'type' => '${regel.entryType}',
                'relatedTo' => ['sourceElement' => \\craft\\elements\\Entry::find()->type('${regel.via.entryType}'), 'field' => '${regel.via.feld}'],
            ]`;
}

function phpGenerate(regeln, felder) {
    const eintraege = regeln.map(r => `        [
            'elementType' => \\craft\\elements\\Entry::class,
            'criteria' => ${phpCriteria(r)},
            'fields' => ${phpListe(r.felder)},
            'transforms' => ${phpListe(r.transforms)},
        ]`).join(',\n');

    const feldBlock = felder.length === 0 ? '' : `
    'fields' => [
${felder.map(f => `        '${f.feld}' => ${phpListe(f.transforms)},`).join('\n')}
    ],`;

    return `<?php

// Generiert von scripts/generate-transforms.js — nicht bearbeiten.
// Quelle sind die {# bildquelle: … #}-Deklarationen in src/. Eine Regel je
// Entry-Type: Matrix-Bausteine sind in Craft 5 eigene Entries und lösen beim
// Speichern ihr eigenes Event aus, deshalb braucht es weder Section-Listen
// noch Matrix-Pfade. Ein relatedTo-Filter kommt aus „via entryType.feld“,
// der fields-Block aus Standalone-Deklarationen „*.feld = transform“.

return [
    'elements' => [
${eintraege},
    ],${feldBlock}
];
`;
}

const cfg = ladeProjectConfig(root);
const { aufrufe, standalone, fehler: scanFehler } = liesBildaufrufe(root);
const direktaufrufe = liesDirektaufrufe(root);
const { fehler, warnungen } = pruefeBildquellen(cfg, aufrufe, standalone, direktaufrufe, scanFehler);

if (fehler.length > 0) {
    console.error(`✗ ${fehler.length} Fehler in den Bildquellen — es wurde nichts geschrieben:`);
    for (const f of fehler) console.error(`  ${f}`);
    process.exitCode = 1;
} else {
    const breiten = transformBreiten(aufrufe);
    const regeln = gruppiereRegeln(aufrufe);
    const felder = gruppiereFelder(standalone);
    const seomateHandles = [...new Set(felder.flatMap(f => f.transforms))].sort();
    const kanten = liesRenderkanten(root);

    writeFileSync(join(root, 'config/imager-x-transforms.php'), phpTransforms(breiten, seomateHandles), 'utf-8');
    writeFileSync(join(root, 'config/imager-x-generate.php'), phpGenerate(regeln, felder), 'utf-8');
    writeFileSync(join(root, 'docs/bildquellen.md'), markdownBericht({
        speicher: speicherbaum(cfg, aufrufe, standalone),
        render: renderbaum(cfg, kanten, aufrufe, standalone),
        warnungen,
    }), 'utf-8');

    console.log(`✓ ${breiten.size + seomateHandles.length} Transforms generiert: ${[...breiten.keys(), ...seomateHandles].join(', ')}`);
    console.log(`✓ ${regeln.length} Generate-Regeln: ${regeln.map(r => r.entryType + (r.via ? ` via ${r.viaKey}` : '')).join(', ')}`);
    if (felder.length > 0) console.log(`✓ ${felder.length} Feld-Regeln: ${felder.map(f => f.feld).join(', ')}`);
    console.log('✓ docs/bildquellen.md geschrieben');
}

if (warnungen.length > 0) {
    console.warn(`⚠ ${warnungen.length} Warnungen:`);
    for (const w of warnungen) console.warn(`  ${w}`);
}
