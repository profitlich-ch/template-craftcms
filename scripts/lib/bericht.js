import { entriesZiele, istAssets, istEntries, istMatrix, matrixKinder, sectionTemplate } from './projectConfig.js';

/**
 * Zeichnet die zwei Bäume für docs/bildquellen.md: den Speicherbaum von der
 * Section bis zum Assets-Feld und den Renderbaum von der Section über
 * Template und Modul bis zum picture-Aufruf.
 */

/** @typedef {{ label: string|string[], kinder: Knoten[] }} Knoten */

/**
 * Textbaum mit Linienzeichen. Mehrzeilige Labels bekommen die Fortsetzung
 * unter der ersten Zeile eingerückt.
 * @param {Knoten[]} knoten
 * @param {string} praefix
 * @returns {string[]}
 */
function zeichne(knoten, praefix = '') {
    const zeilen = [];
    knoten.forEach((k, i) => {
        const letzter = i === knoten.length - 1;
        const ast = letzter ? '└─ ' : '├─ ';
        const fortsetzung = letzter ? '   ' : '│  ';
        const labels = Array.isArray(k.label) ? k.label : [k.label];
        zeilen.push(`${praefix}${ast}${labels[0]}`);
        for (const weitere of labels.slice(1)) {
            zeilen.push(`${praefix}${fortsetzung}${weitere}`);
        }
        zeilen.push(...zeichne(k.kinder, praefix + fortsetzung));
    });
    return zeilen;
}

function quelleText(q) {
    return `${q.entryType}.${q.feld}${q.via ? ` via ${q.via.entryType}.${q.via.feld}` : ''}`;
}

function templateLabel(datei) {
    return datei.replace(/^src\/templates\//, '');
}

// Alle Zeilen, die an einem Assets-Feld hängen: Aufrufe mit ihrem Transform,
// Standalone-Deklarationen mit ihren Transforms.
function assetsLabel(instanz, entryType, aufrufe, standalone) {
    const zeilen = [];
    for (const a of aufrufe) {
        const q = a.quellen.find(q => q.entryType === entryType.handle && q.feld === instanz.handle);
        if (q) zeilen.push(`→ ${a.transform} · ${a.modul}${q.via ? ` (via ${q.via.entryType}.${q.via.feld})` : ''}`);
    }
    for (const s of standalone) {
        if (s.feld === instanz.handle) zeilen.push(`→ ${s.transforms.join(', ')} · ${templateLabel(s.datei)}`);
    }
    if (zeilen.length === 0) return `${instanz.handle} [Assets] — keine Bildquelle`;
    const kopf = `${instanz.handle} [Assets] `;
    return zeilen.map((z, i) => `${i === 0 ? kopf : ' '.repeat(kopf.length)}${z}`);
}

function entryTypeKnoten(cfg, entryType, aufrufe, standalone, besucht) {
    const kinder = [];
    for (const instanz of entryType.felder) {
        const { feld } = instanz;
        if (istAssets(feld)) {
            kinder.push({ label: assetsLabel(instanz, entryType, aufrufe, standalone), kinder: [] });
        } else if (istMatrix(feld)) {
            const pfad = new Set([...besucht, entryType.handle]);
            kinder.push({
                label: `${instanz.handle} [Matrix]`,
                kinder: matrixKinder(cfg, feld).map(kind => pfad.has(kind.handle)
                    ? { label: `${kind.handle} (siehe oben)`, kinder: [] }
                    : entryTypeKnoten(cfg, kind, aufrufe, standalone, pfad)),
            });
        } else if (istEntries(feld)) {
            kinder.push({ label: `${instanz.handle} [Entries → ${entriesZiele(cfg, feld).map(s => s.handle).join(', ')}]`, kinder: [] });
        }
    }
    return { label: entryType.handle, kinder };
}

/**
 * @param {import('./projectConfig.js').ProjectConfig} cfg
 * @param {import('./bildaufrufe.js').Bildaufruf[]} aufrufe
 * @param {import('./bildaufrufe.js').StandaloneQuelle[]} standalone
 * @returns {string}
 */
export function speicherbaum(cfg, aufrufe, standalone) {
    const zeilen = [];
    for (const section of [...cfg.sections.values()].sort((a, b) => a.handle.localeCompare(b.handle))) {
        zeilen.push(`${section.handle} (${section.typ}) · ${sectionTemplate(section) ?? '—'}`);
        zeilen.push(...zeichne(section.entryTypes.map(et => entryTypeKnoten(cfg, et, aufrufe, standalone, new Set()))));
    }
    return zeilen.join('\n');
}

// `src/modules/angebot-seite/_angebot-seite.twig` → `angebot-seite`,
// Nebendateien wie `_bausteine.twig` behalten ihren Namen.
function modulLabel(pfad) {
    const match = pfad.match(/^src\/modules\/([^/]+)\/(.+)$/);
    if (!match) return templateLabel(pfad);
    const [, ordner, datei] = match;
    return datei === `_${ordner}.twig` ? ordner : `${ordner}/${datei}`;
}

function dateiKnoten(pfad, kanten, aufrufe, besucht, labelPraefix = '') {
    const kante = kanten.get(pfad);
    const label = `${labelPraefix}${modulLabel(pfad)}${kante?.matrixFeld ? `  [entry.${kante.matrixFeld}]` : ''}`;
    if (!kante || besucht.has(pfad)) return { label, kinder: [] };

    const pfadMenge = new Set([...besucht, pfad]);
    const kinder = [];

    for (const a of aufrufe.filter(a => a.datei === pfad)) {
        kinder.push({ label: `picture '${a.transform}' ← ${a.quellen.map(quelleText).join(', ')}`, kinder: [] });
    }
    for (const { entryType, include } of kante.faelle) {
        kinder.push(dateiKnoten(include, kanten, aufrufe, pfadMenge, `${entryType} → `));
    }
    for (const include of kante.includes) {
        kinder.push(dateiKnoten(include, kanten, aufrufe, pfadMenge));
    }
    return { label, kinder };
}

/**
 * @param {import('./projectConfig.js').ProjectConfig} cfg
 * @param {Map<string, import('./bildaufrufe.js').Renderkante>} kanten
 * @param {import('./bildaufrufe.js').Bildaufruf[]} aufrufe
 * @param {import('./bildaufrufe.js').StandaloneQuelle[]} standalone
 * @returns {string}
 */
export function renderbaum(cfg, kanten, aufrufe, standalone) {
    const zeilen = [];

    // Standalone-Deklarationen hängen an keiner Section, sondern am Layout.
    const nachDatei = new Map();
    for (const s of standalone) {
        if (!nachDatei.has(s.datei)) nachDatei.set(s.datei, []);
        nachDatei.get(s.datei).push(s);
    }
    for (const [datei, eintraege] of [...nachDatei.entries()].sort()) {
        zeilen.push(`alle Seiten · ${templateLabel(datei)}`);
        zeilen.push(...zeichne(eintraege.map(s => ({ label: `standalone '${s.transforms.join(', ')}' ← *.${s.feld}`, kinder: [] }))));
    }

    for (const section of [...cfg.sections.values()].sort((a, b) => a.handle.localeCompare(b.handle))) {
        const template = sectionTemplate(section);
        if (!template) continue;
        const pfad = `src/templates/${template}`;
        zeilen.push(`${section.handle} · ${template}`);
        const wurzel = dateiKnoten(pfad, kanten, aufrufe, new Set());
        zeilen.push(...zeichne(wurzel.kinder));
    }
    return zeilen.join('\n');
}

/**
 * Die komplette Markdown-Datei.
 * @param {{ speicher: string, render: string, warnungen: string[] }} teile
 * @returns {string}
 */
export function markdownBericht({ speicher, render, warnungen }) {
    const warnungsliste = warnungen.length
        ? warnungen.map(w => `- ${w}`).join('\n')
        : '- keine';

    return `# Bildquellen

Generiert von \`scripts/generate-transforms.js\`, nicht bearbeiten. Zeigt, wo Bilder gespeichert sind und wo sie gerendert werden; daraus entstehen \`config/imager-x-transforms.php\` und \`config/imager-x-generate.php\`.

## Speicherbaum

Section → Entry-Type → Feld. An jedem Assets-Feld der Transform und das Modul, die es rendern; \`via\` nennt das Entries-Feld, dessen Verknüpfung die Elemente eingrenzt.

\`\`\`
${speicher}
\`\`\`

## Renderbaum

Section → Template → Modul → picture-Aufruf mit seiner Bildquelle. Matrix-Schleifen stehen in eckigen Klammern, \`case\`-Zweige als \`entryType → modul\`.

\`\`\`
${render}
\`\`\`

## Warnungen

${warnungsliste}
`;
}
