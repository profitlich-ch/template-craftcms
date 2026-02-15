import { DevToolbar } from './dev/dev-toolbar/DevToolbar.js';

class Dev {
    devToolbar;

    constructor() {
        this.devToolbar = new DevToolbar();
        this.#initialize();
    }

    #initialize() {
        console.info('Dev initialized.');
    }
}

let dev;

document.addEventListener('DOMContentLoaded', () => {
    dev = new Dev();
});

export { dev };
