<?php

use craft\helpers\App;

// Use the current host for dev server requests. Otherwise fall back to the primary site.
$host = Craft::$app->getRequest()->getIsConsoleRequest()
    ? App::env('PRIMARY_SITE_URL')
    : Craft::$app->getRequest()->getHostInfo();

return [
    'devServerInternal' => 'http://localhost:5173/',
    'devServerPublic' => preg_replace('/:\d+$/', '', App::env('PRIMARY_SITE_URL')) . ':5173',
    'checkDevServer' => false,
    'useDevServer' => App::env('ENVIRONMENT') === 'dev' || App::env('CRAFT_ENVIRONMENT') === 'dev',
    'serverPublic' => App::env('PRIMARY_SITE_URL') . '/dist/',
    'devMode' => App::env('CRAFT_ENVIRONMENT') === 'dev',
    'manifestPath' => '@webroot/dist/.vite/manifest.json',
    'includeScriptOnloadHandler' => true,
    'errorEntry' => 'src/App.js',
    'debug' => true,
];