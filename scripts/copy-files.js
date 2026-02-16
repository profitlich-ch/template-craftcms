import { run } from 'profitlich-template-toolkit/scripts/copy-files';

const copyTasks = [
    {
        name: 'templatesTwig',
        src: ['src/templates/**/*.twig'],
        dest: 'templates',
        base: 'src/templates' },
    {
        name: 'modulesTwig',
        src: ['src/modules/**/*.+(twig|js)'],
        dest: 'templates/_modules',
        base: 'src/modules' },
    {
        name: 'modulesAssets',
        src: ['src/modules/**/*.+(svg|jpg|jpeg|gif|png|html)', '!src/modules/**/_*.*'],
        dest: 'web/modules',
        base: 'src/modules'
    },
    {
        name: 'macrosFunctions',
        src: ['src/macros-functions/**/*.twig'],
        dest: 'templates/_macros-functions',
        base: 'src/macros-functions'
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

run(copyTasks);
