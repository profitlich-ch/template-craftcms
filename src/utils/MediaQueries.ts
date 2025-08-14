/**Media queries
 * https://kinsta.com/blog/javamediaqueryipt-media-query/
 * option 3 on the linked page
 */ 

import config from '../config.json' with { type: "json" };

export class MediaQueries {
    private static instance: MediaQueries;
    public layout: keyof typeof config.layouts = 'desktop';

    private constructor() {
        this.layout = 'desktop';
        this.changeLayout();
        this.matchmedia();
    }

    public static getInstance(): MediaQueries {
        if (!MediaQueries.instance) {
            MediaQueries.instance = new MediaQueries();
        }
        return MediaQueries.instance;
    }

    private matchmedia() {
        for (let [layout, minSize] of Object.entries(config.breakpoints)) {
            if (minSize) {
                var matchmedia = window.matchMedia('(min-width: ' + minSize + 'px)');
                matchmedia.addEventListener('change', (e) => this.changeLayout());
            }
        }
    }
    
    // media query handler function
    changeLayout() {
        // let size = null;
        for (let [layout, minSize] of Object.entries(config.breakpoints)) {
            var matchmedia = window.matchMedia('(min-width: ' + minSize + 'px)');
            if (!matchmedia || matchmedia.matches) {
                this.layout = layout as keyof typeof config.layouts;
            }
        }
        document.body.setAttribute('data-layout', this.layout);
    
        // create event
        let event = new CustomEvent('eventLayoutchange', {
            detail: {
                layout: this.layout
            }
        });
        // dispatch the event
        window.dispatchEvent(event);
    }
}