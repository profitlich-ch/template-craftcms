<?php
    // https://craftcms.com/docs/4.x/config/#custom-settings
    
    /* Static Assets Versioning
        https://nystudio107.com/blog/simple-static-asset-versioning
        Je nach modus wird entweder eine fixe Nummer verwendet oder das aktuelle Datum.
        production: fixe Nummer. Die fixe Nummer wird per bei jedem Gulp Durchgang gesetzt. Die Fixe Nummer erlaubt Caching durch den Browser.
        dev und staging: aktuelles Datum, damit sicher bei jedem reload die CSS und JS Dateien neu geladen werden, der Cache wird umgangen.
    */
        return array(

        // All environments
        '*' => array(
            
        ),
        
        // production environment
        'production'  => array(
            'staticAssetsVersion' => 1752913633,
        ),

        // staging environment
        'staging'  => array(
            'staticAssetsVersion' => time(),
        ),

        // development environment
        'dev'  => array(
            'staticAssetsVersion' => time(),
        ),
    );

;