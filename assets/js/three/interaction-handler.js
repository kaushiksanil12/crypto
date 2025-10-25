/**
 * Interaction Handler - Mouse and touch interactions with 3D objects
 * Handles raycasting, object picking, and interactive controls
 */

class InteractionHandler {
    constructor(camera, scene, renderer) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.intersectedObject = null;
        this.selectedObject = null;
        
        this.isDragging = false;
        this.dragStartPosition = new THREE.Vector2();
        this.objectDragStart = new THREE.Vector3();
        
        this.callbacks = {
            onHover: [],
            onClick: [],
            onDragStart: [],
            onDrag: [],
            onDragEnd: []
        };

        this.init();
    }

    /**
     * Initialize interaction handler
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));

        // Touch events
        this.renderer.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.renderer.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.renderer.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }

    /**
     * Handle mouse move
     */
    onMouseMove(event) {
        this.updateMousePosition(event.clientX, event.clientY);
        
        if (this.isDragging && this.selectedObject) {
            this.handleDrag();
        } else {
            this.handleHover();
        }
    }

    /**
     * Handle mouse down
     */
    onMouseDown(event) {
        this.updateMousePosition(event.clientX, event.clientY);
        
        const intersects = this.getIntersects();
        if (intersects.length > 0) {
            this.selectedObject = intersects[0].object;
            this.isDragging = true;
            this.dragStartPosition.set(this.mouse.x, this.mouse.y);
            this.objectDragStart.copy(this.selectedObject.position);
            
            this.triggerCallbacks('onDragStart', {
                object: this.selectedObject,
                position: this.dragStartPosition
            });
        }
    }

    /**
     * Handle mouse up
     */
    onMouseUp(event) {
        if (this.isDragging && this.selectedObject) {
            this.triggerCallbacks('onDragEnd', {
                object: this.selectedObject
            });
        }
        
        this.isDragging = false;
        this.selectedObject = null;
    }

    /**
     * Handle click
     */
    onClick(event) {
        this.updateMousePosition(event.clientX, event.clientY);
        
        const intersects = this.getIntersects();
        if (intersects.length > 0) {
            this.triggerCallbacks('onClick', {
                object: intersects[0].object,
                point: intersects[0].point
            });
        }
    }

    /**
     * Handle touch start
     */
    onTouchStart(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.onMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }

    /**
     * Handle touch move
     */
    onTouchMove(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.onMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }

    /**
     * Handle touch end
     */
    onTouchEnd(event) {
        this.onMouseUp(event);
    }

    /**
     * Update mouse position
     */
    updateMousePosition(clientX, clientY) {
        this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    }

    /**
     * Get intersected objects
     */
    getIntersects() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        return this.raycaster.intersectObjects(this.scene.children, true);
    }

    /**
     * Handle hover
     */
    handleHover() {
        const intersects = this.getIntersects();
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            if (this.intersectedObject !== object) {
                // Reset previous
                if (this.intersectedObject && this.intersectedObject.material) {
                    this.intersectedObject.material.emissiveIntensity = 0.2;
                }
                
                // Highlight new
                this.intersectedObject = object;
                if (object.material) {
                    object.material.emissiveIntensity = 0.5;
                }
                
                this.triggerCallbacks('onHover', { object });
            }
        } else {
            // Reset
            if (this.intersectedObject && this.intersectedObject.material) {
                this.intersectedObject.material.emissiveIntensity = 0.2;
            }
            this.intersectedObject = null;
        }
    }

    /**
     * Handle drag
     */
    handleDrag() {
        if (!this.selectedObject) return;
        
        const dragDelta = new THREE.Vector2(
            this.mouse.x - this.dragStartPosition.x,
            this.mouse.y - this.dragStartPosition.y
        );
        
        this.triggerCallbacks('onDrag', {
            object: this.selectedObject,
            delta: dragDelta
        });
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
     * Enable/disable interactions
     */
    setEnabled(enabled) {
        this.renderer.domElement.style.pointerEvents = enabled ? 'auto' : 'none';
    }

    /**
     * Dispose handler
     */
    dispose() {
        // Event listeners are automatically removed when element is removed
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractionHandler;
}
