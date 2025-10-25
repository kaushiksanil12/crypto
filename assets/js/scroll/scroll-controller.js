/**
 * Scroll Controller - Main scroll logic and progress tracking
 * Manages scroll-based animations and scene transitions
 */

class ScrollController {
    constructor(options = {}) {
        this.options = {
            smoothScrolling: true,
            smoothFactor: 0.1,
            threshold: 0.3,
            ...options
        };

        this.scrollProgress = 0;
        this.targetScroll = 0;
        this.currentScroll = 0;
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.callbacks = {
            onScroll: [],
            onScrollStart: [],
            onScrollEnd: [],
            onProgressChange: []
        };

        this.init();
    }

    /**
     * Initialize scroll controller
     */
    init() {
        this.setupScrollListener();
        this.update();
    }

    /**
     * Set up scroll event listener
     */
    setupScrollListener() {
        window.addEventListener('scroll', () => {
            this.targetScroll = window.scrollY;
            this.handleScrollStart();
            this.calculateProgress();
            this.triggerCallbacks('onScroll', {
                scrollY: this.targetScroll,
                progress: this.scrollProgress
            });

            // Detect scroll end
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                this.handleScrollEnd();
            }, 150);
        }, { passive: true });
    }

    /**
     * Calculate scroll progress (0-1)
     */
    calculateProgress() {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.scrollProgress = maxScroll > 0 ? this.targetScroll / maxScroll : 0;
        
        this.triggerCallbacks('onProgressChange', {
            progress: this.scrollProgress,
            scrollY: this.targetScroll,
            maxScroll: maxScroll
        });

        return this.scrollProgress;
    }

    /**
     * Handle scroll start
     */
    handleScrollStart() {
        if (!this.isScrolling) {
            this.isScrolling = true;
            this.triggerCallbacks('onScrollStart', {
                scrollY: this.targetScroll
            });
        }
    }

    /**
     * Handle scroll end
     */
    handleScrollEnd() {
        this.isScrolling = false;
        this.triggerCallbacks('onScrollEnd', {
            scrollY: this.targetScroll,
            progress: this.scrollProgress
        });
    }

    /**
     * Smooth scroll update loop
     */
    update() {
        if (this.options.smoothScrolling) {
            // Lerp to target scroll position
            this.currentScroll += (this.targetScroll - this.currentScroll) * this.options.smoothFactor;
        } else {
            this.currentScroll = this.targetScroll;
        }

        requestAnimationFrame(() => this.update());
    }

    /**
     * Get current scroll progress
     */
    getProgress() {
        return this.scrollProgress;
    }

    /**
     * Get current scroll position
     */
    getScrollY() {
        return this.options.smoothScrolling ? this.currentScroll : this.targetScroll;
    }

    /**
     * Get smoothed scroll position
     */
    getSmoothScrollY() {
        return this.currentScroll;
    }

    /**
     * Scroll to specific position
     */
    scrollTo(position, smooth = true) {
        if (smooth) {
            window.scrollTo({
                top: position,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo(0, position);
        }
    }

    /**
     * Scroll to element
     */
    scrollToElement(element, offset = 0, smooth = true) {
        const targetElement = typeof element === 'string' 
            ? document.querySelector(element) 
            : element;

        if (!targetElement) {
            console.warn('Element not found:', element);
            return;
        }

        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
        this.scrollTo(targetPosition, smooth);
    }

    /**
     * Scroll to top
     */
    scrollToTop(smooth = true) {
        this.scrollTo(0, smooth);
    }

    /**
     * Scroll to bottom
     */
    scrollToBottom(smooth = true) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.scrollTo(maxScroll, smooth);
    }

    /**
     * Check if element is in viewport
     */
    isInViewport(element, offset = 0) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= -offset &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Get element visibility percentage
     */
    getElementVisibility(element) {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        
        const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
        const elementHeight = rect.height;
        
        return Math.max(0, Math.min(1, visibleHeight / elementHeight));
    }

    /**
     * Register callback
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * Unregister callback
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Trigger callbacks
     */
    triggerCallbacks(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    /**
     * Disable scroll
     */
    disableScroll() {
        document.body.style.overflow = 'hidden';
    }

    /**
     * Enable scroll
     */
    enableScroll() {
        document.body.style.overflow = '';
    }

    /**
     * Get scroll direction
     */
    getScrollDirection() {
        return this.targetScroll > this.currentScroll ? 'down' : 'up';
    }

    /**
     * Get scroll velocity
     */
    getScrollVelocity() {
        return Math.abs(this.targetScroll - this.currentScroll);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollController;
}
