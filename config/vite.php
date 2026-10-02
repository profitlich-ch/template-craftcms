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
    // Hängt an jedes Skript-Tag ein onload, das ein Event feuert. Niemand hört
    // darauf, und es landet mit jedem Modul-Skript im kritischen Pfad.
    'includeScriptOnloadHandler' => false,
    'errorEntry' => 'src/App.js',
    'debug' => App::env('CRAFT_ENVIRONMENT') === 'dev',
];