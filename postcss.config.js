import postcssInputRange from 'postcss-input-range';
import postcssBreakpointDry from '@profitlich/template-toolkit/vite/postcssBreakpointDry';

export default {
    plugins: [postcssInputRange(), postcssBreakpointDry()],
};

// postcss-lightningcss ist bewusst nicht mehr eingebunden: Es lief nach Vites
// CSS-Transform und ersetzte dabei die Asset-Platzhalter durch die
// ursprünglichen, relativen Pfade. Aus `url(soehne-buch-<hash>.woff2)` wurde
// wieder `url(../fonts/soehne/soehne-buch.woff2)` — eine Adresse, unter der auf
// dem Server nichts liegt, weshalb alle drei Schriften nicht luden.
//
// Minifiziert wird weiterhin mit LightningCSS, aber über `cssMinify` in
// vite.config.js — also innerhalb der Vite-Pipeline statt daneben.