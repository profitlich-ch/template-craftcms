import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

/**
 * Liest die Craft Project Config (config/project/) und baut daraus den Graphen
 * Section → Entry-Type → Feld, mit Matrix- und Entries-Feldern als Kanten zu
 * weiteren Entry-Types bzw. Sections.
 *
 * Handle und UID stammen aus dem Dateinamen `<handle>--<uuid>.yaml`; die UID
 * steht nicht im Dateiinhalt.
 */

/** @typedef {{ handle: string, uid: string, name: string, typ: string, settings: object }} Feld */
/** @typedef {{ handle: string, feld: Feld, pflicht: boolean }} FeldInstanz */
/** @typedef {{ handle: string, uid: string, name: string, felder: FeldInstanz[] }} EntryType */
/** @typedef {{ handle: string, uid: string, name: string, typ: string, entryTypes: EntryType[], template: string|null }} Section */
/** @typedef {{ sections: Map<string, Section>, entryTypes: Map<string, EntryType>, felder: Map<string, Feld> }} ProjectConfig */
/** @typedef {{ entryType: EntryType, instanz: FeldInstanz }} AssetsStandort */

const TYP_ASSETS = 'craft\\fields\\Assets';
const TYP_MATRIX = 'craft\\fields\\Matrix';
const TYP_ENTRIES = 'craft\\fields\\Entries';
const LAYOUT_CUSTOM_FIELD = 'craft\\fieldlayoutelements\\CustomField';

const dateinameRegex = /^(.+)--([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.yaml$/;

/**
 * Craft schreibt assoziative Arrays teils als `{ __assoc__: [[key, value], …] }`.
 * Wandelt diese Form rekursiv in normale Objekte um.
 */
function entassoc(wert) {
    if (Array.isArray(wert)) {
        return wert.map(entassoc);
    }
    if (wert && typeof wert === 'object') {
        if (Array.isArray(wert.__assoc__)) {
            return Object.fromEntries(wert.__assoc__.map(([k, v]) => [k, entassoc(v)]));
        }
        return Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, entassoc(v)]));
    }
    return wert;
}

function liesOrdner(dir) {
    const ergebnis = new Map();
    for (const datei of readdirSync(dir)) {
        const match = datei.match(dateinameRegex);
        if (!match) continue;
        const [, handle, uid] = match;
        const daten = entassoc(parse(readFileSync(join(dir, datei), 'utf-8')));
        ergebnis.set(uid, { handle, uid, daten });
    }
    return ergebnis;
}

// Nur echte Feldzuweisungen zählen; `fieldUid` in elementCondition.conditionRules
// ist eine Sichtbarkeitsbedingung und wird hier gar nicht erst angefasst.
function layoutFelder(entryTypeDaten, felderNachUid) {
    const instanzen = [];
    for (const layout of Object.values(entryTypeDaten.fieldLayouts ?? {})) {
        for (const tab of layout.tabs ?? []) {
            for (const element of tab.elements ?? []) {
                if (element.type !== LAYOUT_CUSTOM_FIELD) continue;
                const feld = felderNachUid.get(element.fieldUid);
                if (!feld) continue;
                instanzen.push({
                    handle: element.handle ?? feld.handle,
                    feld,
                    pflicht: element.required === true,
                });
            }
        }
    }
    return instanzen;
}

/**
 * Liest sections/, entryTypes/ und fields/ unter `root/config/project`.
 * @param {string} root Projektwurzel
 * @returns {ProjectConfig}
 */
export function ladeProjectConfig(root) {
    const basis = join(root, 'config/project');
    const felderRoh = liesOrdner(join(basis, 'fields'));
    const entryTypesRoh = liesOrdner(join(basis, 'entryTypes'));
    const sectionsRoh = liesOrdner(join(basis, 'sections'));

    const felderNachUid = new Map();
    for (const { handle, uid, daten } of felderRoh.values()) {
        felderNachUid.set(uid, { handle, uid, name: daten.name, typ: daten.type, settings: daten.settings ?? {} });
    }

    const entryTypesNachUid = new Map();
    for (const { handle, uid, daten } of entryTypesRoh.values()) {
        entryTypesNachUid.set(uid, { handle, uid, name: daten.name, felder: layoutFelder(daten, felderNachUid) });
    }

    const sections = new Map();
    for (const { handle, uid, daten } of sectionsRoh.values()) {
        const entryTypes = (daten.entryTypes ?? [])
            .map(eintrag => entryTypesNachUid.get(typeof eintrag === 'string' ? eintrag : eintrag.uid))
            .filter(Boolean);
        const siteSettings = Object.values(daten.siteSettings ?? {})[0] ?? {};
        sections.set(handle, { handle, uid, name: daten.name, typ: daten.type, entryTypes, template: siteSettings.template ?? null });
    }

    return {
        sections,
        entryTypes: new Map([...entryTypesNachUid.values()].map(et => [et.handle, et])),
        felder: new Map([...felderNachUid.values()].map(f => [f.handle, f])),
        // UID-Zugriff für Kanten, die in der YAML per UID stehen
        entryTypesNachUid,
        sectionsNachUid: new Map([...sections.values()].map(s => [s.uid, s])),
    };
}

/** @param {Feld} feld */
export function istAssets(feld) {
    return feld.typ === TYP_ASSETS;
}

/** @param {Feld} feld */
export function istMatrix(feld) {
    return feld.typ === TYP_MATRIX;
}

/** @param {Feld} feld */
export function istEntries(feld) {
    return feld.typ === TYP_ENTRIES;
}

/**
 * Entry-Types, die ein Matrix-Feld erlaubt.
 * @param {ProjectConfig} cfg
 * @param {Feld} feld
 * @returns {EntryType[]}
 */
export function matrixKinder(cfg, feld) {
    if (!istMatrix(feld)) return [];
    return (feld.settings.entryTypes ?? [])
        .map(eintrag => cfg.entryTypesNachUid.get(typeof eintrag === 'string' ? eintrag : eintrag.uid))
        .filter(Boolean);
}

/**
 * Sections, aus denen ein Entries-Feld wählen darf.
 * @param {ProjectConfig} cfg
 * @param {Feld} feld
 * @returns {Section[]}
 */
export function entriesZiele(cfg, feld) {
    if (!istEntries(feld)) return [];
    const sources = feld.settings.sources;
    if (sources === '*' || !Array.isArray(sources)) return [...cfg.sections.values()];
    return sources
        .map(quelle => cfg.sectionsNachUid.get(quelle.replace(/^section:/, '')))
        .filter(Boolean);
}

/**
 * Alle Assets-Feld-Instanzen über alle Entry-Types.
 * @param {ProjectConfig} cfg
 * @returns {AssetsStandort[]}
 */
export function assetsStandorte(cfg) {
    const standorte = [];
    for (const entryType of cfg.entryTypes.values()) {
        for (const instanz of entryType.felder) {
            if (istAssets(instanz.feld)) standorte.push({ entryType, instanz });
        }
    }
    return standorte;
}

/**
 * Wer einen Entry-Type führt: Sections direkt, Matrix-Felder als Bausteine.
 * @param {ProjectConfig} cfg
 * @param {EntryType} entryType
 * @returns {{ sections: Section[], matrixFelder: Feld[] }}
 */
export function eigentuemer(cfg, entryType) {
    const sections = [...cfg.sections.values()].filter(s => s.entryTypes.includes(entryType));
    const matrixFelder = [...cfg.felder.values()].filter(f => matrixKinder(cfg, f).includes(entryType));
    return { sections, matrixFelder };
}

/**
 * Template-Pfad einer Section, normalisiert auf `.twig`; null ohne URL.
 * @param {Section} section
 * @returns {string|null}
 */
export function sectionTemplate(section) {
    if (!section.template) return null;
    return section.template.endsWith('.twig') ? section.template : `${section.template}.twig`;
}
