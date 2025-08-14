import 'lazysizes';
import { MediaQueries } from './utils/MediaQueries.ts';
import { Vh100 } from './utils/Vh100.ts';
import { BodyScrolled } from './utils/BodyScrolled.ts';
import { MenuToggle } from './macros-functions/menu-toggle/MenuToggle.ts';
import './app.scss';

class App {
    public mediaQuery: MediaQueries;
    public bodyScrolledEvent: BodyScrolled;
    public vh100: Vh100;
    public menuToggle: MenuToggle;

    constructor() {
        this.mediaQuery = MediaQueries.getInstance();
        this.bodyScrolledEvent = BodyScrolled.getInstance();
        this.vh100 = Vh100.getInstance();
        
        this.menuToggle = MenuToggle.getInstance('hamburger', 'menu', '.menu__link');

        this.initialize();
    }

    private initialize() {
        console.info('App initialized.');
    }
}

export const app = new App();