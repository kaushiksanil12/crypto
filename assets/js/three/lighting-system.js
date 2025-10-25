/**
 * Lighting System - Dynamic lighting setup and control
 * Ambient, point, directional, and animated lights
 */

class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        this.lights = new Map();
        this.animatedLights = [];
    }

    /**
     * Create ambient light
     */
    createAmbientLight(options = {}) {
        const config = {
            color: 0xffffff,
            intensity: 0.3,
            name: 'ambient',
            ...options
        };

        const light = new THREE.AmbientLight(config.color, config.intensity);
        this.lights.set(config.name, light);
        
        if (this.scene) {
            this.scene.add(light);
        }

        return light;
    }

    /**
     * Create point light
     */
    createPointLight(options = {}) {
        const config = {
            color: 0xffffff,
            intensity: 1,
            distance: 100,
            decay: 2,
            position: { x: 0, y: 0, z: 0 },
            name: 'point',
            animated: false,
            animationPath: null,
            ...options
        };

        const light = new THREE.PointLight(
            config.color,
            config.intensity,
            config.distance,
            config.decay
        );

        light.position.set(
            config.position.x,
            config.position.y,
            config.position.z
        );

        if (config.animated) {
            light.userData.animated = true;
            light.userData.animationPath = config.animationPath;
            this.animatedLights.push(light);
        }

        this.lights.set(config.name, light);
        
        if (this.scene) {
            this.scene.add(light);
        }

        return light;
    }

    /**
     * Create directional light
     */
    createDirectionalLight(options = {}) {
        const config = {
            color: 0xffffff,
            intensity: 1,
            position: { x: 5, y: 5, z: 5 },
            target: { x: 0, y: 0, z: 0 },
            name: 'directional',
            castShadow: false,
            ...options
        };

        const light = new THREE.DirectionalLight(config.color, config.intensity);
        
        light.position.set(
            config.position.x,
            config.position.y,
            config.position.z
        );

        light.target.position.set(
            config.target.x,
            config.target.y,
            config.target.z
        );

        light.castShadow = config.castShadow;

        if (config.castShadow) {
            light.shadow.mapSize.width = 2048;
            light.shadow.mapSize.height = 2048;
            light.shadow.camera.near = 0.5;
            light.shadow.camera.far = 500;
        }

        this.lights.set(config.name, light);
        
        if (this.scene) {
            this.scene.add(light);
            this.scene.add(light.target);
        }

        return light;
    }

    /**
     * Create spotlight
     */
    createSpotLight(options = {}) {
        const config = {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
            angle: Math.PI / 3,
            penumbra: 0.1,
            decay: 2,
            position: { x: 0, y: 5, z: 0 },
            target: { x: 0, y: 0, z: 0 },
            name: 'spotlight',
            ...options
        };

        const light = new THREE.SpotLight(
            config.color,
            config.intensity,
            config.distance,
            config.angle,
            config.penumbra,
            config.decay
        );

        light.position.set(
            config.position.x,
            config.position.y,
            config.position.z
        );

        light.target.position.set(
            config.target.x,
            config.target.y,
            config.target.z
        );

        this.lights.set(config.name, light);
        
        if (this.scene) {
            this.scene.add(light);
            this.scene.add(light.target);
        }

        return light;
    }

    /**
     * Set up default lighting (like current implementation)
     */
    setupDefaultLighting() {
        // Ambient light
        this.createAmbientLight({
            intensity: 0.3,
            name: 'ambient-main'
        });

        // Point light 1 (green)
        this.createPointLight({
            color: 0x00ff88,
            intensity: 2.5,
            distance: 100,
            position: { x: 5, y: 5, z: 5 },
            name: 'point-green',
            animated: true,
            animationPath: 'circular'
        });

        // Point light 2 (blue)
        this.createPointLight({
            color: 0x00ccff,
            intensity: 2.5,
            distance: 100,
            position: { x: -5, y: -5, z: 5 },
            name: 'point-blue',
            animated: true,
            animationPath: 'circular-reverse'
        });

        // Point light 3 (purple)
        this.createPointLight({
            color: 0xa855f7,
            intensity: 2,
            distance: 100,
            position: { x: 0, y: 5, z: -5 },
            name: 'point-purple',
            animated: true,
            animationPath: 'vertical'
        });
    }

    /**
     * Update animated lights
     */
    update(time, scrollProgress = 0) {
        this.animatedLights.forEach(light => {
            const path = light.userData.animationPath;

            switch (path) {
                case 'circular':
                    light.position.x = Math.sin(time + scrollProgress * Math.PI * 2) * 5;
                    light.position.z = Math.cos(time + scrollProgress * Math.PI * 2) * 5;
                    break;

                case 'circular-reverse':
                    light.position.x = -Math.sin(time + scrollProgress * Math.PI * 2) * 5;
                    light.position.z = -Math.cos(time + scrollProgress * Math.PI * 2) * 5;
                    break;

                case 'vertical':
                    light.position.y = Math.sin(time * 0.5 + scrollProgress * Math.PI) * 3 + 3;
                    break;

                case 'orbit':
                    const radius = 7;
                    light.position.x = Math.cos(time) * radius;
                    light.position.y = Math.sin(time * 0.5) * 3;
                    light.position.z = Math.sin(time) * radius;
                    break;
            }
        });
    }

    /**
     * Get light by name
     */
    getLight(name) {
        return this.lights.get(name);
    }

    /**
     * Remove light
     */
    removeLight(name) {
        const light = this.lights.get(name);
        
        if (light && this.scene) {
            this.scene.remove(light);
            this.lights.delete(name);
            
            // Remove from animated lights if present
            const index = this.animatedLights.indexOf(light);
            if (index > -1) {
                this.animatedLights.splice(index, 1);
            }
        }
    }

    /**
     * Set light intensity
     */
    setIntensity(name, intensity) {
        const light = this.lights.get(name);
        if (light) {
            light.intensity = intensity;
        }
    }

    /**
     * Set light color
     */
    setColor(name, color) {
        const light = this.lights.get(name);
        if (light) {
            light.color.set(color);
        }
    }

    /**
     * Dispose all lights
     */
    dispose() {
        this.lights.forEach((light, name) => {
            if (this.scene) {
                this.scene.remove(light);
            }
        });
        
        this.lights.clear();
        this.animatedLights = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LightingSystem;
}
