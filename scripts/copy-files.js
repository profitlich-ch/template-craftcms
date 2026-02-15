import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';
import chokidar from 'chokidar';

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

async function runTask(task) {
    const files = await glob(task.src, { nodir: true, dot: true });
    if (files.length === 0) return;

    for (const file of files) {
        const relativePath = path.relative(task.base, file);
        const destPath = path.join(task.dest, relativePath);
        await fs.copy(file, destPath);
    }
}

async function copyAll() {
    console.log('🚀 Starting initial copy of all files...');
    // empty folders to prevent orphaned files
    for (const task of copyTasks) {
        await fs.emptyDir(task.dest);
    }
    // run tasks parallely
    await Promise.all(copyTasks.map(task => runTask(task)));
    console.log('✅ Initial copy complete.');
}

function watchFiles() {
    console.log('👀 Watching for file changes in src/');
    
    // set lock variable to prevent parallel copy tasks
    let isCopying = false;

    const watcher = chokidar.watch('src', { ignored: /(^|[\/\\])\../, persistent: true });

    watcher.on('all', async (event, filePath) => {
        if (['add', 'change', 'unlink'].includes(event)) {
            
            // only proceeed if copy job is not running
            if (isCopying) {
                return;
            }

            console.log(`[${event}] ${filePath}. Re-copying all files...`);
            
            // secure copy job with try...finally
            try {
                isCopying = true; // activate lock
                await copyAll();
            } catch (err) {
                console.error("Error during copy:", err);
            } finally {
                isCopying = false; // deactivate lock, allow new copy job
            }
        }
    });
}

const command = process.argv[2];
if (command === 'dev') {
    copyAll().then(watchFiles);
} else if (command === 'build') {
    copyAll();
}