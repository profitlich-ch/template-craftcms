<?php

return [
    // TODO: Website-Namen eintragen
    'siteName' => 'PROJECT NAME',
    'altTextFieldHandle' => 'seoBildbeschreibung',
    'sitenameSeparator' => '–',

    'defaultProfile' => 'default',

    'validImageExtensions' => ['jpg', 'jpeg', 'gif', 'png', 'webp'],

    // Explizit statt Plugin-Default: Die Masse bestimmen Imagers Dateinamen, und
    // config/imager-x-transforms.php leitet daraus die seomate*-Transforms ab,
    // damit die Vorgenerierung dieselben Dateien trifft wie SEOMate im <head>.
    'imageTransformMap' => [
        'image' => ['width' => 1200, 'height' => 675, 'format' => 'jpg'],
        'og:image' => ['width' => 1200, 'height' => 630, 'format' => 'jpg'],
        'twitter:image' => ['width' => 1200, 'height' => 600, 'format' => 'jpg'],
    ],

    'defaultMeta' => [
        'title' => ['title'],
        'description' => ['seoMetaDescription'],
        'image' => ['openGraphBild'],
    ],

    'profileMap' => [
        'startseite' => 'startseite',
    ],

    'fieldProfiles' => [
        'default' => [
            'title' => ['title'],
            'description' => ['seoMetaDescription'],
            'image' => ['openGraphBild'],
        ],
        // Auf der Startseite steht nur der Website-Name im Titel
        'startseite' => [
            'title' => [],
            'description' => ['seoMetaDescription'],
            'image' => ['openGraphBild'],
        ],
    ],

    'sitemapEnabled' => true,
    'sitemapLimit' => 100,
    'sitemapConfig' => [
        'elements' => [
            'startseite' => ['changefreq' => 'weekly', 'priority' => 1],
        ],
    ],
];
