<?php

use craft\helpers\App;

// Use the current host for dev server requests. Otherwise fall back to the primary site.
$host = Craft::$app->getRequest()->getIsConsoleRequest()
    ? App::env('PRIMARY_SITE_URL')
    : Craft::$app->getRequest()->getHostInfo();

return [
    'checkDevServer' => false,
    'devServerInternal' => 'http://localhost:5173',
    // 'devServerPublic' => App::env('PRIMARY_SITE_URL') . ':5173',
    'devServerPublic' => 'https://192.168.1.183:5173',
    'serverPublic' => App::env('PRIMARY_SITE_URL') . '/dist/',
    'useDevServer' => App::env('CRAFT_ENVIRONMENT') === 'dev',
    'manifestPath' => '@webroot/dist/.vite/manifest.json',
    'includeScriptOnloadHandler' => true,
    'errorEntry' => 'src/js/app.ts',
];