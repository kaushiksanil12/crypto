/**
 * Scene Manager - Main Three.js scene setup and management
 * Handles scene initialization, camera, renderer, and core 3D setup
 */

class SceneManager {
    constructor(containerElement) {
        this.container = containerElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.isInitialized = false;
        
        this.config = {
            antialias: true,
            alpha: true,
            pixelRatio: Math.min(window.devicePixelRatio, 2),
            fog: {
                enabled: true,
                color: 0x0a0a0a,
                near: 5,
                far: 15
            },
            camera: {
                fov: 75,
                near: 0.1,
                far: 1000,
                position: { x: 0, y: 0, z: 8 }
            }
        };
    }

    /**
     * Initialize Three.js scene
     */
    init() {
        if (this.isInitialized) {
            console.warn('Scene already initialized');
            return;
        }

        // Create scene
        this.scene = new THREE.Scene();
        
        // Add fog
        if (this.config.fog.enabled) {
            this.scene.fog = new THREE.Fog(
                this.config.fog.color,
                this.config.fog.near,
                this.config.fog.far
            );
        }

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            this.config.camera.fov,
            window.innerWidth / window.innerHeight,
            this.config.camera.near,
            this.config.camera.far
        );
        
        this.camera.position.set(
            this.config.camera.position.x,
            this.config.camera.position.y,
            this.config.camera.position.z
        );

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.config.antialias,
            alpha: this.config.alpha
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(this.config.pixelRatio);
        
        // Append to container
        if (this.container) {
            this.container.appendChild(this.renderer.domElement);
        }

        // Set up window resize handler
        this.setupResizeHandler();

        this.isInitialized = true;

        return {
            scene: this.scene,
            camera: this.camera,
            renderer: this.renderer
        };
    }

    /**
     * Set up window resize handler
     */
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Render scene
     */
    render() {
        if (!this.renderer || !this.scene || !this.camera) return;
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Get scene
     */
    getScene() {
        return this.scene;
    }

    /**
     * Get camera
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Get renderer
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * Get elapsed time
     */
    getElapsedTime() {
        return this.clock.getElapsedTime();
    }

    /**
     * Add object to scene
     */
    add(object) {
        if (this.scene) {
            this.scene.add(object);
        }
    }

    /**
     * Remove object from scene
     */
    remove(object) {
        if (this.scene) {
            this.scene.remove(object);
        }
    }

    /**
     * Clear scene
     */
    clear() {
        if (!this.scene) return;

        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            this.scene.remove(object);
            
            // Dispose geometry and material
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
    }

    /**
     * Set background color
     */
    setBackgroundColor(color) {
        if (this.scene) {
            this.scene.background = new THREE.Color(color);
        }
    }

    /**
     * Set fog
     */
    setFog(color, near, far) {
        if (this.scene) {
            this.scene.fog = new THREE.Fog(color, near, far);
        }
    }

    /**
     * Dispose scene
     */
    dispose() {
        this.clear();
        
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SceneManager;
}
