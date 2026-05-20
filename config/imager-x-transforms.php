<?php

return [
    'projects' => [
        'displayName' => 'Projects',
        'transforms' => [
            ['width' => 600],
            ['width' => 3000],
        ],
        'defaults' => [
            'format' => 'webp',
        ],
        'configOverrides' => [
            'fillTransforms' => true,
            'fillInterval' => 300,
        ]
    ],
];