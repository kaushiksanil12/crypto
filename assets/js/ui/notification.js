/**
 * Notification System - Toast notifications
 * Display temporary notifications to users
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.init();
    }

    /**
     * Initialize notification system
     */
    init() {
        this.createContainer();
        this.addStyles();
    }

    /**
     * Create notification container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Show notification
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        const id = 'notification-' + Date.now() + '-' + Math.random();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.id = id;
        notification.setAttribute('role', 'alert');

        // Icon based on type
        const icon = this.getIcon(type);
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" aria-label="Close notification">×</button>
        `;

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.close(id);
        });

        // Add to container
        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification });

        // Remove old notifications if limit exceeded
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.close(oldest.id);
        }

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto close after duration
        if (duration > 0) {
            setTimeout(() => {
                this.close(id);
            }, duration);
        }

        return id;
    }

    /**
     * Close notification
     */
    close(id) {
        const notificationData = this.notifications.find(n => n.id === id);
        if (!notificationData) return;

        const notification = notificationData.element;
        notification.classList.remove('show');
        notification.classList.add('hide');

        setTimeout(() => {
            notification.remove();
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    /**
     * Show success notification
     */
    success(message, duration = this.defaultDuration) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show error notification
     */
    error(message, duration = this.defaultDuration) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show warning notification
     */
    warning(message, duration = this.defaultDuration) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Show info notification
     */
    info(message, duration = this.defaultDuration) {
        return this.show(message, 'info', duration);
    }

    /**
     * Get icon for notification type
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.forEach(n => {
            this.close(n.id);
        });
    }

    /**
     * Add notification styles
     */
    addStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            }

            .notification {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                min-width: 320px;
                max-width: 400px;
                background: var(--color-bg-surface, #131313);
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                opacity: 0;
                transform: translateX(400px);
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                pointer-events: auto;
                border-left: 4px solid;
            }

            .notification.show {
                opacity: 1;
                transform: translateX(0);
            }

            .notification.hide {
                opacity: 0;
                transform: translateX(400px);
            }

            .notification-success {
                border-left-color: #10b981;
            }

            .notification-error {
                border-left-color: #ef4444;
            }

            .notification-warning {
                border-left-color: #f59e0b;
            }

            .notification-info {
                border-left-color: #3b82f6;
            }

            .notification-icon {
                font-size: 24px;
                line-height: 1;
                flex-shrink: 0;
            }

            .notification-success .notification-icon {
                color: #10b981;
            }

            .notification-error .notification-icon {
                color: #ef4444;
            }

            .notification-warning .notification-icon {
                color: #f59e0b;
            }

            .notification-info .notification-icon {
                color: #3b82f6;
            }

            .notification-content {
                flex: 1;
                min-width: 0;
            }

            .notification-message {
                color: var(--color-text-light, #ffffff);
                font-size: 14px;
                line-height: 1.5;
                word-wrap: break-word;
            }

            .notification-close {
                background: none;
                border: none;
                color: var(--color-text-muted, rgba(255, 255, 255, 0.6));
                font-size: 24px;
                line-height: 1;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                transition: background 0.2s ease;
                flex-shrink: 0;
            }

            .notification-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--color-text-light, #ffffff);
            }

            @media (max-width: 768px) {
                .notification-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                }

                .notification {
                    min-width: 0;
                    max-width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global notification instance
const notifications = new NotificationSystem();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}
