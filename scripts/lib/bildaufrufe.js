import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';

/**
 * Liest die Twig-Quellen unter src/: die macros.picture()-Aufrufe mit ihrer
 * Bildquellen-Deklaration, Standalone-Deklarationen ohne Aufruf, die Breiten
 * für die Transforms und die Kanten Template → Modul → Entry-Type für den
 * Renderbaum.
 *
 * Deklarationsformen:
 *   {# bildquelle: entryType.feld #}                       Speicherort
 *   {# bildquelle: entryType.feld via entryType.feld #}    nur Elemente, die das
 *                                                          genannte Entries-Feld verknüpft
 *   {# bildquelle: *.feld = transform, transform #}        Standalone, ohne Aufruf
 */

/** @typedef {{ entryType: string, feld: string, via: { entryType: string, feld: string } | null }} Quelle */
/** @typedef {{ datei: string, zeile: number, modul: string, transform: string, sizes: string, quellen: Quelle[] }} Bildaufruf */
/** @typedef {{ datei: string, zeile: number, entryType: string, feld: string, transforms: string[] }} StandaloneQuelle */
/** @typedef {{ datei: string, includes: string[], matrixFeld: string|null, faelle: Array<{ entryType: string, include: string }> }} Renderkante */

const MIN_VIEWPORT = 375; // Kleinste CSS-Viewport-Breite eines aktuellen Highres-Phones (iPhone SE)
const MIN_DPR = 2;        // Minimaler DPR für Highres-Phones
const MAX_VIEWPORT = 4000;

const pictureRegex = /macros\.picture\s*\(\s*[^,]+,\s*'([a-zA-Z][a-zA-Z0-9]*)'\s*,\s*'([^']*)'/;
const deklarationRegex = /\{#\s*bildquelle:\s*(.+?)\s*#\}/;
const quelleRegex = /^([a-zA-Z][a-zA-Z0-9]*|\*)\.([a-zA-Z][a-zA-Z0-9]*)(?:\s+via\s+([a-zA-Z][a-zA-Z0-9]*)\.([a-zA-Z][a-zA-Z0-9]*))?$/;
const handleRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;
const direktRegex = /craft\.imagerx\.transformImage\s*\([^,]+,\s*'([a-zA-Z][a-zA-Z0-9]*)'/g;
const includeRegex = /\{%\s*include\s+['"]([^'"]+)['"]/g;
const caseRegex = /\{%\s*case\s+'([a-zA-Z0-9]+)'\s*%\}/g;
const matrixSchleifeRegex = /\{%\s*for\s+module\s+in\s+entry\.([a-zA-Z0-9]+)/;

/**
 * Alle Twig-Dateien unter `dir`, sortiert, damit die Ausgabe deterministisch bleibt.
 * @param {string} dir
 * @returns {string[]}
 */
export function findeTwigDateien(dir) {
    const results = [];
    for (const entry of readdirSync(dir).sort()) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            results.push(...findeTwigDateien(full));
        } else if (extname(entry) === '.twig') {
            results.push(full);
        }
    }
    return results;
}

function alleTwigDateien(root) {
    return [...findeTwigDateien(join(root, 'src/modules')), ...findeTwigDateien(join(root, 'src/templates'))];
}

function modulName(root, datei) {
    const rel = relative(join(root, 'src'), datei).split(sep);
    return rel[0] === 'modules' ? rel[1] : rel.join('/');
}

function parseQuellen(text, ort, fehler) {
    const quellen = [];
    for (const teil of text.split(',').map(t => t.trim()).filter(Boolean)) {
        const match = teil.match(quelleRegex);
        if (!match) {
            fehler.push(`${ort} — Bildquelle „${teil}“ hat nicht die Form entryType.feld, optional mit „via entryType.feld“`);
            continue;
        }
        const [, entryType, feld, viaEntryType, viaFeld] = match;
        if (entryType === '*') {
            fehler.push(`${ort} — „*“ ist nur in Standalone-Deklarationen mit „=“ erlaubt`);
            continue;
        }
        quellen.push({ entryType, feld, via: viaEntryType ? { entryType: viaEntryType, feld: viaFeld } : null });
    }
    return quellen;
}

// `*.feld = transform, transform` — ohne Aufruf, die Transforms stehen in der Deklaration.
function parseStandalone(text, ort, fehler) {
    const [links, rechts] = text.split('=').map(t => t.trim());
    const match = links.match(quelleRegex);
    if (!match || match[3]) {
        fehler.push(`${ort} — Standalone-Deklaration muss die Form „*.feld = transform, …“ haben`);
        return null;
    }
    const transforms = (rechts ?? '').split(',').map(t => t.trim()).filter(Boolean);
    if (transforms.length === 0) {
        fehler.push(`${ort} — Standalone-Deklaration ohne Transforms nach „=“`);
        return null;
    }
    const ungueltig = transforms.filter(t => !handleRegex.test(t));
    if (ungueltig.length > 0) {
        fehler.push(`${ort} — ungültige Transform-Handles: ${ungueltig.join(', ')}`);
        return null;
    }
    return { entryType: match[1], feld: match[2], transforms };
}

/**
 * Sucht alle Deklarationen unter src/modules und src/templates. Eine Deklaration
 * gehört zum macros.picture()-Aufruf auf der Zeile unmittelbar danach; steht
 * dort keiner, muss sie eine Standalone-Deklaration mit „=“ sein.
 * @param {string} root Projektwurzel
 * @returns {{ aufrufe: Bildaufruf[], standalone: StandaloneQuelle[], fehler: string[] }}
 */
export function liesBildaufrufe(root) {
    const aufrufe = [];
    const standalone = [];
    const fehler = [];

    for (const datei of alleTwigDateien(root)) {
        const relDatei = relative(root, datei);
        const zeilen = readFileSync(datei, 'utf-8').split('\n');

        zeilen.forEach((zeile, index) => {
            const nr = index + 1;
            const ort = `${relDatei}:${nr}`;

            const deklaration = zeile.match(deklarationRegex);
            if (deklaration) {
                const folgtAufruf = pictureRegex.test(zeilen[index + 1] ?? '');
                const istStandalone = deklaration[1].includes('=');
                if (!folgtAufruf && !istStandalone) {
                    fehler.push(`${ort} — Bildquellen-Deklaration ohne macros.picture()-Aufruf auf der Folgezeile (Standalone braucht „= transform“)`);
                } else if (folgtAufruf && istStandalone) {
                    fehler.push(`${ort} — „=“ ist nur in Standalone-Deklarationen erlaubt; am Aufruf kommt der Transform aus dem Aufruf`);
                } else if (istStandalone) {
                    const quelle = parseStandalone(deklaration[1], ort, fehler);
                    if (quelle) standalone.push({ datei: relDatei, zeile: nr, ...quelle });
                }
            }

            if (!zeile.includes('macros.picture')) return;
            const match = zeile.match(pictureRegex);
            if (!match) {
                fehler.push(`${ort} — macros.picture()-Aufruf nicht lesbar (Transform und Sizes als einzeilige String-Literale erwartet)`);
                return;
            }

            const davor = (zeilen[index - 1] ?? '').match(deklarationRegex);
            if (!davor) {
                fehler.push(`${ort} — macros.picture()-Aufruf ohne {# bildquelle: entryType.feld #} auf der Zeile davor`);
                return;
            }
            if (davor[1].includes('=')) return; // bereits oben gemeldet

            aufrufe.push({
                datei: relDatei,
                zeile: nr,
                modul: modulName(root, datei),
                transform: match[1],
                sizes: match[2],
                quellen: parseQuellen(davor[1], ort, fehler),
            });
        });
    }

    return { aufrufe, standalone, fehler };
}

/**
 * Kleinste und grösste Bildbreite je Transform, aus dem ersten und letzten
 * vw-Wert des sizes-Strings. Mehrere Aufrufe desselben Transforms werden
 * zur Gesamtspanne zusammengefasst.
 * @param {Bildaufruf[]} aufrufe
 * @returns {Map<string, { minWidth: number, maxWidth: number }>}
 */
export function transformBreiten(aufrufe) {
    const breiten = new Map();
    for (const { transform, sizes } of aufrufe) {
        const vwValues = [...sizes.matchAll(/(\d+)vw/g)].map(m => parseInt(m[1]));
        if (vwValues.length === 0) continue;

        const minWidth = Math.round(vwValues[0] / 100 * MIN_VIEWPORT * MIN_DPR);
        const maxWidth = Math.round(vwValues[vwValues.length - 1] / 100 * MAX_VIEWPORT);

        const bisher = breiten.get(transform);
        if (!bisher) {
            breiten.set(transform, { minWidth, maxWidth });
        } else {
            bisher.minWidth = Math.min(bisher.minWidth, minWidth);
            bisher.maxWidth = Math.max(bisher.maxWidth, maxWidth);
        }
    }
    return breiten;
}

/**
 * Imager-X-Aufrufe ausserhalb der picture-Macro. Der Generator sieht sie
 * nicht; sie werden gemeldet, damit niemand sie für vorgeneriert hält.
 * @param {string} root
 * @returns {Array<{ datei: string, zeile: number, transform: string }>}
 */
export function liesDirektaufrufe(root) {
    const treffer = [];
    for (const datei of alleTwigDateien(root)) {
        readFileSync(datei, 'utf-8').split('\n').forEach((zeile, index) => {
            for (const match of zeile.matchAll(direktRegex)) {
                treffer.push({ datei: relative(root, datei), zeile: index + 1, transform: match[1] });
            }
        });
    }
    return treffer;
}

// Include-Pfade aus dem Twig auf Pfade unter src/ abbilden: `_modules/x/_x.twig`
// liegt in src/modules, alles andere in src/templates.
function includeZuSrcPfad(pfad) {
    const bereinigt = pfad.replace(/^\/+/, '');
    if (bereinigt.startsWith('_modules/')) return `src/modules/${bereinigt.slice('_modules/'.length)}`;
    if (bereinigt.startsWith('_macros/')) return null;
    return `src/templates/${bereinigt.endsWith('.twig') ? bereinigt : `${bereinigt}.twig`}`;
}

/**
 * Pro Twig-Datei: welche Dateien sie einbindet, über welches Matrix-Feld
 * sie iteriert und welcher `case` zu welchem Include führt.
 * Schlüssel ist der Pfad relativ zur Projektwurzel (`src/modules/…`).
 * @param {string} root
 * @returns {Map<string, Renderkante>}
 */
export function liesRenderkanten(root) {
    const kanten = new Map();
    for (const datei of [...findeTwigDateien(join(root, 'src/templates')), ...findeTwigDateien(join(root, 'src/modules'))]) {
        const inhalt = readFileSync(datei, 'utf-8');
        const kante = { datei: relative(root, datei), includes: [], matrixFeld: null, faelle: [] };

        kante.matrixFeld = inhalt.match(matrixSchleifeRegex)?.[1] ?? null;

        // case und include in Dokumentreihenfolge: ein include direkt nach einem
        // case gehört zu diesem Fall, alle anderen sind einfache Includes.
        const tags = [
            ...[...inhalt.matchAll(caseRegex)].map(m => ({ pos: m.index, typ: 'case', wert: m[1] })),
            ...[...inhalt.matchAll(includeRegex)].map(m => ({ pos: m.index, typ: 'include', wert: includeZuSrcPfad(m[1]) })),
        ].sort((a, b) => a.pos - b.pos);

        let offenerFall = null;
        for (const tag of tags) {
            if (tag.typ === 'case') {
                offenerFall = tag.wert;
                continue;
            }
            if (!tag.wert) continue;
            if (offenerFall) {
                kante.faelle.push({ entryType: offenerFall, include: tag.wert });
                offenerFall = null;
            } else {
                kante.includes.push(tag.wert);
            }
        }

        kanten.set(kante.datei, kante);
    }
    return kanten;
}
