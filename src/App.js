import 'lazysizes';
import { MediaQueries } from './utils/MediaQueries.js';
import { Vh100 } from './utils/Vh100.js';
import { BodyScrolled } from './utils/BodyScrolled.js';
import { MenuToggle } from './macros-functions/menu-toggle/MenuToggle.js';
import './app.scss';

class App {
    mediaQuery;
    bodyScrolledEvent;
    vh100;
    menuToggle;

    constructor() {
        this.mediaQuery = MediaQueries.getInstance();
        this.bodyScrolledEvent = BodyScrolled.getInstance();
        this.vh100 = Vh100.getInstance();

        this.menuToggle = MenuToggle.getInstance('hamburger', 'menu', '.menu__link');

        this.#initialize();
    }

    #initialize() {
        console.info('App initialized.');
    }
}

export const app = new App();
