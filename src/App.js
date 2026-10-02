import config from './config.json' with { type: "json" };
import { MediaQueries } from '@profitlich/template-toolkit/utils/MediaQueries';
import { VwBody } from '@profitlich/template-toolkit/utils/VwBody';
import { BodyScrolled } from '@profitlich/template-toolkit/utils/BodyScrolled';
import { MenuToggle } from '@profitlich/template-toolkit/components/menu-toggle/MenuToggle';
import './scss/app.scss';

class App {
    constructor() {
        // Die Rückgabewerte werden nicht gebraucht: Alle diese Utilities hängen
        // ihre Listener im Konstruktor ein und arbeiten danach eigenständig.
        MediaQueries.getInstance(config.breakpoints);
        BodyScrolled.getInstance();
        VwBody.getInstance();

        MenuToggle.getInstance({
            menuButtonSelector: '#hamburger',
            menuSelector: '#menu',
            menuLinkSelector: '.menu__link',
            menuItemSelector: '.menu__link',
        });

        this.#initialize();
    }

    #initialize() {
        console.info('App initialized.');
    }
}

export const app = new App();
