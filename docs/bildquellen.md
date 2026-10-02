# Bildquellen

Generiert von `scripts/generate-transforms.js`, nicht bearbeiten. Zeigt, wo Bilder gespeichert sind und wo sie gerendert werden; daraus entstehen `config/imager-x-transforms.php` und `config/imager-x-generate.php`.

## Speicherbaum

Section → Entry-Type → Feld. An jedem Assets-Feld der Transform und das Modul, die es rendern; `via` nennt das Entries-Feld, dessen Verknüpfung die Elemente eingrenzt.

```
startseite (single) · startseite/_entry.twig
└─ startseite
   ├─ projektbilder [Assets] → startseite · templates/startseite/_entry.twig
   └─ openGraphBild [Assets] → seomateImage, seomateOgImage, seomateTwitterImage · _layout.twig
```

## Renderbaum

Section → Template → Modul → picture-Aufruf mit seiner Bildquelle. Matrix-Schleifen stehen in eckigen Klammern, `case`-Zweige als `entryType → modul`.

```
alle Seiten · _layout.twig
└─ standalone 'seomateImage, seomateOgImage, seomateTwitterImage' ← *.openGraphBild
startseite · startseite/_entry.twig
└─ picture 'startseite' ← startseite.projektbilder
```

## Warnungen

- keine
