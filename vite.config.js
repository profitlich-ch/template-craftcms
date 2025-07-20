import { defineConfig, loadEnv } from 'vite';

// Match ports in .ddev/config.yaml and config/vite.php
const HTTPS_PORT = 5173;

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
                    app: 'src/app.ts',
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