/**
 * Particle Fragment Shader
 * Renders particles with soft edges
 */

const particleFragmentShader = `
    uniform float time;
    
    varying vec3 vColor;
    
    void main() {
        // Circular particle shape with soft edges
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        // Soft edge falloff
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        
        // Pulse effect
        float pulse = sin(time * 3.0 + dist * 10.0) * 0.2 + 0.8;
        
        // Final color with glow
        vec3 finalColor = vColor * pulse;
        
        gl_FragColor = vec4(finalColor, alpha * 0.8);
    }
`;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = particleFragmentShader;
}
