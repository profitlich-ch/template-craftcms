
/** 
 * 100vh problem
 * https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
 */

export class Vh100 {
    private static instance: Vh100;
    public vh: number = 0;
    
    private constructor() {
        this.calculate();
        // We listen to the resize event
        window.addEventListener('resize', () => {
            this.calculate();
        });
    }
    
    private calculate() {
        // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
        this.vh = window.innerHeight * 0.01;
        // Then we set the value in the --vh custom property to the root of the document
        document.documentElement.style.setProperty('--vh', `${this.vh}px`);
    }

    public static getInstance(): Vh100 {
        if (!Vh100.instance) {
            Vh100.instance = new Vh100();
        }
        return Vh100.instance;
    }
}