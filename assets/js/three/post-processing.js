/**
 * Post-Processing - Advanced rendering effects
 * Bloom, depth of field, film grain, and other post-processing effects
 */

class PostProcessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        this.enabled = true;
        this.effects = {
            bloom: true,
            filmGrain: false,
            vignette: true,
            chromaticAberration: false
        };

        // Render targets
        this.renderTarget1 = null;
        this.renderTarget2 = null;
        
        // Post-processing materials
        this.bloomMaterial = null;
        this.compositeMaterial = null;
        
        this.init();
    }

    /**
     * Initialize post-processing
     */
    init() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Create render targets
        this.renderTarget1 = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });

        this.renderTarget2 = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });

        this.createMaterials();
        this.createQuad();
    }

    /**
     * Create post-processing materials
     */
    createMaterials() {
        // Bloom pass material
        this.bloomMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                bloomStrength: { value: 1.5 },
                bloomRadius: { value: 0.4 },
                bloomThreshold: { value: 0.85 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float bloomStrength;
                uniform float bloomRadius;
                uniform float bloomThreshold;
                varying vec2 vUv;

                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    float brightness = dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722));
                    
                    if (brightness > bloomThreshold) {
                        float bloom = (brightness - bloomThreshold) * bloomStrength;
                        texel.rgb += texel.rgb * bloom;
                    }
                    
                    gl_FragColor = texel;
                }
            `
        });

        // Composite material with multiple effects
        this.compositeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0 },
                filmGrain: { value: 0.1 },
                vignette: { value: 0.5 },
                chromaticAberration: { value: 0.002 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform float filmGrain;
                uniform float vignette;
                uniform float chromaticAberration;
                varying vec2 vUv;

                // Random function for film grain
                float random(vec2 co) {
                    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main() {
                    vec2 uv = vUv;
                    
                    // Chromatic aberration
                    float aberration = chromaticAberration;
                    vec2 direction = uv - 0.5;
                    vec2 offset = direction * aberration;
                    
                    float r = texture2D(tDiffuse, uv + offset).r;
                    float g = texture2D(tDiffuse, uv).g;
                    float b = texture2D(tDiffuse, uv - offset).b;
                    
                    vec4 color = vec4(r, g, b, 1.0);
                    
                    // Film grain
                    float grain = random(uv * time) * filmGrain;
                    color.rgb += grain;
                    
                    // Vignette
                    float dist = distance(uv, vec2(0.5));
                    float vig = smoothstep(0.8, 0.2, dist) * (1.0 - vignette) + vignette;
                    color.rgb *= vig;
                    
                    gl_FragColor = color;
                }
            `
        });
    }

    /**
     * Create full-screen quad for post-processing
     */
    createQuad() {
        this.quad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            this.compositeMaterial
        );
        
        this.orthoScene = new THREE.Scene();
        this.orthoScene.add(this.quad);
        
        this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    /**
     * Render with post-processing
     */
    render(time) {
        if (!this.enabled) {
            this.renderer.render(this.scene, this.camera);
            return;
        }

        // Render scene to texture
        this.renderer.setRenderTarget(this.renderTarget1);
        this.renderer.render(this.scene, this.camera);

        // Apply bloom if enabled
        if (this.effects.bloom) {
            this.bloomMaterial.uniforms.tDiffuse.value = this.renderTarget1.texture;
            this.quad.material = this.bloomMaterial;
            
            this.renderer.setRenderTarget(this.renderTarget2);
            this.renderer.render(this.orthoScene, this.orthoCamera);
            
            // Swap targets
            const temp = this.renderTarget1;
            this.renderTarget1 = this.renderTarget2;
            this.renderTarget2 = temp;
        }

        // Apply composite effects
        this.compositeMaterial.uniforms.tDiffuse.value = this.renderTarget1.texture;
        this.compositeMaterial.uniforms.time.value = time;
        this.compositeMaterial.uniforms.filmGrain.value = this.effects.filmGrain ? 0.1 : 0;
        this.compositeMaterial.uniforms.vignette.value = this.effects.vignette ? 0.5 : 1.0;
        this.compositeMaterial.uniforms.chromaticAberration.value = this.effects.chromaticAberration ? 0.002 : 0;
        
        this.quad.material = this.compositeMaterial;

        // Render to screen
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.orthoScene, this.orthoCamera);
    }

    /**
     * Enable/disable post-processing
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Enable/disable specific effect
     */
    setEffect(effectName, enabled) {
        if (this.effects.hasOwnProperty(effectName)) {
            this.effects[effectName] = enabled;
        }
    }

    /**
     * Set bloom parameters
     */
    setBloomParams(strength, radius, threshold) {
        this.bloomMaterial.uniforms.bloomStrength.value = strength;
        this.bloomMaterial.uniforms.bloomRadius.value = radius;
        this.bloomMaterial.uniforms.bloomThreshold.value = threshold;
    }

    /**
     * Handle window resize
     */
    resize(width, height) {
        this.renderTarget1.setSize(width, height);
        this.renderTarget2.setSize(width, height);
    }

    /**
     * Dispose post-processing
     */
    dispose() {
        this.renderTarget1.dispose();
        this.renderTarget2.dispose();
        this.bloomMaterial.dispose();
        this.compositeMaterial.dispose();
        this.quad.geometry.dispose();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PostProcessing;
}
