import { run } from 'profitlich-template-toolkit/scripts/deploy';

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
            'web/index.php'
        ],
        localBase: 'web',
        remoteDir: '/web'
    },
    {
        name: 'Cronjobs',
        localPattern: 'src/cronjobs/**/*',
        localBase: 'cronjobs',
        remoteDir: '/cronjobs'
    }
];

run(uploadTasks);
