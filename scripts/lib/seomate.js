/**
 * Benannte Imager-Transforms, die die Masse aus SEOMates `imageTransformMap`
 * übernehmen. Der Handle ist der Name in der Generate-Config, der Wert der
 * Schlüssel in config/seomate.php. Die generierte Transforms-Datei liest die
 * Masse zur Laufzeit, damit beide Seiten dieselbe Datei erzeugen.
 */
export const SEOMATE_TRANSFORMS = {
    seomateImage: 'image',
    seomateOgImage: 'og:image',
    seomateTwitterImage: 'twitter:image',
};
