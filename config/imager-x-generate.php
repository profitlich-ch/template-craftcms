<?php

// Generiert von scripts/generate-transforms.js — nicht bearbeiten.
// Quelle sind die {# bildquelle: … #}-Deklarationen in src/. Eine Regel je
// Entry-Type: Matrix-Bausteine sind in Craft 5 eigene Entries und lösen beim
// Speichern ihr eigenes Event aus, deshalb braucht es weder Section-Listen
// noch Matrix-Pfade. Ein relatedTo-Filter kommt aus „via entryType.feld“,
// der fields-Block aus Standalone-Deklarationen „*.feld = transform“.

return [
    'elements' => [
        [
            'elementType' => \craft\elements\Entry::class,
            'criteria' => ['type' => 'startseite'],
            'fields' => ['projektbilder'],
            'transforms' => ['startseite'],
        ],
    ],
    'fields' => [
        'openGraphBild' => ['seomateImage', 'seomateOgImage', 'seomateTwitterImage'],
    ],
];
