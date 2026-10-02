import { defineConfig, loadEnv } from 'vite';
import manifestSRI from 'vite-plugin-manifest-sri'
import VitePluginSvgSpritemap from '@spiriit/vite-plugin-svg-spritemap'
import { defineDebug, buildOptions, serverOptions, scssOptions } from '@profitlich/template-toolkit/vite/config';
import * as fs from 'fs';

const configJson = JSON.parse(fs.readFileSync('./src/config.json', 'utf8'));

export default defineConfig(async ({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        root: './',
        // In dev mode, we serve assets at the root of https://my.ddev.site:5173
        // In production, files live in the /dist directory
        base: command === 'serve' ? '' : '/dist/',
        define: defineDebug(mode),
        build: {
            ...buildOptions({ mode, outDir: './web/dist/' }),
            rollupOptions: {
                input: {
                    app: 'src/App.js',
                    dev: 'src/Dev.js',
                    error: 'src/modules/error/Error.js',
                    menu: 'src/modules/menu/Menu.js',
                },
            },
        },
        // Port muss zu .ddev/config.yaml und config/vite.php passen (Vorgabe 5173)
        server: serverOptions({ env }),
        css: {
            preprocessorOptions: {
                scss: await scssOptions({ configJson }),
            },
        },
        plugins: [
            manifestSRI(),
            VitePluginSvgSpritemap('./src/**/_*.svg', {
                svgo: true,
                gutter: 10,
                output: './web/sprites/sprites.svg',
            }),
        ],
    };
});
