import { MediaQueries } from '../../utils/MediaQueries.js';
import Cookies from 'js-cookie'
import './dev-toolbar.scss';

export class DevToolbar {
    #mediaQueries = MediaQueries.getInstance();
    #isDevToolsLoaded = false;
    #isDevToolsShown = false;
    #grid = 'lines';
    #devDiv = null;
    #devDivText = null;
    #pictureElements = null;

    constructor() {
        // Prüfen, ob ein Cookie für die Dev-Tools existiert.
        const devToolsCookie = Cookies.get('devTools');
        if (devToolsCookie) {
            const devToolsArray = devToolsCookie.split(',');
            if (devToolsArray[0] === 'true') {
                // Setze den Grid-Typ aus dem Cookie.
                this.#grid = devToolsArray[1];
                this.#initialiseDevTools();
            }
        }

        // Event-Listener für Tastatureingaben hinzufügen.
        document.addEventListener('keydown', this.#handleKeyDown);
    }

    /**
     * Erstellt die notwendigen DOM-Elemente für die Toolbar und fügt sie dem Body hinzu.
     */
    #initialiseDevTools() {
        this.#devDiv = document.createElement('div');
        this.#devDiv.classList.add('dev-toolbar');
        this.#devDiv.id = 'dev-toolbar';
        document.body.prepend(this.#devDiv);

        this.#devDivText = document.createElement('div');
        this.#devDivText.classList.add('dev-toolbar__text');
        this.#devDivText.id = 'dev-toolbar__text';
        this.#devDiv.append(this.#devDivText);

        this.#pictureElements = document.getElementsByTagName('picture');

        const devDivRaster = document.createElement('div');
        devDivRaster.classList.add('dev-toolbar__grid');
        devDivRaster.id = 'dev-toolbar__grid';
        this.#devDiv.append(devDivRaster);

        window.addEventListener('resize', this.#updateDevDisplay);
        window.addEventListener('resize', this.#updateImageSize);

        this.#isDevToolsLoaded = true;
        this.#toggleDevTools(true, this.#grid);
        this.#updateDevDisplay();
        this.#updateImageSize();
    }

    /**
     * Aktualisiert den Text in der Toolbar mit der aktuellen Layout- und Fenstergröße.
     */
    #updateDevDisplay = () => {
        if (this.#isDevToolsShown === true && this.#devDivText) {

            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            this.#devDivText.textContent = `${this.#mediaQueries.layout} @ ${windowWidth}×${windowHeight}`;
        }
    }

    #updateImageSize = () => {
        if (this.#pictureElements) {
            let pictures = Array.from(this.#pictureElements);
            if (this.#isDevToolsShown === true) {
                const windowWidth = window.innerWidth;
                pictures.forEach((picture) => {
                    let pictureWidth = picture.offsetWidth;
                    picture.setAttribute('data-size', `${Math.round(pictureWidth / windowWidth * 100)}vw`);
                });
            } else {
                pictures.forEach((picture) => {
                    picture.setAttribute('data-size', '');
                });
            }
        }
    }

    /**
     * Behandelt das 'keydown'-Event, um die Toolbar mit der Strg-Taste umzuschalten.
     */
    #handleKeyDown = (event) => {
        if (event.key === 'Control') {
            // Verhindere Standard-Aktionen des Browsers
            event.preventDefault();

            if (!this.#isDevToolsLoaded) {
                this.#initialiseDevTools();
            } else {
                const newIsShown = !this.#isDevToolsShown;
                if (newIsShown) {
                    // Wechsle den Grid-Typ bei jeder Aktivierung.
                    this.#grid = this.#grid === 'lines' ? 'ribbons' : 'lines';
                }
                this.#toggleDevTools(newIsShown, this.#grid);
            }
        }
    }

    /**
     * Schaltet die Sichtbarkeit der Dev-Tools um und speichert den Zustand in einem Cookie.
     */
    #toggleDevTools(isOn, grid) {
        document.body.setAttribute('data-dev', String(isOn));
        document.body.setAttribute('data-dev-grid', grid);

        // Speichere den Zustand im Cookie.
        const cookieValue = `${isOn},${grid}`;
        Cookies.set('devTools', cookieValue, {
            expires: 365,
            path: '/',
            domain: window.location.hostname,
            secure: true,
            sameSite: 'lax'
        });

        this.#isDevToolsShown = isOn;
        this.#updateDevDisplay();
        this.#updateImageSize();
    }
}
