/**
 * Shader Materials - Custom shader material presets
 * Pre-configured shader materials for various effects
 */

class ShaderMaterials {
    constructor() {
        this.materials = new Map();
    }

    /**
     * Create holographic material
     */
    createHolographic(options = {}) {
        const config = {
            color1: new THREE.Color(0x00ff88),
            color2: new THREE.Color(0x00ccff),
            color3: new THREE.Color(0xa855f7),
            speed: 1.0,
            ...options
        };

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: config.color1 },
                color2: { value: config.color2 },
                color3: { value: config.color3 },
                speed: { value: config.speed }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 color3;
                uniform float speed;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
                    
                    float colorShift = sin(vPosition.y * 5.0 + time * speed) * 0.5 + 0.5;
                    vec3 color = mix(color1, color2, colorShift);
                    color = mix(color, color3, fresnel);
                    
                    float scanline = sin(vPosition.y * 50.0 + time * 2.0 * speed) * 0.1 + 0.9;
                    color *= scanline;
                    
                    float flicker = sin(time * 10.0 * speed) * 0.05 + 0.95;
                    color *= flicker;
                    
                    color += fresnel * 0.5;
                    
                    gl_FragColor = vec4(color, 0.8 + fresnel * 0.2);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.materials.set('holographic', material);
        return material;
    }

    /**
     * Create glowing material
     */
    createGlow(options = {}) {
        const config = {
            color: new THREE.Color(0x00ff88),
            intensity: 1.5,
            ...options
        };

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                glowColor: { value: config.color },
                glowIntensity: { value: config.intensity }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 glowColor;
                uniform float glowIntensity;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.5);
                    
                    float pulse = sin(time * 2.0) * 0.3 + 0.7;
                    vec3 glow = glowColor * fresnel * glowIntensity * pulse;
                    vec3 coreColor = glowColor * 0.3;
                    
                    vec3 finalColor = coreColor + glow;
                    float alpha = fresnel * 0.8 + 0.2;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        this.materials.set('glow', material);
        return material;
    }

    /**
     * Create liquid crystal material
     */
    createLiquidCrystal(options = {}) {
        const config = {
            speed: 0.5,
            ...options
        };

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                speed: { value: config.speed }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float speed;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                
                void main() {
                    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                    float radius = length(vUv - 0.5);
                    
                    float hue = fract(angle / (3.14159 * 2.0) + time * speed * 0.1);
                    
                    vec3 color;
                    float h = hue * 6.0;
                    float c = 1.0;
                    float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
                    
                    if (h < 1.0) color = vec3(c, x, 0.0);
                    else if (h < 2.0) color = vec3(x, c, 0.0);
                    else if (h < 3.0) color = vec3(0.0, c, x);
                    else if (h < 4.0) color = vec3(0.0, x, c);
                    else if (h < 5.0) color = vec3(x, 0.0, c);
                    else color = vec3(c, 0.0, x);
                    
                    float wave = sin(radius * 20.0 - time * speed * 2.0) * 0.5 + 0.5;
                    color *= wave;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.DoubleSide
        });

        this.materials.set('liquidCrystal', material);
        return material;
    }

    /**
     * Create digital grid material
     */
    createDigitalGrid(options = {}) {
        const config = {
            gridColor: new THREE.Color(0x00ff88),
            lineWidth: 0.05,
            ...options
        };

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                gridColor: { value: config.gridColor },
                lineWidth: { value: config.lineWidth }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 gridColor;
                uniform float lineWidth;
                
                varying vec2 vUv;
                
                void main() {
                    vec2 grid = fract(vUv * 10.0);
                    float line = step(1.0 - lineWidth, grid.x) + step(1.0 - lineWidth, grid.y);
                    line = clamp(line, 0.0, 1.0);
                    
                    float pulse = sin(time * 2.0) * 0.3 + 0.7;
                    vec3 color = gridColor * line * pulse;
                    
                    gl_FragColor = vec4(color, line * 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.materials.set('digitalGrid', material);
        return material;
    }

    /**
     * Create energy field material
     */
    createEnergyField(options = {}) {
        const config = {
            color: new THREE.Color(0x00ccff),
            ...options
        };

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                energyColor: { value: config.color }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 energyColor;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }
                
                void main() {
                    vec2 uv = vUv * 5.0;
                    float n = noise(uv + time * 0.5);
                    
                    float energy = sin(vPosition.y * 10.0 + time * 2.0 + n * 3.0) * 0.5 + 0.5;
                    energy = pow(energy, 3.0);
                    
                    vec3 color = energyColor * energy;
                    
                    gl_FragColor = vec4(color, energy * 0.7);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        this.materials.set('energyField', material);
        return material;
    }

    /**
     * Update all material time uniforms
     */
    updateTime(time) {
        this.materials.forEach(material => {
            if (material.uniforms && material.uniforms.time) {
                material.uniforms.time.value = time;
            }
        });
    }

    /**
     * Get material by name
     */
    getMaterial(name) {
        return this.materials.get(name);
    }

    /**
     * Dispose all materials
     */
    dispose() {
        this.materials.forEach(material => {
            material.dispose();
        });
        this.materials.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShaderMaterials;
}
