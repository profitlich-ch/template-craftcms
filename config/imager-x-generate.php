<?php

return [
    'volumes' => [
        'projektbilder' => ['projects'],
    ],
    'elements' => [
        [
            'elementType' =>  \craft\elements\Entry::class,
            'criteria' => [
                'section' => 'projekte',
            ],
            'fields' => ['bild'],
            'transforms' => ['projects']
        ]
    ],
];