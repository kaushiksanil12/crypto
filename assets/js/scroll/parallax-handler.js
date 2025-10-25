/**
 * Parallax Handler - Mouse tracking and parallax effects
 * Creates depth and interactivity through mouse movement
 */

class ParallaxHandler {
    constructor(options = {}) {
        this.options = {
            enabled: true,
            intensity: 0.5,
            smoothing: 0.02,
            invertX: false,
            invertY: false,
            maxOffset: 1,
            ...options
        };

        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.normalizedX = 0;
        this.normalizedY = 0;

        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        this.callbacks = {
            onMouseMove: [],
            onDragStart: [],
            onDrag: [],
            onDragEnd: []
        };

        this.init();
    }

    /**
     * Initialize parallax handler
     */
    init() {
        this.setupEventListeners();
        this.update();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Mouse move
        document.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });

        // Touch move (for mobile)
        document.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                this.handleMouseMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        }, { passive: true });

        // Mouse down
        document.addEventListener('mousedown', (event) => {
            this.handleDragStart(event);
        });

        // Mouse up
        document.addEventListener('mouseup', () => {
            this.handleDragEnd();
        });

        // Touch events
        document.addEventListener('touchstart', (event) => {
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                this.handleDragStart({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            this.handleDragEnd();
        });
    }

    /**
     * Handle mouse movement
     */
    handleMouseMove(event) {
        if (!this.options.enabled) return;

        this.mouseX = event.clientX;
        this.mouseY = event.clientY;

        // Normalize to -1 to 1 range
        this.normalizedX = (this.mouseX / window.innerWidth) * 2 - 1;
        this.normalizedY = -(this.mouseY / window.innerHeight) * 2 + 1;

        // Apply inversion
        if (this.options.invertX) this.normalizedX *= -1;
        if (this.options.invertY) this.normalizedY *= -1;

        // Apply intensity
        this.targetX = this.normalizedX * this.options.intensity * this.options.maxOffset;
        this.targetY = this.normalizedY * this.options.intensity * this.options.maxOffset;

        // Trigger callbacks
        this.triggerCallbacks('onMouseMove', {
            x: this.mouseX,
            y: this.mouseY,
            normalizedX: this.normalizedX,
            normalizedY: this.normalizedY
        });

        // Handle drag
        if (this.isDragging) {
            const deltaX = this.mouseX - this.dragStartX;
            const deltaY = this.mouseY - this.dragStartY;

            this.triggerCallbacks('onDrag', {
                deltaX: deltaX,
                deltaY: deltaY,
                x: this.mouseX,
                y: this.mouseY
            });
        }
    }

    /**
     * Handle drag start
     */
    handleDragStart(event) {
        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;

        this.triggerCallbacks('onDragStart', {
            x: this.dragStartX,
            y: this.dragStartY
        });
    }

    /**
     * Handle drag end
     */
    handleDragEnd() {
        if (!this.isDragging) return;

        this.isDragging = false;

        this.triggerCallbacks('onDragEnd', {
            x: this.mouseX,
            y: this.mouseY
        });
    }

    /**
     * Update loop with smoothing
     */
    update() {
        // Smooth interpolation
        this.currentX += (this.targetX - this.currentX) * this.options.smoothing;
        this.currentY += (this.targetY - this.currentY) * this.options.smoothing;

        requestAnimationFrame(() => this.update());
    }

    /**
     * Apply parallax to camera
     */
    applyToCamera(camera) {
        if (!this.options.enabled || this.isDragging) return;

        camera.position.x += (this.currentX - camera.position.x) * 0.02;
        camera.position.y += (this.currentY - camera.position.y) * 0.02;
    }

    /**
     * Apply parallax to object
     */
    applyToObject(object, multiplier = 1) {
        if (!this.options.enabled) return;

        const offsetX = this.currentX * multiplier;
        const offsetY = this.currentY * multiplier;

        object.position.x = offsetX;
        object.position.y = offsetY;
    }

    /**
     * Apply parallax rotation to object
     */
    applyRotationToObject(object, multiplier = 1) {
        if (!this.options.enabled || this.isDragging) return;

        const rotationX = this.currentY * Math.PI * multiplier;
        const rotationY = this.currentX * Math.PI * multiplier;

        object.rotation.x += (rotationX - object.rotation.x) * 0.05;
        object.rotation.y += (rotationY - object.rotation.y) * 0.05;
    }

    /**
     * Apply drag rotation to object
     */
    applyDragRotation(object, targetRotationX, targetRotationY) {
        object.rotation.x += (targetRotationX - object.rotation.x) * 0.05;
        object.rotation.y += (targetRotationY - object.rotation.y) * 0.05;
    }

    /**
     * Get current position
     */
    getPosition() {
        return {
            x: this.currentX,
            y: this.currentY,
            normalizedX: this.normalizedX,
            normalizedY: this.normalizedY
        };
    }

    /**
     * Get mouse position
     */
    getMousePosition() {
        return {
            x: this.mouseX,
            y: this.mouseY
        };
    }

    /**
     * Check if dragging
     */
    getDragging() {
        return this.isDragging;
    }

    /**
     * Enable parallax
     */
    enable() {
        this.options.enabled = true;
    }

    /**
     * Disable parallax
     */
    disable() {
        this.options.enabled = false;
    }

    /**
     * Set intensity
     */
    setIntensity(intensity) {
        this.options.intensity = intensity;
    }

    /**
     * Set smoothing
     */
    setSmoothing(smoothing) {
        this.options.smoothing = smoothing;
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
     * Trigger callbacks
     */
    triggerCallbacks(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    /**
     * Reset position
     */
    reset() {
        this.currentX = 0;
        this.currentY = 0;
        this.targetX = 0;
        this.targetY = 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParallaxHandler;
}
