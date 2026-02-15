import './menu-toggle.scss';

export class MenuToggle {
    static #instance;
    #menuButton;
    #menu;
    #menuLinkClass;
    #menuItemClass;
    #scrollbarWidth;
    #shiftElement;
    #y;
    #bodyClickHandler;
    #resizeHandler;
    #escapeHandler;
    isActive;

    constructor(menuButtonId, menuId, menuLinkClass, menuItemClass, shiftElementId) {
        this.#menuButton = document.getElementById(menuButtonId);
        this.#menu = document.getElementById(menuId);
        this.#menuLinkClass = menuLinkClass;
        this.#menuItemClass = menuItemClass;
        this.#shiftElement = shiftElementId ? document.getElementById(shiftElementId) : null;
        this.#scrollbarWidth = 0;
        this.isActive = false;
        this.#y = 0;

        this.#bodyClickHandler = this.#onBodyClick.bind(this);
        this.#resizeHandler = this.#onResize.bind(this);
        this.#escapeHandler = this.#onEscape.bind(this);

        this.#menuButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.#toggleMenu();
        });

        this.#menu.addEventListener('click', (event) => {
            if (this.isActive && event.target.matches(this.#menuLinkClass)) {
                this.#toggleMenu();
            }
        });
    }

    static getInstance(menuButtonId, menuId, menuLinkClass, menuItemClass, shiftElementId) {
        if (!MenuToggle.#instance) {
            if (!menuButtonId || !menuId || !menuLinkClass || !menuItemClass) {
                throw new Error("MenuToggle muss beim ersten Aufruf mit menuButtonId, menuId, menuLinkClass und menuItemClass initialisiert werden.");
            }
            MenuToggle.#instance = new MenuToggle(menuButtonId, menuId, menuLinkClass, menuItemClass, shiftElementId);
        }
        return MenuToggle.#instance;
    }

    #toggleMenu() {
        if (this.isActive) {
            this.isActive = false;
            document.body.removeEventListener('click', this.#bodyClickHandler);
            window.removeEventListener('resize', this.#resizeHandler);
            this.#setBodyAttribute('data-menu-active', 'false');
            if (this.#shiftElement) {
                this.#shiftElement.style.marginRight = '';
                this.#shiftElement.style.width = '';
            }
            document.body.style.paddingRight = '';
            document.body.style.top = '';
            window.scrollTo(0, this.#y);
            this.#toggleEscape(false);
        } else {
            this.isActive = true;
            document.body.addEventListener('click', this.#bodyClickHandler);
            window.addEventListener('resize', this.#resizeHandler);
            this.#scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            this.#y = window.scrollY;
            this.#setBodyAttribute('data-menu-active', 'true');
            document.body.style.paddingRight = `${this.#scrollbarWidth}px`;
            document.body.style.top = `-${this.#y}px`;
            if (this.#shiftElement) {
                const marginOriginal = parseFloat(window.getComputedStyle(this.#menuButton).marginRight);
                this.#shiftElement.style.marginRight = `${marginOriginal + this.#scrollbarWidth}px`;
                this.#adjustShiftElementWidth();
            }
            this.#toggleEscape(true);
        }
        const event = new CustomEvent('eventMenuestatus', {
            detail: { menueStatus: this.isActive }
        });
        document.dispatchEvent(event);
    }

    #adjustShiftElementWidth() {
        const contentWidth = document.documentElement.clientWidth;
        this.#shiftElement.style.width = `${contentWidth - this.#scrollbarWidth}px`;
    }

    #onBodyClick(event) {
        if (this.isActive && !event.target.closest('.' + this.#menuItemClass)) {
            this.#toggleMenu();
        }
    }

    #onResize() {
        if (this.#shiftElement) {
            this.#adjustShiftElementWidth();
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
