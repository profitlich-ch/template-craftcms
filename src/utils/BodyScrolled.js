/**
 * after scroll set body attribute data-scrolled to true
 */

export class BodyScrolled {
    static #instance;

    constructor() {
        document.addEventListener('scroll', function setScrolled() {
            document.body.setAttribute('data-body-scrolled', 'true');
            this.removeEventListener('scroll', setScrolled);

            // create event
            let event = new CustomEvent('eventBodyScrolled', {
                detail: {
                    scrolled: true
                }
            });
            // dispatch the event
            window.dispatchEvent(event);
        });

    }

    static getInstance() {
        if (!BodyScrolled.#instance) {
            BodyScrolled.#instance = new BodyScrolled();
        }
        return BodyScrolled.#instance;
    }
}
