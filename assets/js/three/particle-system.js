/**
 * Particle System - Advanced particle effects
 * Creates dynamic particle fields with various behaviors
 */

class ParticleSystem {
    constructor(scene, count = 5000) {
        this.scene = scene;
        this.count = count;
        this.particles = null;
        this.velocities = [];
        
        this.config = {
            size: 0.05,
            speed: 0.01,
            range: 50,
            colorful: true,
            motion: 'float' // 'float', 'orbit', 'flow'
        };

        this.init();
    }

    /**
     * Initialize particle system
     */
    init() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.count * 3);
        const colors = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);

        for (let i = 0; i < this.count * 3; i += 3) {
            // Random positions
            positions[i] = (Math.random() - 0.5) * this.config.range;
            positions[i + 1] = (Math.random() - 0.5) * this.config.range;
            positions[i + 2] = (Math.random() - 0.5) * this.config.range;

            // Random colors
            const color = new THREE.Color();
            if (this.config.colorful) {
                color.setHSL(Math.random(), 1, 0.5);
            } else {
                color.setHSL(0.5, 0, 0.5);
            }
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;

            // Random sizes
            sizes[i / 3] = Math.random() * this.config.size;

            // Store velocities
            this.velocities.push({
                x: (Math.random() - 0.5) * this.config.speed,
                y: (Math.random() - 0.5) * this.config.speed,
                z: (Math.random() - 0.5) * this.config.speed
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: this.config.size,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    /**
     * Update particles (call in animation loop)
     */
    update(time) {
        const positions = this.particles.geometry.attributes.position.array;

        for (let i = 0; i < positions.length; i += 3) {
            switch (this.config.motion) {
                case 'float':
                    positions[i + 1] += Math.sin(time + positions[i]) * 0.01;
                    break;

                case 'orbit':
                    const radius = Math.sqrt(positions[i] ** 2 + positions[i + 2] ** 2);
                    const angle = Math.atan2(positions[i + 2], positions[i]) + 0.001;
                    positions[i] = Math.cos(angle) * radius;
                    positions[i + 2] = Math.sin(angle) * radius;
                    break;

                case 'flow':
                    const idx = i / 3;
                    positions[i] += this.velocities[idx].x;
                    positions[i + 1] += this.velocities[idx].y;
                    positions[i + 2] += this.velocities[idx].z;

                    // Wrap around
                    const halfRange = this.config.range / 2;
                    if (Math.abs(positions[i]) > halfRange) positions[i] *= -1;
                    if (Math.abs(positions[i + 1]) > halfRange) positions[i + 1] *= -1;
                    if (Math.abs(positions[i + 2]) > halfRange) positions[i + 2] *= -1;
                    break;
            }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.rotation.y += 0.0002;
    }

    /**
     * Set motion type
     */
    setMotion(motionType) {
        this.config.motion = motionType;
    }

    /**
     * Set particle count
     */
    setCount(count) {
        this.dispose();
        this.count = count;
        this.velocities = [];
        this.init();
    }

    /**
     * Set color mode
     */
    setColorful(colorful) {
        this.config.colorful = colorful;
        const colors = this.particles.geometry.attributes.color.array;

        for (let i = 0; i < colors.length; i += 3) {
            const color = new THREE.Color();
            if (colorful) {
                color.setHSL(Math.random(), 1, 0.5);
            } else {
                color.setHSL(0.5, 0, 0.5);
            }
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        this.particles.geometry.attributes.color.needsUpdate = true;
    }

    /**
     * Explode particles
     */
    explode(intensity = 5) {
        for (let i = 0; i < this.velocities.length; i++) {
            this.velocities[i].x *= intensity;
            this.velocities[i].y *= intensity;
            this.velocities[i].z *= intensity;
        }
    }

    /**
     * Reset particles to center
     */
    reset() {
        const positions = this.particles.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = (Math.random() - 0.5) * this.config.range;
            positions[i + 1] = (Math.random() - 0.5) * this.config.range;
            positions[i + 2] = (Math.random() - 0.5) * this.config.range;
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Show/hide particles
     */
    setVisible(visible) {
        this.particles.visible = visible;
    }

    /**
     * Dispose particle system
     */
    dispose() {
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.scene.remove(this.particles);
            this.particles = null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
}
