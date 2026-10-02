# CLAUDE.md – template-craftcms

Vorlage für Craft-CMS-Projekte. Neue Projekte entstehen als Kopie dieses Repos.

<!-- toolkit:start -->
<!-- toolkit:end -->

Das Markenpaar bleibt hier **absichtlich leer**. Es ist der Platzhalter, den ein abgeleitetes Projekt erbt und den dessen erster `copy`-Lauf aus der eigenen Toolkit-Version füllt. So steht der Text nur einmal unter Versionskontrolle — im Toolkit — statt zusätzlich hier als Schnappschuss, der ohnehin überschrieben würde. Der Sync erkennt dieses Repo und lässt die Marken deshalb leer, auch wenn hier `copy` läuft.

## Nur für diese Vorlage

Änderungen hier landen in **allen künftigen** Projekten, aber in keinem bestehenden — ein abgeleitetes Projekt ist eine Kopie, kein Abonnement. Was auch bestehende Projekte erreichen soll, gehört stattdessen ins Toolkit: `CLAUDE.project.md` für alle, `CLAUDE.craftcms.md` für Craft. Von dort wird es mit dem nächsten Release verteilt und erscheint beim Versions-Bump im geerbten Block oben.

## Keine Versionen, kein Changelog

Der Releases-Abschnitt der globalen Konventionen gilt für Websites aus dieser Vorlage **nicht**. Er ist für Pakete geschrieben; eine Website hat keine Konsumenten, die ein Changelog lesen würden. `package.json` bleibt auf `1.0.0`, es gibt keine Tags, und `scripts/deploy.js` lädt bloss `templates/`, `web/` und `cronjobs/` hoch.

**Die Dokumentation ist die Git-Historie.** Der Fliesstext der Commit-Messages trägt deshalb die volle Last: das Warum, die verworfene Alternative, das, was nebenbei kaputtging oder auffiel. Eine Zweitschrift in einer Datei würde beim ersten vergessenen Deployment auseinanderdriften.

## Bildtransforms

Drei Dateien sind generiert, nicht gepflegt: `config/imager-x-transforms.php`, `config/imager-x-generate.php` und `docs/bildquellen.md`. Alle drei schreibt `ddev npm run generate-transforms` in einem Lauf. Er ist nach jeder Änderung an einem `macros.picture`-Aufruf fällig und hängt an keinem Build-Schritt — ein vergessener Lauf fällt erst am Diff auf, der die Twig-Änderung ohne Config-Änderung zeigt.

**Jeder `macros.picture`-Aufruf trägt auf der Zeile unmittelbar davor seine Bildquelle:** `{# bildquelle: entryType.feld #}`, mehrere kommagetrennt. Sie benennt, wo das Bild *gespeichert* ist, nicht wo es gerendert wird. Deklariert wird, weil der Speicherort aus dem Twig nicht zuverlässig ableitbar ist: `entry` wird in Modulen überschrieben, Schleifen iterieren selbstgebaute Arrays. Der Generator prüft jede Deklaration gegen die Project Config und schreibt bei einem Fehler nichts. Die Warnungen darunter nennen Assets-Felder ohne Bildquelle.

**Rendert ein Aufruf nur verknüpfte Elemente, sagt es das `via`:** `projekte.bild via angebot.projekte` heisst „Projekte, die ein Angebot in seinem Entries-Feld `projekte` verknüpft“ und wird zu einem `relatedTo`-Filter in der Regel. Ohne `via` bekämen alle Einträge des Typs das Format, auch die nie verknüpften. Bewusste Lücke: Wer die Verknüpfung setzt, speichert das verknüpfende Element, nicht das Bild tragende — Imager X reagiert nur auf Letzteres. Die Ableitung entsteht dann beim nächsten Speichern oder beim ersten Seitenaufruf.

**Bilder ohne `macros.picture`-Aufruf** deklariert eine Standalone-Zeile dort, wo sie gerendert werden: `{# bildquelle: *.openGraphBild = seomateImage, seomateOgImage, seomateTwitterImage #}` über dem SEOMate-Hook in `_layout.twig`. `*` heisst jeder Entry-Type mit dem Feld und wird zum `fields`-Block der Generate-Config. Die drei `seomate*`-Transforms lesen ihre Masse zur Laufzeit aus `imageTransformMap` in `config/seomate.php` — deshalb steht die Map dort explizit und nicht als Plugin-Default: Sie bestimmt Imagers Dateinamen, und nur mit identischen Massen ohne eigene `configOverrides` trifft die Vorgenerierung die Datei, die SEOMate im `<head>` verlinkt.

Die Generate-Regeln stehen **pro Entry-Type, nicht pro Section**: Matrix-Bausteine sind in Craft 5 eigene Entries und lösen beim Speichern ihr eigenes Event aus. Damit erübrigen sich Matrix-Pfade — die Pfad-Syntax von Imager X könnte ohnehin weder Relationen noch eine zweite Matrix-Ebene ausdrücken, und ungültige Pfade scheitern still. Die Config wirkt nur auf künftige Speichervorgänge. **Bestand nachziehen über Werkzeuge → Bildformate** (`modules/cp/BildformateUtility.php`): Die Seite liest die Entry-Types aus der generierten Generate-Config und legt je Typ einen Craft-eigenen Resave-Job in die Queue; jeder gespeicherte Eintrag löst dann die Imager-Regeln aus. Ohne CP geht dasselbe per `ddev craft resave/entries --type=<entryType>`.

## Worttrennung

Der Twig-Filter `wordBreaks` (`modules/twig/WordBreakExtension.php`) übersetzt `--` in einen bedingten Trennstrich und `__` in ein geschütztes Leerzeichen. Er wirkt **pro Ausgabestelle, nicht global** — jede neue Textausgabe aus einem CKEditor- oder PlainText-Feld braucht ihn erneut.
