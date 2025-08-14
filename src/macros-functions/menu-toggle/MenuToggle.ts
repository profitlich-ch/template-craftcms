import './_menu-toggle.scss';

export class MenuToggle {
    private static instance: MenuToggle;
    private menuButton: HTMLElement;
    private menu: HTMLElement;
    private y: number;
    private bodyClickHandler: (event: MouseEvent) => void;
    private escapeHandler: (event: KeyboardEvent) => void;
    public isActive: boolean;

    private constructor(menuButtonId: string, menuId: string, menuLinkClass: string) {
        this.menuButton = document.getElementById(menuButtonId)!;
        this.menu = document.getElementById(menuId)!;
        this.isActive = false;
        this.y = 0;

        this.bodyClickHandler = this.onBodyClick.bind(this);
        this.escapeHandler = this.onEscape.bind(this);

        this.menuButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.toggleMenu();
        });

        this.menu.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (this.isActive && target.matches(menuLinkClass)) {
                this.toggleMenu();
            }
        });
    }

    public static getInstance(menuButtonId?: string, menuId?: string, menuLinkClass?: string): MenuToggle {
        if (!MenuToggle.instance) {
            if (!menuButtonId || !menuId || !menuLinkClass) {
                throw new Error("MenuToggle muss beim ersten Aufruf mit buttonId, menuId und menuLinkClass initialisiert werden.");
            }
            MenuToggle.instance = new MenuToggle(menuButtonId, menuId, menuLinkClass);
        }
        return MenuToggle.instance;
    }

    private toggleMenu() {
        if (this.isActive) {
            this.isActive = false;
            document.body.removeEventListener('click', this.bodyClickHandler);
            this.setBodyAttribute('data-menu-active', 'false');
            document.body.style.paddingRight = '';
            document.body.style.top = '';
            window.scrollTo(0, this.y);
            this.toggleEscape(false);
        } else {
            this.isActive = true;
            document.body.addEventListener('click', this.bodyClickHandler);
            const scrollbar = window.innerWidth - document.documentElement.clientWidth;
            this.y = window.scrollY;
            this.setBodyAttribute('data-menu-active', 'true');
            document.body.style.paddingRight = `${scrollbar}px`;
            document.body.style.top = `-${this.y}px`;
            this.toggleEscape(true);
        }
        // Custom Event für Menüstatus
        const event = new CustomEvent('eventMenuestatus', {
            detail: { menueStatus: this.isActive }
        });
        document.dispatchEvent(event);
    }

    private onBodyClick(event: MouseEvent) {
        if (this.isActive && !(event.target as HTMLElement).closest('.header__menue')) {
            this.toggleMenu();
        }
    }

    private setBodyAttribute(attr: string, value: string) {
        document.body.setAttribute(attr, value);
    }

    private toggleEscape(status: boolean) {
        if (status) {
            document.addEventListener('keydown', this.escapeHandler);
        } else {
            document.removeEventListener('keydown', this.escapeHandler);
        }
    }

    private onEscape(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.toggleMenu();
        }
    }
}