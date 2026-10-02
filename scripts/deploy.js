import { run } from '@profitlich/template-toolkit/scripts/deploy';

const uploadTasks = [
    {
        name: 'Templates',
        localPattern: 'templates/**/*',
        localBase: 'templates',
        remoteDir: '/templates'
    },
    {
        name: 'Web',
        localPattern: 'web/**/*',
        ignore: [
            'web/assets/**',
            'web/cpresources/**',
            'web/imager/**',
            // Der lokale Blitz-Cache gehört nicht auf den Server: hunderte kleine
            // Dateien unter dem ddev-Hostnamen, die dort nie ausgeliefert werden.
            'web/cache/**',
            'web/index.php'
        ],
        localBase: 'web',
        remoteDir: '/web'
    },
    {
        name: 'Cronjobs',
        localPattern: 'cronjobs/**/*',
        localBase: 'cronjobs',
        remoteDir: '/cronjobs'
    }
];

run(uploadTasks, { parallel: 3 });
