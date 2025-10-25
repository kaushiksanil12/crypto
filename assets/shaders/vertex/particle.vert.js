/**
 * Particle Vertex Shader
 * Advanced particle system with size and color variation
 */

const particleVertexShader = `
    uniform float time;
    uniform float scale;
    
    attribute float size;
    attribute vec3 customColor;
    
    varying vec3 vColor;
    
    void main() {
        vColor = customColor;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
        // Dynamic size based on distance and time
        float distanceScale = 1.0 / -mvPosition.z;
        float pulseScale = 1.0 + sin(time + position.x * 10.0) * 0.2;
        
        gl_PointSize = size * scale * distanceScale * pulseScale;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = particleVertexShader;
}
