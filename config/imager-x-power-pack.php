<?php

return [
    'lazysizes' => false,
    // Breite des dekodierten Blurhash-PNGs. Der Default 16 kann die 10 X-Kom-
    // ponenten aus `imager-x.php` nicht auflösen — die Verläufe verschwinden,
    // und das Hochskalieren des Mini-Bildes wird als Raster sichtbar.
    'placeholderSize' => 40,
];