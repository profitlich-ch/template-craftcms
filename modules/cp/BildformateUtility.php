<?php

namespace modules\cp;

use Craft;
use craft\base\Utility;
use craft\elements\Entry;
use craft\events\RegisterComponentTypesEvent;
use craft\models\EntryType;
use craft\models\Section;
use craft\services\Utilities;
use modules\Modul;
use yii\base\Event;

/**
 * Werkzeug „Bildformate“: speichert alle Einträge der gewählten Entry-Types neu, damit
 * Imager X über seine Generate-Regeln die Bildformate vorab in die Queue legt.
 *
 * Die Regeln greifen nur beim Speichern. Für den Bestand und für Einträge, die erst
 * nachträglich über ein Entries-Feld verknüpft wurden („via“), braucht es diesen Anstoss. Welche
 * Entry-Types zur Wahl stehen, liest die Utility aus config/imager-x-generate.php —
 * die Datei ist generiert, die Liste hier pflegt sich damit von selbst.
 */
class BildformateUtility extends Utility
{
    public static function registrieren(): void
    {
        Event::on(
            Utilities::class,
            Utilities::EVENT_REGISTER_UTILITIES,
            function(RegisterComponentTypesEvent $event) {
                $event->types[] = self::class;
            }
        );
    }

    public static function displayName(): string
    {
        return 'Bildformate';
    }

    public static function id(): string
    {
        return 'bildformate';
    }

    public static function icon(): ?string
    {
        return 'images';
    }

    public static function contentHtml(): string
    {
        return Craft::$app->getView()->renderTemplate(Modul::TEMPLATE_ROOT . '/bildformate', [
            'entryTypes' => self::entryTypes(),
        ]);
    }

    /**
     * Entry-Types, für die eine Generate-Regel existiert, mit Kontext und Anzahl.
     *
     * @return array<string, array{name: string, kontext: string, anzahl: int}> Handle → Angaben
     */
    public static function entryTypes(): array
    {
        $config = Craft::$app->getConfig()->getConfigFromFile('imager-x-generate');
        $handles = [];

        foreach ($config['elements'] ?? [] as $regel) {
            $typ = $regel['criteria']['type'] ?? null;
            if (is_string($typ)) {
                $handles[$typ] = true;
            }
        }

        // Der fields-Block gilt global je Feld-Handle: jeder Entry-Type, der das Feld trägt.
        foreach (array_keys($config['fields'] ?? []) as $feldHandle) {
            foreach (Craft::$app->getEntries()->getAllEntryTypes() as $entryType) {
                if ($entryType->getFieldLayout()->getFieldByHandle($feldHandle) !== null) {
                    $handles[$entryType->handle] = true;
                }
            }
        }

        $liste = [];
        foreach (array_keys($handles) as $handle) {
            $entryType = Craft::$app->getEntries()->getEntryTypeByHandle($handle);
            if (!$entryType) {
                continue;
            }
            $liste[$handle] = [
                'name' => $entryType->name,
                'kontext' => self::kontext($entryType),
                'anzahl' => Entry::find()->type($handle)->status(null)->count(),
            ];
        }
        ksort($liste);

        return $liste;
    }

    // Sections, die den Typ führen; ohne Section ist er ein Baustein in einem Matrix-Feld.
    private static function kontext(EntryType $entryType): string
    {
        $sections = array_filter($entryType->findUsages(), fn($nutzer) => $nutzer instanceof Section);
        if ($sections === []) {
            return 'Baustein';
        }

        return implode(', ', array_map(fn(Section $s) => $s->name, $sections));
    }
}
