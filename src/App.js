import 'lazysizes';
import config from './config.json' with { type: "json" };
import { MediaQueries } from 'profitlich-template-toolkit/utils/MediaQueries';
import { Vh100 } from 'profitlich-template-toolkit/utils/Vh100';
import { BodyScrolled } from 'profitlich-template-toolkit/utils/BodyScrolled';
import { MenuToggle } from 'profitlich-template-toolkit/components/menu-toggle/MenuToggle';
import './app.scss';

class App {
    mediaQuery;
    bodyScrolledEvent;
    vh100;
    menuToggle;

    constructor() {
        this.mediaQuery = MediaQueries.getInstance(config.breakpoints);
        this.bodyScrolledEvent = BodyScrolled.getInstance();
        this.vh100 = Vh100.getInstance();

        this.menuToggle = MenuToggle.getInstance('hamburger', 'menu', '.menu__link', 'menu__link');

        this.#initialize();
    }

    #initialize() {
        console.info('App initialized.');
    }
}

export const app = new App();
