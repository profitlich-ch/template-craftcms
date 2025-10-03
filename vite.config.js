import { defineConfig, loadEnv } from 'vite';
import * as fs from 'fs';
import * as path from 'path';


// Match ports in .ddev/config.yaml and config/vite.php
const HTTPS_PORT = 5173;
const configJson = JSON.parse(fs.readFileSync('./src/config.json', 'utf8'));
const scssVariables = jsonToScssVariables(configJson);
const scssConfigPath = path.resolve(__dirname, 'src/scss/_config.scss');
fs.writeFileSync(scssConfigPath, scssVariables, 'utf8');
console.log('SCSS config file generated at:', scssConfigPath);

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        root: './', // Standard ist das Projektverzeichnis
        // In dev mode, we serve assets at the root of https://my.ddev.site:3000
        // In production, files live in the /dist directory
        base: command === 'serve' ? '' : '/dist/',
        build: {
            manifest: true,
            outDir: './web/dist/',
            sourcemap: mode === 'development',
            minify: 'terser',
            ssMinify: 'lightningcss',
            terserOptions: {
                compress: {
                    // Entfernt alle console.log-Anweisungen
                    drop_console: true,
                },
                format: {
                    // Entfernt alle Kommentare
                    comments: false,
                },
            },
            rollupOptions: {
                input: {
                    appCss: 'src/app.scss',
                    app: 'src/App.ts',
                    dev: 'src/Dev.ts',
                    devToolbar: 'src/dev/dev-toolbar/DevToolbar.ts',
                    error: 'src/modules/error/Error.ts',
                    menu: 'src/modules/menu/Menu.ts',
                },
            },
        },
        server: {
            host: '0.0.0.0',
            port: HTTPS_PORT,
            strictPort: true,
            origin: `${env.PRIMARY_SITE_URL.replace(/:\d+$/, "")}:${HTTPS_PORT}`,
            cors: {
                origin: /https?:\/\/([A-Za-z0-9\-\.]+)?(\.ddev\.site)(?::\d+)?$/,
            },
            watch: {
                ignored: [
                    '**/node_modules/**',
                    '**/vendor/**',
                ],
            },
        },
    };
});

/**
 * Checks whether a string is a valid CSS color value
 * @param {string} str - string to be evaluated
 * @returns {boolean}
 */
function isColor(str) {
    if (typeof str !== 'string') return false;
    // Checks for hex, rgb, rgba, hsl, hsla and color names
    const colorRegex = /^(#([0-9a-f]{3}){1,2}|(rgb|rgba|hsl|hsla)\(.*\)|[a-z]+)$/i;
    return colorRegex.test(str.trim());
}

/**
 * Helper function that recursively converts a JSON Object into an SCSS string
 * @param {object} obj - JavaScript object to be converted
 * @returns {string} - a string representing a SCSS map
 */
function objectToScssMap(obj) {
    let scssMap = '(';
    const keys = Object.keys(obj);
    keys.forEach((key, index) => {
        const value = obj[key];
        scssMap += `"${key}": `;
        if (typeof value === 'object' && value !== null) {
            scssMap += objectToScssMap(value);
        } else if (typeof value === 'string' && !isColor(value)) {
            // strings are put into paranthesis unless they are colors
            scss += `"${value}"`;
        } else {
            scssMap += value;
        }
        if (index < keys.length - 1) {
            scssMap += ', ';
        }
    });
    scssMap += ')';
    return scssMap;
}

/**
 * Converts the main JSON objext into single SCSS variables
 * @param {object} json - the read JSON objekt
 * @returns {string} - a string containing all SCSS variables
 */
function jsonToScssVariables(json) {
    let scss = '';
    for (const key in json) {
        // Ignore the README key as it is not a configuration variable
        if (key === 'README') {
            continue;
        }

        const value = json[key];
        scss += `$${key}: `;

        if (typeof value === 'object' && value !== null) {
            // Nested objects become SCSS maps
            scss += objectToScssMap(value);
        } else if (typeof value === 'string' && !isColor(value)) {
            // strings are put into paranthesis unless they are colors
            scss += `"${value}"`;
        } else {
            // numbers and other primitive types will be used directly without conversion
            scss += value;
        }
        scss += ';\n';
    }
    return scss;
}