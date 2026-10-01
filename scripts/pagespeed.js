import { run } from '@profitlich/template-toolkit/scripts/pagespeed';

// Je eine Seite pro Template mit schwerem Inhalt ergänzen: Videos, grosse
// Bilder, viele Module.
run([
    { name: 'Startseite', path: '/' },
], { thresholds: { mobile: 85, desktop: 95 } });
