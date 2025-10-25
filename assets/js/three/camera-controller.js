/**
 * Camera Controller - Advanced camera movement and controls
 * Handles smooth camera transitions, parallax, and interactive controls
 */

class CameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement || document.body;
        
        this.target = new THREE.Vector3(0, 0, 0);
        this.currentPosition = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        
        this.config = {
            smoothing: 0.05,
            parallaxIntensity: 0.5,
            minDistance: 3,
            maxDistance: 15,
            rotationSpeed: 0.002,
            zoomSpeed: 0.1
        };

        this.mouse = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        
        this.init();
    }

    /**
     * Initialize camera controller
     */
    init() {
        this.currentPosition.copy(this.camera.position);
        this.targetPosition.copy(this.camera.position);
        
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Mouse move for parallax
        this.domElement.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });

        // Mouse wheel for zoom
        this.domElement.addEventListener('wheel', (event) => {
            this.handleWheel(event);
        }, { passive: false });

        // Touch support
        this.domElement.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                this.handleMouseMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        }, { passive: true });
    }

    /**
     * Handle mouse movement
     */
    handleMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    /**
     * Handle mouse wheel
     */
    handleWheel(event) {
        event.preventDefault();
        
        const delta = event.deltaY * this.config.zoomSpeed * 0.01;
        this.targetPosition.z = THREE.MathUtils.clamp(
            this.targetPosition.z + delta,
            this.config.minDistance,
            this.config.maxDistance
        );
    }

    /**
     * Update camera position (call in animation loop)
     */
    update() {
        // Parallax effect
        const parallaxX = this.mouse.x * this.config.parallaxIntensity;
        const parallaxY = this.mouse.y * this.config.parallaxIntensity;

        this.targetPosition.x = parallaxX;
        this.targetPosition.y = parallaxY;

        // Smooth interpolation
        this.currentPosition.lerp(this.targetPosition, this.config.smoothing);
        this.camera.position.copy(this.currentPosition);

        // Look at target
        this.camera.lookAt(this.target);
    }

    /**
     * Move camera to position
     */
    moveTo(x, y, z, duration = 1000) {
        this.targetPosition.set(x, y, z);
    }

    /**
     * Set camera target
     */
    setTarget(x, y, z) {
        this.target.set(x, y, z);
    }

    /**
     * Reset camera to default position
     */
    reset() {
        this.targetPosition.set(0, 0, 8);
        this.target.set(0, 0, 0);
    }

    /**
     * Enable/disable parallax
     */
    setParallax(enabled) {
        this.config.parallaxIntensity = enabled ? 0.5 : 0;
    }

    /**
     * Set smoothing factor
     */
    setSmoothing(value) {
        this.config.smoothing = THREE.MathUtils.clamp(value, 0, 1);
    }

    /**
     * Orbit around target
     */
    orbit(angle, radius, height = 0) {
        this.targetPosition.x = Math.cos(angle) * radius;
        this.targetPosition.z = Math.sin(angle) * radius;
        this.targetPosition.y = height;
    }

    /**
     * Shake camera (for effects)
     */
    shake(intensity = 0.1, duration = 500) {
        const startTime = Date.now();
        const originalPosition = this.camera.position.clone();

        const shakeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                clearInterval(shakeInterval);
                this.camera.position.copy(originalPosition);
                return;
            }

            const shakeAmount = intensity * (1 - progress);
            this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeAmount;
            this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeAmount;
        }, 16);
    }

    /**
     * Dispose controller
     */
    dispose() {
        // Remove event listeners if needed
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CameraController;
}
