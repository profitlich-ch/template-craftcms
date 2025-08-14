/**
 * ESM gulpfile.mjs nach https://gist.github.com/noraj/007a943dc781dc8dd3198a29205bae04
 * 
 * DEV / STAGING/ PRODUCTION
 * dev runs on the local ddev machine
 * staging uploads to staging server
 * production omits als dev content (JS, CSS), deletes console.log, compresses CSS and JS and uploads to live website
 * 
 * FILE NAMING CONVENTIONS
 * _*.* files will become part of a higher level file (e. g. the overall style.css) and not saved as a stand-alone file
 * files without underscore will be compiled to a single file (e. g. style.css or map.js)
 * 
 */

const { src, dest, task, series, parallel } = gulp;

import { deleteAsync } from 'del';

import concat from 'gulp-concat';
import dartSass from 'sass';
import dotenv from 'gulp-dotenv';
import fs from 'fs';
import ftp from 'basic-ftp';
import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import injectCSS from 'gulp-inject-css';
import jsonToJs from 'gulp-json-to-js';
import log from 'fancy-log';
import path from 'path';
import prompt from 'gulp-prompt';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import streamifier from 'streamifier';
import svgo from 'gulp-svgo';
import svgSprite from 'gulp-svg-sprite';
import through from 'through2';

/**
 * CONFIGURATION
 */
const config = { 
    configToScss: {
        src: 'src/config.json',
        dest: 'src/scss',
    },
    configToJs: {
        src: 'src/config.json',
        dest: 'src/js',
    }
}

/**
 * FILE PATHS
 * file paths need to set in a function as they are dependent on the modus
 * the setFiles function is called after the modus is set
 */
var files;
function setFiles() {
    files = { 
        src: {
            src: 'src/**/*.*',
        },
        jsConfig: {
            src: 'src/js/config.js',
            dest: 'templates/js',
        },
        templatesTwig: {
            src: 'src/templates/**/*.twig',
            dest: 'templates',
        },
        modulesTwig: {
            src: 'src/modules/**/*.+(twig|js)',
            dest: 'templates/_modules',
        },
        modulesAssets: {
            src: ['src/modules/**/*.+(svg|jpg|jpeg|gif|png|html)', '!src/modules/**/_*.*'],
            dest: 'web/modules',
        },
        // http://glivera-team.github.io/svg/2019/03/15/svg-sprites-2.en.html
        sprites: {
            src: 'src/modules/**/_*.svg',
            dest: 'web/sprites',
        },
        macrosFunctions: {
            src: 'src/macros-functions/**/*.twig',
            dest: 'templates/_macros-functions',
        },
        fonts: {
            src: 'src/fonts/**/*.*',
            dest: 'web/fonts',
        },
        favicon: {
            src: 'src/favicon/**/*.*',
            dest: 'web/favicon',
        },
        uploadWeb: {
            src: ['web/**/**.*', '!web/assets/**/**.*', '!web/cpresources/**/**.*', '!web/index.php'],
            dest: '/web'
        },
        uploadTemplates: {
            src: 'templates/**/*.*',
            dest: '/templates'
        },
        craftCustomConfig: {
            src: 'config/custom.php',
            dest: 'config',
        },
        uploadCraftConfig: {
            src: 'config/*.php',
            dest: '/config',
        },
        uploadCronjobs: {
            src: 'cronjobs/**/*',
            dest: '/cronjobs',
        },
    }
}

/**
 * 
 * Dotenv to JSON
 * The Dotenv includes FTP logn data and is therefor emade available to Gulp as an JS file
 */
function dotenvToJsonTask() {
    return src('./.env')
    .pipe(dotenv())
    .pipe(rename('env.json'))
    .pipe(gulp.dest('.'));
}

/**
 * 
 * config.json to JS
 * breakpoints are set in the config.json and made available to JS-breakpoints via a config.js file
 */
function configToJsTask() {
    return src(config.configToJs.src)

    .pipe(jsonToJs())

    .pipe(dest
        (config.configToJs.dest)
    )   
}

/**
 * set modus through prompt
 * First the variable modus is set to dev/staging/production
 * Then (through Gulp series task) the modusConfirmTask() is called
 */
var modus;
function modusTask() {
    return src('.')
	
    .pipe(prompt.prompt({
        type: 'list',
		name: 'modus',
		message: 'Please choose mode',
        choices: ['dev', 'staging', 'production']
	}, function(res){
        modus = res.modus;
	}))
}

/**
 * If modus is production, a confirmation is prompted, then the setFiles() task is called
 * otherwise the setFiles() taks is called directly
 */
var modusConfirmed = false;
function modusConfirmTask() {
    if (modus == 'production') {
        return src('.')
        .pipe(prompt.prompt({
            type: 'confirm',
            name: 'confirm',
            default: false,
            message: 'Really?'
        }, function(res){
            if (res.confirm == true) {
                modusConfirmed = true;
                setFiles();
            } else {
                
            }
        }));
    } else {
        modusConfirmed = true;
        setFiles();
        return src('.')
    }
}

/**
 * 
 * Delete config derivate files
 * config.js and scss and env.json are temporary and will therefore be deleted
 */
function deleteConfigTask() {
    return deleteAsync(['src/scss/config.scss', 'src/js/config.js', 'env.json']);
}

// compile JS config
function jsConfigTask() {
    return src(files.jsConfig.src)

    // combine files into one file
    .pipe(concat('config.js'))

    .pipe(dest
        (files.jsConfig.dest)
    )
    
    // write files
    .pipe(dest
        (files.jsConfig.dest)
    )
}

// copy twig templates
function templatesTwigTask() {
    return src(files.templatesTwig.src)

    .pipe(dest
        (files.templatesTwig.dest)
    );
}

// copy twig modules
function modulesTwigTask() {
    return src(files.modulesTwig.src)

    .pipe(dest
        (files.modulesTwig.dest)
    );
}

// copy module asstes
function modulesAssetsTask() {
    return src(files.modulesAssets.src, { encoding: false })

    .pipe(dest
        (files.modulesAssets.dest)
    );
}

// build SVG sprites
function spritesTask() {
    return src(files.sprites.src)

    // optimize SVG
    .pipe(svgo())

    // build svg sprite
    .pipe(svgSprite({
        mode: {
            symbol: {
                sprite: "../sprite.svg"
                // The following lines take an SCSS file to define SVG properties
                // ,
                // render: {
                //     scss: {
                //         dest:'../../../sass/_sprite.scss',
                //         template: assetsDir + "sass/templates/_sprite_template.scss"
                //     }
                // }
            }
        },
        shape: {
            id: {
                generator: function(name) {
                    separator: "--";
                    // The basename comprises of the SVG’s folder and its filename, connected by a separator
                    // The basename gets converted to an array and just the last part (filename) is used
                    // The underscore of the filename is omitted
                    return path.basename(name.split(path.sep).pop().substring(1).replace(/\s+/g, this.whitespace), '.svg');
                }
            }
        }
    }))

    .pipe(dest
        (files.sprites.dest)
    );
}

// copy macros
function macrosFunctionsTask() {
    return src(files.macrosFunctions.src)

    .pipe(dest
        (files.macrosFunctions.dest)
    );
}

// copy fonts
function fontsTask() {
    return src(files.fonts.src)

    .pipe(dest
        (files.fonts.dest)
    );
}

// copy favicon
function faviconTask() {
    return src(files.favicon.src)

    .pipe(dest
        (files.favicon.dest)
    );
}

// FTP
async function uploadFilesToFTP(files, folder) {
    var env = JSON.parse(fs.readFileSync("env.json"));
    var ftpModus = modus.toUpperCase();
    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
        // open FTP connection
        await client.access({
            host:env['FTP_HOST_' + ftpModus],
            user:env['FTP_USER_' + ftpModus],
            password:env['FTP_PASSWORD_' + ftpModus],
            secure: false
        });

        // copy file consecutively
        for (const file of files) {
            // convert buffer to stream
            const stream = streamifier.createReadStream(file.contents);
            await client.ensureDir(`${folder}/${path.dirname(file.relative)}`);
            await client.uploadFrom(stream, `${folder}/${file.relative}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        // close connection
        client.close();
    }
}

function uploadTemplatesTask() {
    if (modus !='dev') {
        const filesToUpload = [];

        return src(files.uploadTemplates.src)
        .pipe(through.obj(function (file, enc, cb) {
            if (file.isBuffer()) {
                // push file to array
                filesToUpload.push(file);
            }
            // return file for next gulp step
            cb(null, file);
        }))
        .on('end', async function () {
            // start upload after all files are gathered
            await uploadFilesToFTP(filesToUpload, files.uploadTemplates.dest);
        });
    } else {
        return src(files.uploadTemplates.src)
    }
};
function uploadWebTask() {
    if (modus !='dev') {
        const filesToUpload = [];

        // dot.true uploads hidden files and folder, this is necessary for the Vite manifest file
        return src(files.uploadWeb.src, { encoding: false, dot: true })
        .pipe(through.obj(function (file, enc, cb) {
            if (file.isBuffer()) {
                // push file to array
                filesToUpload.push(file);
            }
            // return file for next gulp step
            cb(null, file);
        }))
        .on('end', async function () {
            // start upload after all files are gathered
            await uploadFilesToFTP(filesToUpload, files.uploadWeb.dest);
        });
    } else {
        return src(files.uploadWeb.src)
    }
};
function uploadCraftConfigTask() {
    if (modus !='dev') {
        const filesToUpload = [];
        
        return src(files.uploadCraftConfig.src)
        .pipe(through.obj(function (file, enc, cb) {
            if (file.isBuffer()) {
                // push file to array
                filesToUpload.push(file);
            }
            // return file for next gulp step
            cb(null, file);
        }))
        .on('end', async function () {
            // start upload after all files are gathered
            await uploadFilesToFTP(filesToUpload, files.uploadCraftConfig.dest);
        });
    } else {
        return src(files.uploadCraftConfig.src )
    }
};
function uploadCronjobs() {
    if (modus !='dev') {
        const filesToUpload = [];
        
        return src(files.uploadCronjobs.src)
        .pipe(through.obj(function (file, enc, cb) {
            if (file.isBuffer()) {
                // push file to array
                filesToUpload.push(file);
            }
            // return file for next gulp step
            cb(null, file);
        }))
        .on('end', async function () {
            // start upload after all files are gathered
            await uploadFilesToFTP(filesToUpload, files.uploadCronjobs.dest);
        });
    } else {
        return src(files.uploadCronjobs.src )
    }
};


// inject CSS
function injizierenTask() {
    return src('templates/**/*.{html,twig}')
    .pipe(injectCSS())
    .pipe(dest('templates'));
}

// monitor changes
function watchTask() {
    const watchVariable = gulp.watch(
        [files.src.src, '!src/scss/config.scss', '!src/js/config.js'],
        gulp.series(
            dotenvToJsonTask,
            configToJsTask,
            gulp.parallel(
                templatesTwigTask, modulesTwigTask, modulesAssetsTask, macrosFunctionsTask, jsConfigTask, fontsTask, faviconTask, spritesTask
            ),
            injizierenTask,
            parallel(
                uploadTemplatesTask, uploadWebTask, uploadCraftConfigTask, uploadCronjobs
            ),
            deleteConfigTask
        )
    );
}

task('build',
    series(
        dotenvToJsonTask,
        configToJsTask,
        modusTask,
        modusConfirmTask,
        parallel(
            templatesTwigTask, modulesTwigTask, modulesAssetsTask, macrosFunctionsTask, jsConfigTask, fontsTask, faviconTask, spritesTask
        ),
        injizierenTask,
        parallel(
            uploadTemplatesTask, uploadWebTask, uploadCraftConfigTask, uploadCronjobs
        ),
        deleteConfigTask,
        watchTask
    )
);

task('build').description = 'compile files';

// create default task
task('default', series('build'));
task('default').description = 'default task';