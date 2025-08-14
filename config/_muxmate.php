<?php

use craft\helpers\App;

return [
    'muxAccessTokenId' => App::env('MUX_TOKEN_ID'),
    'muxSecretKey' => App::env('MUX_TOKEN_SECRET'),
    // https://github.com/vaersaagod/muxmate?tab=readme-ov-file#override-your-volumes-file-system-base-url-in-local-environments-with-a-remote-tunnel
    'volumes' => [
        'projekte' => [
            'baseUrl' => App::env('VIDEOS_BASE_URL'),
        ],
    ],
];