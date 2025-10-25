/**
 * Loading Spinner - Loading state management
 * Display loading indicators during async operations
 */

class LoadingSpinner {
    constructor() {
        this.spinners = new Map();
        this.globalSpinner = null;
        this.init();
    }

    /**
     * Initialize loading spinner
     */
    init() {
        this.addStyles();
    }

    /**
     * Show global loading spinner
     */
    showGlobal(message = 'Loading...') {
        if (this.globalSpinner) {
            this.updateMessage(message);
            return;
        }

        this.globalSpinner = document.createElement('div');
        this.globalSpinner.className = 'loading-overlay';
        this.globalSpinner.innerHTML = `
            <div class="loading-spinner-container">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;

        document.body.appendChild(this.globalSpinner);
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            this.globalSpinner.classList.add('show');
        }, 10);
    }

    /**
     * Hide global loading spinner
     */
    hideGlobal() {
        if (!this.globalSpinner) return;

        this.globalSpinner.classList.remove('show');
        
        setTimeout(() => {
            if (this.globalSpinner) {
                this.globalSpinner.remove();
                this.globalSpinner = null;
                document.body.style.overflow = '';
            }
        }, 300);
    }

    /**
     * Update global loading message
     */
    updateMessage(message) {
        if (!this.globalSpinner) return;

        const messageElement = this.globalSpinner.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    /**
     * Show loading spinner in specific element
     */
    show(elementOrId, options = {}) {
        const config = {
            message: '',
            size: 'medium',
            overlay: true,
            ...options
        };

        const element = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;

        if (!element) {
            console.error('Element not found');
            return null;
        }

        const id = element.id || 'spinner-' + Date.now();

        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = `loading-inline ${config.overlay ? 'with-overlay' : ''}`;
        spinner.innerHTML = `
            <div class="loading-spinner-container size-${config.size}">
                <div class="loading-spinner"></div>
                ${config.message ? `<div class="loading-message">${config.message}</div>` : ''}
            </div>
        `;

        // Store original position
        const originalPosition = window.getComputedStyle(element).position;
        if (originalPosition === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(spinner);
        this.spinners.set(id, { element: spinner, originalPosition });

        setTimeout(() => {
            spinner.classList.add('show');
        }, 10);

        return id;
    }

    /**
     * Hide loading spinner in specific element
     */
    hide(elementOrId) {
        const id = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
        const spinnerData = this.spinners.get(id);

        if (!spinnerData) return;

        const spinner = spinnerData.element;
        spinner.classList.remove('show');

        setTimeout(() => {
            spinner.remove();
            this.spinners.delete(id);
        }, 300);
    }

    /**
     * Show loading on button
     */
    showOnButton(button, text = '') {
        if (!button) return;

        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        
        const spinner = '<span class="button-spinner"></span>';
        button.innerHTML = text ? `${spinner} ${text}` : spinner;
    }

    /**
     * Hide loading on button
     */
    hideOnButton(button) {
        if (!button) return;

        button.disabled = false;
        
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    }

    /**
     * Add loading spinner styles
     */
    addStyles() {
        if (document.getElementById('loading-spinner-styles')) return;

        const style = document.createElement('style');
        style.id = 'loading-spinner-styles';
        style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .loading-overlay.show {
                opacity: 1;
            }

            .loading-inline {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 10;
            }

            .loading-inline.with-overlay {
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(3px);
            }

            .loading-inline.show {
                opacity: 1;
            }

            .loading-spinner-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }

            .loading-spinner {
                width: 48px;
                height: 48px;
                border: 4px solid rgba(255, 255, 255, 0.1);
                border-top-color: var(--color-primary, #00ff88);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .loading-spinner-container.size-small .loading-spinner {
                width: 24px;
                height: 24px;
                border-width: 2px;
            }

            .loading-spinner-container.size-medium .loading-spinner {
                width: 48px;
                height: 48px;
                border-width: 4px;
            }

            .loading-spinner-container.size-large .loading-spinner {
                width: 72px;
                height: 72px;
                border-width: 6px;
            }

            .loading-message {
                color: var(--color-text-light, #ffffff);
                font-size: 14px;
                text-align: center;
            }

            .button-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: currentColor;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                vertical-align: middle;
                margin-right: 8px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global loading spinner instance
const loadingSpinner = new LoadingSpinner();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingSpinner;
}
