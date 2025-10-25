/**
 * Modal Controller - Modal window management
 * Handles creation, display, and interaction with modal dialogs
 */

class ModalController {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
        this.init();
    }

    /**
     * Initialize modal controller
     */
    init() {
        // Add ESC key listener to close modal
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal);
            }
        });
    }

    /**
     * Create a modal
     */
    create(id, options = {}) {
        const config = {
            title: 'Modal',
            content: '',
            width: '500px',
            closeButton: true,
            overlay: true,
            onOpen: null,
            onClose: null,
            buttons: [],
            ...options
        };

        // Create modal structure
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = `modal-${id}`;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `modal-title-${id}`);

        // Create overlay
        if (config.overlay) {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.addEventListener('click', () => {
                if (config.closeButton) {
                    this.close(id);
                }
            });
            modal.appendChild(overlay);
        }

        // Create modal container
        const container = document.createElement('div');
        container.className = 'modal-container';
        container.style.maxWidth = config.width;

        // Create header
        const header = document.createElement('div');
        header.className = 'modal-header';

        const title = document.createElement('h3');
        title.className = 'modal-title';
        title.id = `modal-title-${id}`;
        title.textContent = config.title;
        header.appendChild(title);

        if (config.closeButton) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '×';
            closeBtn.setAttribute('aria-label', 'Close modal');
            closeBtn.addEventListener('click', () => this.close(id));
            header.appendChild(closeBtn);
        }

        container.appendChild(header);

        // Create body
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        if (typeof config.content === 'string') {
            body.innerHTML = config.content;
        } else if (config.content instanceof HTMLElement) {
            body.appendChild(config.content);
        }

        container.appendChild(body);

        // Create footer with buttons
        if (config.buttons.length > 0) {
            const footer = document.createElement('div');
            footer.className = 'modal-footer';

            config.buttons.forEach(buttonConfig => {
                const button = document.createElement('button');
                button.className = `btn ${buttonConfig.class || 'btn-secondary'}`;
                button.textContent = buttonConfig.text;
                button.addEventListener('click', () => {
                    if (buttonConfig.onClick) {
                        buttonConfig.onClick();
                    }
                    if (buttonConfig.closeOnClick !== false) {
                        this.close(id);
                    }
                });
                footer.appendChild(button);
            });

            container.appendChild(footer);
        }

        modal.appendChild(container);
        document.body.appendChild(modal);

        // Store modal reference
        this.modals.set(id, {
            element: modal,
            config: config
        });

        // Add styles if not already present
        this.addStyles();

        return modal;
    }

    /**
     * Open a modal
     */
    open(id) {
        const modalData = this.modals.get(id);
        if (!modalData) {
            console.error(`Modal ${id} not found`);
            return;
        }

        const modal = modalData.element;
        const config = modalData.config;

        // Close any active modal
        if (this.activeModal && this.activeModal !== id) {
            this.close(this.activeModal);
        }

        // Show modal
        modal.classList.add('active');
        this.activeModal = id;

        // Disable body scroll
        document.body.style.overflow = 'hidden';

        // Focus first focusable element
        setTimeout(() => {
            const focusable = modal.querySelector('button, input, textarea, select');
            if (focusable) {
                focusable.focus();
            }
        }, 100);

        // Call onOpen callback
        if (config.onOpen) {
            config.onOpen();
        }
    }

    /**
     * Close a modal
     */
    close(id) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const modal = modalData.element;
        const config = modalData.config;

        // Hide modal
        modal.classList.remove('active');
        this.activeModal = null;

        // Re-enable body scroll
        document.body.style.overflow = '';

        // Call onClose callback
        if (config.onClose) {
            config.onClose();
        }
    }

    /**
     * Destroy a modal
     */
    destroy(id) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        if (this.activeModal === id) {
            this.close(id);
        }

        modalData.element.remove();
        this.modals.delete(id);
    }

    /**
     * Update modal content
     */
    updateContent(id, content) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const body = modalData.element.querySelector('.modal-body');
        if (body) {
            if (typeof content === 'string') {
                body.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                body.innerHTML = '';
                body.appendChild(content);
            }
        }
    }

    /**
     * Update modal title
     */
    updateTitle(id, title) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const titleElement = modalData.element.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    /**
     * Add modal styles
     */
    addStyles() {
        if (document.getElementById('modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 1rem;
            }

            .modal.active {
                display: flex;
            }

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                animation: fadeIn 0.3s ease;
            }

            .modal-container {
                position: relative;
                background: var(--color-bg-surface, #131313);
                border-radius: 16px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
                z-index: 1;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .modal-title {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--color-text-light, #ffffff);
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 2rem;
                line-height: 1;
                color: var(--color-text-muted, rgba(255, 255, 255, 0.6));
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: background 0.2s ease;
            }

            .modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--color-text-light, #ffffff);
            }

            .modal-body {
                padding: 1.5rem;
                color: var(--color-text-muted, rgba(255, 255, 255, 0.6));
            }

            .modal-footer {
                display: flex;
                gap: 1rem;
                padding: 1.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                justify-content: flex-end;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @media (max-width: 768px) {
                .modal-container {
                    max-width: 100%;
                    border-radius: 0;
                    max-height: 100vh;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Create confirmation modal
     */
    confirm(title, message, onConfirm, onCancel = null) {
        const id = 'confirm-' + Date.now();
        
        this.create(id, {
            title: title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: 'Cancel',
                    class: 'btn-secondary',
                    onClick: () => {
                        if (onCancel) onCancel();
                    }
                },
                {
                    text: 'Confirm',
                    class: 'btn-primary',
                    onClick: () => {
                        if (onConfirm) onConfirm();
                    }
                }
            ],
            onClose: () => {
                this.destroy(id);
            }
        });

        this.open(id);
    }

    /**
     * Create alert modal
     */
    alert(title, message, onClose = null) {
        const id = 'alert-' + Date.now();
        
        this.create(id, {
            title: title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: 'OK',
                    class: 'btn-primary',
                    onClick: () => {
                        if (onClose) onClose();
                    }
                }
            ],
            onClose: () => {
                this.destroy(id);
            }
        });

        this.open(id);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalController;
}
