import GUI from 'lil-gui';
import { MediaQueries } from 'profitlich-template-toolkit/utils/MediaQueries';
import './dev-toolbar.scss';

export class DevToolbar {
    #mediaQueries = MediaQueries.getInstance();
    #gui;
    #state;
    #pictureElements;

    constructor() {
        // State aus localStorage laden
        const saved = localStorage.getItem('devTools');
        this.#state = saved
            ? JSON.parse(saved)
            : { visible: false, grid: 'aus', imageSize: false };

        // Grid-Overlay DOM-Element erstellen
        const gridOverlay = document.createElement('div');
        gridOverlay.classList.add('dev-toolbar__grid');
        document.body.prepend(gridOverlay);

        // Picture-Elemente sammeln
        this.#pictureElements = document.getElementsByTagName('picture');

        // lil-gui initialisieren
        this.#gui = new GUI({ title: this.#getViewportText() });

        this.#gui.add(this.#state, 'grid', ['aus', 'lines', 'ribbons'])
            .name('Grid')
            .onChange(() => this.#onStateChange());

        this.#gui.add(this.#state, 'imageSize')
            .name('Bildgrössen')
            .onChange(() => this.#onStateChange());

        // State anwenden
        this.#applyState();

        // Panel ein-/ausblenden
        if (!this.#state.visible) {
            this.#gui.hide();
        }

        // Event-Listener
        window.addEventListener('resize', this.#onResize);
        document.addEventListener('keydown', this.#handleKeyDown);
    }

    #getViewportText() {
        return `${this.#mediaQueries.layout} @ ${window.innerWidth}×${window.innerHeight}`;
    }

    #onStateChange() {
        this.#applyState();
        this.#saveState();
    }

    #applyState() {
        const gridActive = this.#state.grid !== 'aus';
        document.body.setAttribute('data-dev', String(gridActive));
        document.body.setAttribute('data-dev-grid', this.#state.grid);
        this.#updateImageSize();
    }

    #saveState() {
        localStorage.setItem('devTools', JSON.stringify(this.#state));
    }

    #updateImageSize() {
        if (!this.#pictureElements) return;
        const pictures = Array.from(this.#pictureElements);
        if (this.#state.imageSize) {
            const windowWidth = window.innerWidth;
            pictures.forEach((picture) => {
                picture.setAttribute('data-size', `${Math.round(picture.offsetWidth / windowWidth * 100)}vw`);
            });
        } else {
            pictures.forEach((picture) => {
                picture.setAttribute('data-size', '');
            });
        }
    }

    #onResize = () => {
        this.#gui.title(this.#getViewportText());
        this.#updateImageSize();
    }

    #handleKeyDown = (event) => {
        if (event.key === 'Control') {
            event.preventDefault();
            this.#state.visible = !this.#state.visible;
            if (this.#state.visible) {
                this.#gui.show();
            } else {
                this.#gui.hide();
            }
            this.#saveState();
        }
    }
}
