/**
 * Holographic Fragment Shader
 * Creates holographic/iridescent effect
 */

const holographicFragmentShader = `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
        // Fresnel effect
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
        
        // Iridescent color shifting
        float colorShift = sin(vPosition.y * 5.0 + time) * 0.5 + 0.5;
        
        vec3 color = mix(color1, color2, colorShift);
        color = mix(color, color3, fresnel);
        
        // Add scanline effect
        float scanline = sin(vPosition.y * 50.0 + time * 2.0) * 0.1 + 0.9;
        color *= scanline;
        
        // Add holographic flicker
        float flicker = sin(time * 10.0) * 0.05 + 0.95;
        color *= flicker;
        
        // Enhance edges with fresnel
        color += fresnel * 0.5;
        
        gl_FragColor = vec4(color, 0.8 + fresnel * 0.2);
    }
`;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = holographicFragmentShader;
}
