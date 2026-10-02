import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        // Erzeugtes und Fremdes: templates/ entsteht aus src/, web/ enthält den
        // Build, vendor/ die Composer-Pakete. Fehler gehören in die Quelle.
        //
        // config/ckeditor/* sind trotz .js-Endung keine Module, sondern
        // Konfigurationsfragmente, die Craft mit einem blossen `return {…}`
        // einliest — als Modul geparst ergibt das einen Syntaxfehler.
        ignores: [
            'templates/**',
            'web/**',
            'vendor/**',
            'storage/**',
            'logs/**',
            'config/ckeditor/**',
        ],
    },

    js.configs.recommended,

    {
        // Frontend: läuft im Browser
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                // Von Vite per `define` zur Bauzeit ersetzt, siehe vite.config.js
                __DEBUG__: 'readonly',
            },
        },
        rules: {
            // Der eigentliche Anlass für den Linter (QS-E3): zugewiesene Werte,
            // die niemand liest. Ungenutzte Funktionsargumente bleiben erlaubt,
            // solange danach noch benutzte folgen — Event-Handler mit
            // (event, index) sind sonst nicht schreibbar.
            'no-unused-vars': ['error', { args: 'after-used' }],
            'no-unused-private-class-members': 'error',
        },
    },

    {
        // Build- und Deploy-Skripte: laufen in Node
        files: ['scripts/**/*.js', '*.config.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.node,
        },
    },
];
