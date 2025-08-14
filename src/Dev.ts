import { DevToolbar } from './dev/dev-toolbar/DevToolbar.ts';

class Dev {
    public devToolbar: DevToolbar;

    constructor() {
        this.devToolbar = new DevToolbar();
        this.initialize();
    }

    private initialize() {
        console.info('Dev initialized.');
    }
}

let dev: Dev;

document.addEventListener('DOMContentLoaded', () => {
    dev = new Dev();
});

export { dev };