import { run } from '@profitlich/template-toolkit/scripts/copy-files';

const copyTasks = [
    {
        name: 'templatesTwig',
        src: ['src/templates/**/*.twig'],
        dest: 'templates',
        base: 'src/templates'
    },
    {
        name: 'macrosTwig',
        src: ['src/macros/**/*.twig'],
        dest: 'templates/_macros',
        base: 'src/macros'
    },
    {
        name: 'modulesTwig',
        src: ['src/modules/**/*.twig'],
        dest: 'templates/_modules',
        base: 'src/modules'
    },
    {
        name: 'fonts',
        src: ['src/fonts/**/*.*'],
        dest: 'web/fonts',
        base: 'src/fonts'
    },
    {
        name: 'favicon',
        src: ['src/favicon/**/*.*'],
        dest: 'web/favicon',
        base: 'src/favicon'
    },
];

run(copyTasks, { template: 'craftcms' });
