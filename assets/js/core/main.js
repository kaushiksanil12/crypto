/**
 * Main Application Entry Point
 * Initializes all modules and manages application lifecycle
 */

class App {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        this.config = {
            enableDebug: true,
            enableAnalytics: false,
            apiEndpoint: null,
            version: '1.0.0'
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            this.log('Initializing Crypto Biometric Application...');

            // Show loading screen
            this.showLoading();

            // Initialize core modules
            await this.initializeModules();

            // Set up event listeners
            this.setupEventListeners();

            // Check browser compatibility
            this.checkCompatibility();

            // Hide loading screen
            this.hideLoading();

            this.isInitialized = true;
            this.log('Application initialized successfully');

            // Dispatch ready event
            this.dispatchEvent('app:ready');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Initialize core modules
     */
    async initializeModules() {
        this.log('Initializing modules...');

        // Initialize router
        if (typeof Router !== 'undefined') {
            this.modules.router = new Router();
            this.log('Router initialized');
        }

        // Initialize utility functions
        if (typeof Utils !== 'undefined') {
            this.modules.utils = new Utils();
            this.log('Utils initialized');
        }

        // Check for biometric support
        await this.checkBiometricSupport();
    }

    /**
     * Check biometric support
     */
    async checkBiometricSupport() {
        const support = {
            webauthn: false,
            camera: false,
            crypto: false
        };

        // Check WebAuthn
        if (window.PublicKeyCredential) {
            support.webauthn = true;
            try {
                support.platformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            } catch (error) {
                support.platformAuthenticator = false;
            }
        }

        // Check Camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            support.camera = true;
        }

        // Check Web Crypto API
        if (window.crypto && window.crypto.subtle) {
            support.crypto = true;
        }

        this.modules.biometricSupport = support;
        this.log('Biometric support:', support);

        return support;
    }

    /**
     * Check browser compatibility
     */
    checkCompatibility() {
        const compatible = {
            webgl: this.checkWebGLSupport(),
            es6: this.checkES6Support(),
            webauthn: !!window.PublicKeyCredential,
            localStorage: this.checkLocalStorageSupport()
        };

        this.modules.compatibility = compatible;
        this.log('Browser compatibility:', compatible);

        // Show warnings if needed
        if (!compatible.webgl) {
            this.showWarning('WebGL is not supported. 3D features may not work properly.');
        }

        if (!compatible.webauthn) {
            this.showWarning('WebAuthn is not supported. Biometric features will be limited.');
        }

        return compatible;
    }

    /**
     * Check WebGL support
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (error) {
            return false;
        }
    }

    /**
     * Check ES6 support
     */
    checkES6Support() {
        try {
            eval('class Test {}');
            eval('const arrow = () => {}');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check localStorage support
     */
    checkLocalStorageSupport() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.dispatchEvent('app:hidden');
            } else {
                this.dispatchEvent('app:visible');
            }
        });

        // Online/offline events
        window.addEventListener('online', () => {
            this.dispatchEvent('app:online');
            this.log('Application is online');
        });

        window.addEventListener('offline', () => {
            this.dispatchEvent('app:offline');
            this.log('Application is offline');
        });

        // Error handling
        window.addEventListener('error', (event) => {
            this.handleError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });
    }

    /**
     * Handle errors
     */
    handleError(error) {
        console.error('Unhandled error:', error);
        
        if (this.config.enableDebug) {
            this.showError(`Error: ${error.message || error}`);
        }

        this.dispatchEvent('app:error', { error });
    }

    /**
     * Show loading screen
     */
    showLoading(message = 'Loading...') {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
            const loadingText = loadingScreen.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
        }
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show warning message
     */
    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}]`, message);

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    /**
     * Dispatch custom event
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    /**
     * Listen to custom event
     */
    on(eventName, callback) {
        window.addEventListener(eventName, (event) => {
            callback(event.detail);
        });
    }

    /**
     * Log message (only in debug mode)
     */
    log(...args) {
        if (this.config.enableDebug) {
            console.log('[App]', ...args);
        }
    }

    /**
     * Get module by name
     */
    getModule(name) {
        return this.modules[name];
    }

    /**
     * Get configuration
     */
    getConfig(key) {
        return key ? this.config[key] : this.config;
    }

    /**
     * Set configuration
     */
    setConfig(key, value) {
        this.config[key] = value;
    }

    /**
     * Get application info
     */
    getInfo() {
        return {
            version: this.config.version,
            initialized: this.isInitialized,
            modules: Object.keys(this.modules),
            compatibility: this.modules.compatibility,
            biometricSupport: this.modules.biometricSupport
        };
    }
}

// Create global app instance
const app = new App();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    app.init();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
