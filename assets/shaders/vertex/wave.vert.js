/**
 * Wave Vertex Shader
 * Creates wave distortion effect on geometry
 */

const waveVertexShader = `
    uniform float time;
    uniform float amplitude;
    uniform float frequency;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        vNormal = normal;
        vPosition = position;
        
        vec3 pos = position;
        
        // Wave displacement
        float wave = sin(pos.x * frequency + time) * amplitude;
        wave += sin(pos.y * frequency * 1.5 + time * 1.2) * amplitude * 0.5;
        wave += sin(pos.z * frequency * 0.8 + time * 0.8) * amplitude * 0.3;
        
        pos.y += wave;
        pos.x += sin(pos.z * frequency + time) * amplitude * 0.5;
        
        vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * modelViewPosition;
    }
`;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = waveVertexShader;
}
