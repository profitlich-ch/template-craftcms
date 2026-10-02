import { assetsStandorte, entriesZiele, istAssets, istEntries } from './projectConfig.js';
import { SEOMATE_TRANSFORMS } from './seomate.js';

/**
 * Prüft die Bildquellen-Deklarationen gegen die Project Config.
 * Fehler verhindern das Schreiben der Configs, Warnungen nicht.
 */

/** @typedef {{ fehler: string[], warnungen: string[] }} Pruefergebnis */

// Ein `via entryType.feld` ist gültig, wenn das Feld ein Entries-Feld ist und
// eine seiner Quell-Sections den Ziel-Entry-Type führt.
function pruefeVia(cfg, via, ziel, ort, fehler) {
    const et = cfg.entryTypes.get(via.entryType);
    if (!et) {
        fehler.push(`${ort} — via: Entry-Type „${via.entryType}“ gibt es nicht`);
        return false;
    }
    const instanz = et.felder.find(f => f.handle === via.feld);
    if (!instanz) {
        fehler.push(`${ort} — via: Feld „${via.feld}“ gibt es im Entry-Type „${via.entryType}“ nicht (vorhanden: ${et.felder.map(f => f.handle).join(', ') || 'keine'})`);
        return false;
    }
    if (!istEntries(instanz.feld)) {
        fehler.push(`${ort} — via: Feld „${via.entryType}.${via.feld}“ ist kein Entries-Feld, sondern ${instanz.feld.typ}`);
        return false;
    }
    const sections = entriesZiele(cfg, instanz.feld);
    if (!sections.some(s => s.entryTypes.includes(ziel))) {
        fehler.push(`${ort} — via: Feld „${via.entryType}.${via.feld}“ verknüpft ${sections.map(s => s.handle).join(', ') || 'nichts'}, dort kommt der Entry-Type „${ziel.handle}“ nicht vor`);
        return false;
    }
    return true;
}

/**
 * @param {import('./projectConfig.js').ProjectConfig} cfg
 * @param {import('./bildaufrufe.js').Bildaufruf[]} aufrufe
 * @param {import('./bildaufrufe.js').StandaloneQuelle[]} standalone
 * @param {Array<{ datei: string, zeile: number, transform: string }>} direktaufrufe
 * @param {string[]} scanFehler Fehler aus dem Twig-Scanner
 * @returns {Pruefergebnis}
 */
export function pruefeBildquellen(cfg, aufrufe, standalone, direktaufrufe, scanFehler) {
    const fehler = [...scanFehler];
    const warnungen = [];
    const deklariert = new Set();

    for (const aufruf of aufrufe) {
        const ort = `${aufruf.datei}:${aufruf.zeile}`;

        if (aufruf.quellen.length === 0) {
            fehler.push(`${ort} — keine gültige Bildquelle für Transform „${aufruf.transform}“`);
        }

        for (const { entryType, feld, via } of aufruf.quellen) {
            const et = cfg.entryTypes.get(entryType);
            if (!et) {
                fehler.push(`${ort} — Entry-Type „${entryType}“ gibt es nicht (vorhanden: ${[...cfg.entryTypes.keys()].sort().join(', ')})`);
                continue;
            }
            const instanz = et.felder.find(f => f.handle === feld);
            if (!instanz) {
                const vorhanden = et.felder.map(f => f.handle).join(', ') || 'keine';
                fehler.push(`${ort} — Feld „${feld}“ gibt es im Entry-Type „${entryType}“ nicht (vorhanden: ${vorhanden})`);
                continue;
            }
            if (!istAssets(instanz.feld)) {
                fehler.push(`${ort} — Feld „${entryType}.${feld}“ ist kein Assets-Feld, sondern ${instanz.feld.typ}`);
                continue;
            }
            if (via && !pruefeVia(cfg, via, et, ort, fehler)) continue;
            deklariert.add(`${entryType}.${feld}`);
        }
    }

    for (const s of standalone) {
        const ort = `${s.datei}:${s.zeile}`;
        if (s.entryType !== '*') {
            fehler.push(`${ort} — Standalone-Deklarationen gelten für jeden Entry-Type mit dem Feld; nur „*.${s.feld}“ ist erlaubt`);
            continue;
        }
        const standorte = assetsStandorte(cfg).filter(({ instanz }) => instanz.handle === s.feld);
        if (standorte.length === 0) {
            fehler.push(`${ort} — „${s.feld}“ ist auf keinem Entry-Type ein Assets-Feld`);
            continue;
        }
        const unbekannt = s.transforms.filter(t => !(t in SEOMATE_TRANSFORMS));
        if (unbekannt.length > 0) {
            fehler.push(`${ort} — Transforms ${unbekannt.join(', ')} kennt der Generator nicht (möglich: ${Object.keys(SEOMATE_TRANSFORMS).join(', ')})`);
            continue;
        }
        for (const { entryType } of standorte) deklariert.add(`${entryType.handle}.${s.feld}`);
    }

    for (const { entryType, instanz } of assetsStandorte(cfg)) {
        const schluessel = `${entryType.handle}.${instanz.handle}`;
        if (!deklariert.has(schluessel)) {
            warnungen.push(`Assets-Feld ${schluessel} hat keine Bildquelle — wird nicht vorgeneriert`);
        }
    }

    for (const { datei, zeile, transform } of direktaufrufe) {
        warnungen.push(`${datei}:${zeile} — craft.imagerx.transformImage(…, '${transform}') ausserhalb der picture-Macro; der Generator sieht diesen Aufruf nicht`);
    }

    return { fehler, warnungen };
}
