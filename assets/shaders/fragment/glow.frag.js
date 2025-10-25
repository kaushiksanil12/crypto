/**
 * Glow Fragment Shader
 * Creates glowing edge effect
 */

const glowFragmentShader = `
    uniform float time;
    uniform vec3 glowColor;
    uniform float glowIntensity;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
        // Fresnel-based glow
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.5);
        
        // Pulsing glow
        float pulse = sin(time * 2.0) * 0.3 + 0.7;
        
        // Calculate glow
        vec3 glow = glowColor * fresnel * glowIntensity * pulse;
        
        // Add core color with less intensity
        vec3 coreColor = glowColor * 0.3;
        
        vec3 finalColor = coreColor + glow;
        float alpha = fresnel * 0.8 + 0.2;
        
        gl_FragColor = vec4(finalColor, alpha);
    }
`;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = glowFragmentShader;
}
