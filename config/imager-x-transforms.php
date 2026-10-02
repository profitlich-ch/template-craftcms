<?php

// Die seomate*-Einträge am Ende lesen ihre Masse aus config/seomate.php,
// damit Vorgenerierung und SEOMate dieselbe Datei erzeugen.
$seomate = require __DIR__ . '/seomate.php';
$seoMap = $seomate['imageTransformMap'] ?? throw new \RuntimeException('config/seomate.php ohne imageTransformMap — die seomate*-Transforms brauchen sie.');

return [
    'startseite' => [
        'displayName' => 'Startseite',
        'transforms' => [
            ['width' => 660],
            ['width' => 2560],
        ],
        'defaults' => [
            'format' => 'webp',
        ],
        'configOverrides' => [
            'fillTransforms' => true,
            'fillInterval' => 300,
        ]
    ],
    'seomateImage' => [
        'displayName' => 'SEOMate image',
        'transforms' => [$seoMap['image']],
    ],
    'seomateOgImage' => [
        'displayName' => 'SEOMate og:image',
        'transforms' => [$seoMap['og:image']],
    ],
    'seomateTwitterImage' => [
        'displayName' => 'SEOMate twitter:image',
        'transforms' => [$seoMap['twitter:image']],
    ],
];
