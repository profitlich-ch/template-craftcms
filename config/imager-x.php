<?php

use craft\helpers\App;

$isDev = App::env('CRAFT_ENVIRONMENT') === 'dev';

return [
    // Fallback nur lokal: Wenn ein Transform fehlschlägt (z.B. weil die
    // Asset-Datei fehlt — typisch nach DB-Pull ohne Bilder vom Staging),
    // wird stattdessen dieses Bild transformiert und ausgeliefert.
    'fallbackImage' => $isDev ? '/placeholder.webp' : null,
    'blurhashComponents' => [10, 8], // [X-Komponenten, Y-Komponenten]
];
