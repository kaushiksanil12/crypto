/**
 * Salt Generator - Cryptographically secure random salt generation
 * Uses Web Crypto API for secure randomness
 */

class SaltGenerator {
    constructor() {
        this.defaultLength = 32; // 32 bytes = 256 bits
        this.minLength = 16;     // Minimum recommended
        this.maxLength = 128;    // Maximum practical length
    }

    /**
     * Generate random salt (hex format)
     */
    generate(length = this.defaultLength) {
        if (length < this.minLength || length > this.maxLength) {
            throw new Error(`Salt length must be between ${this.minLength} and ${this.maxLength} bytes`);
        }

        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        
        return this.arrayToHex(array);
    }

    /**
     * Generate salt as Base64
     */
    generateBase64(length = this.defaultLength) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        
        return this.arrayToBase64(array);
    }

    /**
     * Generate salt as ArrayBuffer
     */
    generateBuffer(length = this.defaultLength) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        
        return array.buffer;
    }

    /**
     * Generate multiple salts
     */
    generateMultiple(count, length = this.defaultLength) {
        const salts = [];
        
        for (let i = 0; i < count; i++) {
            salts.push({
                id: i + 1,
                salt: this.generate(length),
                length: length,
                format: 'hex',
                timestamp: Date.now()
            });
        }

        return salts;
    }

    /**
     * Generate salt with metadata
     */
    generateWithMetadata(length = this.defaultLength, purpose = 'general') {
        const salt = this.generate(length);
        
        return {
            salt: salt,
            length: length,
            format: 'hex',
            purpose: purpose,
            timestamp: Date.now(),
            id: this.generateId(),
            entropy: length * 8 // bits of entropy
        };
    }

    /**
     * Generate time-based salt (includes timestamp)
     */
    generateTimeBased(length = this.defaultLength) {
        const timestamp = Date.now().toString();
        const randomPart = this.generate(length - 8);
        
        // Combine timestamp and random data
        const timestampHex = this.stringToHex(timestamp);
        return timestampHex + randomPart;
    }

    /**
     * Generate UUID-based salt
     */
    generateUUIDBased() {
        // Generate cryptographically secure UUID v4
        const uuid = this.generateUUID();
        return uuid.replace(/-/g, '');
    }

    /**
     * Validate salt format and strength
     */
    validate(salt) {
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            strength: 'unknown'
        };

        // Check if salt exists
        if (!salt || salt.length === 0) {
            validation.valid = false;
            validation.errors.push('Salt is empty');
            return validation;
        }

        // Check format (hex)
        if (!/^[0-9a-f]+$/i.test(salt)) {
            validation.valid = false;
            validation.errors.push('Salt must be hexadecimal');
        }

        // Check length
        const byteLength = salt.length / 2;
        if (byteLength < this.minLength) {
            validation.warnings.push(`Salt is shorter than recommended (${byteLength} vs ${this.minLength} bytes)`);
            validation.strength = 'weak';
        } else if (byteLength >= this.defaultLength) {
            validation.strength = 'strong';
        } else {
            validation.strength = 'moderate';
        }

        // Check for obvious patterns
        if (/^(.)\1+$/.test(salt)) {
            validation.valid = false;
            validation.errors.push('Salt contains repeated pattern');
        }

        if (salt === '0'.repeat(salt.length)) {
            validation.valid = false;
            validation.errors.push('Salt is all zeros');
        }

        return validation;
    }

    /**
     * Calculate salt entropy
     */
    calculateEntropy(salt) {
        const byteLength = salt.length / 2;
        const bitsOfEntropy = byteLength * 8;

        return {
            bytes: byteLength,
            bits: bitsOfEntropy,
            strength: this.getEntropyStrength(bitsOfEntropy),
            hexLength: salt.length
        };
    }

    /**
     * Get entropy strength description
     */
    getEntropyStrength(bits) {
        if (bits < 64) return 'Very Weak';
        if (bits < 128) return 'Weak';
        if (bits < 192) return 'Moderate';
        if (bits < 256) return 'Strong';
        return 'Very Strong';
    }

    /**
     * Convert Uint8Array to hex string
     */
    arrayToHex(array) {
        return Array.from(array)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Convert Uint8Array to Base64
     */
    arrayToBase64(array) {
        const binary = String.fromCharCode.apply(null, array);
        return btoa(binary);
    }

    /**
     * Convert hex string to Uint8Array
     */
    hexToArray(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        
        return bytes;
    }

    /**
     * Convert Base64 to Uint8Array
     */
    base64ToArray(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        return bytes;
    }

    /**
     * Generate cryptographically secure UUID v4
     */
    generateUUID() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);

        // Set version (4) and variant bits
        array[6] = (array[6] & 0x0f) | 0x40;
        array[8] = (array[8] & 0x3f) | 0x80;

        const hex = this.arrayToHex(array);
        
        return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
    }

    /**
     * Generate simple ID
     */
    generateId() {
        return `salt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Convert string to hex
     */
    stringToHex(str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            hex += str.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return hex;
    }

    /**
     * Combine multiple salts
     */
    combineSalts(...salts) {
        return salts.join('');
    }

    /**
     * Get recommended salt length for algorithm
     */
    getRecommendedLength(algorithm = 'SHA-256') {
        const recommendations = {
            'SHA-1': 20,
            'SHA-256': 32,
            'SHA-384': 48,
            'SHA-512': 64
        };

        return recommendations[algorithm] || this.defaultLength;
    }

    /**
     * Generate salt pool (pre-generated salts)
     */
    generatePool(poolSize = 100, length = this.defaultLength) {
        const pool = [];
        
        for (let i = 0; i < poolSize; i++) {
            pool.push({
                id: i,
                salt: this.generate(length),
                used: false,
                createdAt: Date.now()
            });
        }

        return pool;
    }

    /**
     * Test randomness quality (basic check)
     */
    testRandomness(samples = 100) {
        const salts = [];
        const uniqueSalts = new Set();

        for (let i = 0; i < samples; i++) {
            const salt = this.generate();
            salts.push(salt);
            uniqueSalts.add(salt);
        }

        const duplicates = samples - uniqueSalts.size;
        const uniquenessRatio = uniqueSalts.size / samples;

        return {
            samples: samples,
            unique: uniqueSalts.size,
            duplicates: duplicates,
            uniquenessRatio: uniquenessRatio,
            quality: duplicates === 0 ? 'Excellent' : duplicates < 5 ? 'Good' : 'Poor'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaltGenerator;
}
