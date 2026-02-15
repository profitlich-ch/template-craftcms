import './menu-toggle.scss';

export class MenuToggle {
    static #instance;
    #menuButton;
    #menu;
    #y;
    #bodyClickHandler;
    #escapeHandler;
    isActive;

    constructor(menuButtonId, menuId, menuLinkClass) {
        this.#menuButton = document.getElementById(menuButtonId);
        this.#menu = document.getElementById(menuId);
        this.isActive = false;
        this.#y = 0;

        this.#bodyClickHandler = this.#onBodyClick.bind(this);
        this.#escapeHandler = this.#onEscape.bind(this);

        this.#menuButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.#toggleMenu();
        });

        this.#menu.addEventListener('click', (event) => {
            if (this.isActive && event.target.matches(menuLinkClass)) {
                this.#toggleMenu();
            }
        });
    }

    static getInstance(menuButtonId, menuId, menuLinkClass) {
        if (!MenuToggle.#instance) {
            if (!menuButtonId || !menuId || !menuLinkClass) {
                throw new Error("MenuToggle muss beim ersten Aufruf mit buttonId, menuId und menuLinkClass initialisiert werden.");
            }
            MenuToggle.#instance = new MenuToggle(menuButtonId, menuId, menuLinkClass);
        }
        return MenuToggle.#instance;
    }

    #toggleMenu() {
        if (this.isActive) {
            this.isActive = false;
            document.body.removeEventListener('click', this.#bodyClickHandler);
            this.#setBodyAttribute('data-menu-active', 'false');
            document.body.style.paddingRight = '';
            document.body.style.top = '';
            window.scrollTo(0, this.#y);
            this.#toggleEscape(false);
        } else {
            this.isActive = true;
            document.body.addEventListener('click', this.#bodyClickHandler);
            const scrollbar = window.innerWidth - document.documentElement.clientWidth;
            this.#y = window.scrollY;
            this.#setBodyAttribute('data-menu-active', 'true');
            document.body.style.paddingRight = `${scrollbar}px`;
            document.body.style.top = `-${this.#y}px`;
            this.#toggleEscape(true);
        }
        // Custom Event für Menüstatus
        const event = new CustomEvent('eventMenuestatus', {
            detail: { menueStatus: this.isActive }
        });
        document.dispatchEvent(event);
    }

    #onBodyClick(event) {
        if (this.isActive && !event.target.closest('.header__menue')) {
            this.#toggleMenu();
        }
    }

    #setBodyAttribute(attr, value) {
        document.body.setAttribute(attr, value);
    }

    #toggleEscape(status) {
        if (status) {
            document.addEventListener('keydown', this.#escapeHandler);
        } else {
            document.removeEventListener('keydown', this.#escapeHandler);
        }
    }

    #onEscape(event) {
        if (event.key === 'Escape') {
            this.#toggleMenu();
        }
    }
}
