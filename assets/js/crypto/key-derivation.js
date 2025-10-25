/**
 * Key Derivation - PBKDF2 and key stretching functions
 * Uses Web Crypto API for secure key derivation
 */

class KeyDerivation {
    constructor() {
        this.defaultIterations = 100000; // OWASP recommendation
        this.minIterations = 10000;
        this.defaultHashAlgorithm = 'SHA-256';
        this.defaultKeyLength = 256; // bits
    }

    /**
     * Derive key using PBKDF2
     */
    async deriveKey(password, salt, iterations = this.defaultIterations, keyLength = this.defaultKeyLength) {
        try {
            // Import password as key material
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);
            
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );

            // Convert salt to ArrayBuffer
            const saltBuffer = typeof salt === 'string' 
                ? this.hexToBuffer(salt)
                : salt;

            // Derive bits using PBKDF2
            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: iterations,
                    hash: this.defaultHashAlgorithm
                },
                keyMaterial,
                keyLength
            );

            return this.bufferToHex(derivedBits);

        } catch (error) {
            console.error('Key derivation error:', error);
            throw new Error('Failed to derive key');
        }
    }

    /**
     * Derive key with timing information
     */
    async deriveKeyTimed(password, salt, iterations = this.defaultIterations) {
        const startTime = performance.now();
        const derivedKey = await this.deriveKey(password, salt, iterations);
        const endTime = performance.now();
        const duration = endTime - startTime;

        return {
            key: derivedKey,
            duration: duration,
            iterations: iterations,
            iterationsPerSecond: Math.round((iterations / duration) * 1000)
        };
    }

    /**
     * Progressive key derivation (for visualization)
     */
    async deriveKeyProgressive(password, salt, iterations = this.defaultIterations, onProgress = null) {
        const steps = 10;
        const stepSize = Math.floor(iterations / steps);
        const results = [];

        for (let i = 1; i <= steps; i++) {
            const currentIterations = stepSize * i;
            const derivedKey = await this.deriveKey(password, salt, currentIterations);
            
            const result = {
                step: i,
                iterations: currentIterations,
                key: derivedKey,
                progress: i / steps
            };

            results.push(result);

            if (onProgress) {
                onProgress(result);
            }
        }

        return results[results.length - 1];
    }

    /**
     * Benchmark PBKDF2 performance
     */
    async benchmark(iterations = this.defaultIterations, samples = 5) {
        const testPassword = 'benchmark_password_123';
        const testSalt = this.generateTestSalt();
        const durations = [];

        for (let i = 0; i < samples; i++) {
            const result = await this.deriveKeyTimed(testPassword, testSalt, iterations);
            durations.push(result.duration);
        }

        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

        return {
            iterations: iterations,
            samples: samples,
            avgDuration: avgDuration,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            iterationsPerSecond: Math.round((iterations / avgDuration) * 1000)
        };
    }

    /**
     * Calculate recommended iterations for target duration
     */
    async calculateRecommendedIterations(targetDurationMs = 100) {
        // Test with 1000 iterations
        const testResult = await this.deriveKeyTimed('test', this.generateTestSalt(), 1000);
        const iterationsPerMs = 1000 / testResult.duration;
        const recommended = Math.round(iterationsPerMs * targetDurationMs);

        return {
            recommended: Math.max(recommended, this.minIterations),
            testDuration: testResult.duration,
            targetDuration: targetDurationMs,
            estimatedDuration: recommended / iterationsPerMs
        };
    }

    /**
     * Verify derived key
     */
    async verifyKey(password, salt, expectedKey, iterations = this.defaultIterations) {
        const derivedKey = await this.deriveKey(password, salt, iterations);
        
        return {
            match: this.constantTimeCompare(derivedKey, expectedKey),
            derivedKey: derivedKey,
            expectedKey: expectedKey
        };
    }

    /**
     * Generate multiple derived keys from same password
     */
    async deriveMultipleKeys(password, salt, count = 3, keyLength = this.defaultKeyLength) {
        const keys = [];

        for (let i = 0; i < count; i++) {
            // Use different iteration counts for each key
            const iterations = this.defaultIterations + (i * 10000);
            const key = await this.deriveKey(password, salt, iterations, keyLength);
            
            keys.push({
                index: i,
                key: key,
                iterations: iterations,
                length: keyLength
            });
        }

        return keys;
    }

    /**
     * Constant-time comparison
     */
    constantTimeCompare(a, b) {
        if (a.length !== b.length) return false;

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }

        return result === 0;
    }

    /**
     * Convert hex to ArrayBuffer
     */
    hexToBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes.buffer;
    }

    /**
     * Convert ArrayBuffer to hex
     */
    bufferToHex(buffer) {
        const byteArray = new Uint8Array(buffer);
        return Array.from(byteArray)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Generate test salt
     */
    generateTestSalt() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.bufferToHex(array.buffer);
    }

    /**
     * Get iteration recommendations by use case
     */
    getIterationRecommendations() {
        return {
            minimum: { iterations: 10000, description: 'Absolute minimum (not recommended)' },
            standard: { iterations: 100000, description: 'Standard security (OWASP 2023)' },
            high: { iterations: 310000, description: 'High security (OWASP PBKDF2-HMAC-SHA256)' },
            maximum: { iterations: 1000000, description: 'Maximum security (slower)' }
        };
    }

    /**
     * Estimate security level
     */
    estimateSecurityLevel(iterations) {
        if (iterations < 10000) return 'Very Weak';
        if (iterations < 50000) return 'Weak';
        if (iterations < 100000) return 'Moderate';
        if (iterations < 500000) return 'Strong';
        return 'Very Strong';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyDerivation;
}
