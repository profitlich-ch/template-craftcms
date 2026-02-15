import '@mux/mux-player';
import './mux-player.scss';

export class MuxPlayer {
    private lazyLoadObserver: IntersectionObserver;
    private playPauseObserver: IntersectionObserver;

    constructor() {
        this.lazyLoadObserver = new IntersectionObserver(this.handleLazyLoad.bind(this));
        this.playPauseObserver = new IntersectionObserver(this.handlePlayPause.bind(this));
    }

    public observeLazyElements(): void {
        document.querySelectorAll('.mux-player').forEach(el => {
            this.lazyLoadObserver.observe(el as HTMLElement);
        });
    }

    private handleLazyLoad(entries: IntersectionObserverEntry[]): void {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                this.lazyLoadObserver.unobserve(entry.target);
                const container = entry.target as HTMLElement;
                const playbackId = container.dataset.playbackId as string;
                const aspectRatio = container.dataset.aspectRatio || '16 / 9';
                const autoplay = container.dataset.autoplay === "true";

                const player = document.createElement('mux-player') as MuxPlayerElement;
                player.playbackId = playbackId;
                player.streamType = 'on-demand';
                player.playsInline = true;
                player.style.aspectRatio = aspectRatio;

                // Autoplay-Attribut am Player-Element setzen, damit es später gefunden werden kann
                if (autoplay) {
                    player.setAttribute('data-autoplay', 'true');
                }

                const wrapper = container.closest('[data-video-wrapper]');

                // Wenn ein Wrapper gefunden wird, richte den MutationObserver ein
                if (wrapper) {
                    const visibilityObserver = new MutationObserver(() => {
                        this.handleVisibilityChange(player);
                    });

                    // Beobachte den gefundenen Wrapper
                    visibilityObserver.observe(wrapper, { attributes: true, childList: true, subtree: true });
                    
                    // Container durch Player ersetzen BEVOR die Sichtbarkeitsprüfung
                    container.replaceWith(player);
                    
                    // Führe eine initiale Prüfung durch, falls es schon sichtbar ist
                    this.handleVisibilityChange(player);
                } else if (autoplay) {
                    // Fallback für normale Autoplay-Videos ohne speziellen Wrapper
                    player.muted = true;
                    player.style.setProperty('--controls', 'none');
                    container.replaceWith(player);
                    
                    player.addEventListener('loadeddata', () => {
                        this.playPauseObserver.observe(player);
                    });
                } else {
                    // Für Videos ohne Autoplay
                    container.replaceWith(player);
                }
            }
        }
    }

    private handleVisibilityChange(player: MuxPlayerElement): void {
        // Prüfe direkt am Player, ob er durch CSS sichtbar ist
        const isVisible = window.getComputedStyle(player).display !== 'none';
        
        if (isVisible && player.hasAttribute('data-autoplay')) {
            // Wenn der Player sichtbar ist und Autoplay haben soll
            player.muted = true;
            player.style.setProperty('--controls', 'none');
            
            // Warte auf loadeddata bevor der IntersectionObserver aktiviert wird
            if (player.readyState >= 2) { // HAVE_CURRENT_DATA oder höher
                this.playPauseObserver.observe(player);
            } else {
                player.addEventListener('loadeddata', () => {
                    this.playPauseObserver.observe(player);
                }, { once: true });
            }
        } else if (!isVisible) {
            // Wenn der Player unsichtbar wird, pausiere ihn und stoppe die Beobachtung
            this.playPauseObserver.unobserve(player);
            player.pause();
        }
    }

    private handlePlayPause(entries: IntersectionObserverEntry[]): void {
        for (const entry of entries) {
            const player = entry.target as MuxPlayerElement;
            if (entry.isIntersecting) {
                player.play().catch(e => console.error("Player-Fehler:", e));
            } else {
                player.pause();
            }
        }
    }
}