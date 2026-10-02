import { eslintConfig } from '@profitlich/template-toolkit/eslint/config';

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

    ...eslintConfig(),
];
