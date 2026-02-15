import ftp from 'basic-ftp';
import dotenv from 'dotenv';
import { glob } from 'glob';
import path from 'path';
import readline from 'readline';
import cliProgress from 'cli-progress';

// Helper for making sure the upload progress bars go to 100%
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// get mode from command line
const mode = process.argv[2];
if (!mode || (mode !== 'staging' && mode !== 'production')) {
    console.error('Error: a mode needs to be given, either "staging" or "production"');
    process.exit(1);
}

dotenv.config();
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

async function runDeploy() {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    let activeProgressBar = null;

    try {
        const modeUpper = mode.toUpperCase(); // "staging" -> "STAGING"
        console.log(`🚀 Starting geployment for: ${modeUpper}`);

        await client.access({
            host: process.env[`FTP_HOST_${modeUpper}`],
            user: process.env[`FTP_USER_${modeUpper}`],
            password: process.env[`FTP_PASSWORD_${modeUpper}`],
            secure: true
        });

        for (const task of uploadTasks) {
            console.log(`\nProcessing Task: ${task.name}`);

            const files = await glob(task.localPattern, {
                nodir: true,
                dot: true,
                ignore: task.ignore
            });

            if (files.length === 0) {
                console.log('No files found for this task.');
                continue;
            }

            const newBar = new cliProgress.SingleBar({
                format: '  Upload |{bar}| {percentage}%   {value}/{total} files   {duration_formatted}',
                barCompleteChar: '█',
                barIncompleteChar: '░',
                hideCursor: true
            });

            activeProgressBar = newBar;
            activeProgressBar.start(files.length, 0);

            for (const file of files) {
                const relativeFile = path.relative(task.localBase, file);
                const remotePath = path.join(task.remoteDir, relativeFile).replace(/\\/g, '/');

                await client.ensureDir(path.dirname(remotePath));
                await client.uploadFrom(file, remotePath);

                activeProgressBar.increment();
            }

            activeProgressBar.stop();
            activeProgressBar = null;
            await delay(50);
            // console.log(`  -> ✅ Task '${task.name}' completed, ${files.length} files uploaded.`);
        }

        console.log('\n✅ Deployment completed successfully!');

    } catch (err) {
        if (activeProgressBar) {
            activeProgressBar.stop();
        }
        console.error('Deployment failed:', err);
    } finally {
        client.close();
    }
}

function start() {
    // In production mode prompt for confirmation
    if (mode === 'production') {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('🔴 Do yu really want to deploy to PRODUCTION? Type "yes" for confirmation: ', (answer) => {
            rl.close();
            if (answer.toLowerCase() === 'yes') {
                console.log('Confirmed. Starting upload...');
                runDeploy();
            } else {
                console.log('❌ Deployment abortd.');
                process.exit(0);
            }
        });
        // In all other modes run deploy without prompt
    } else {
        runDeploy();
    }
}

start();