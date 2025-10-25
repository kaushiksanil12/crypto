/**
 * Hash Generator - SHA-256 and other cryptographic hash functions
 * Uses Web Crypto API for secure hashing
 */

class HashGenerator {
    constructor() {
        this.algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
        this.defaultAlgorithm = 'SHA-256';
    }

    /**
     * Generate SHA-256 hash from string
     */
    async sha256(data) {
        return await this.hash(data, 'SHA-256');
    }

    /**
     * Generate SHA-512 hash from string
     */
    async sha512(data) {
        return await this.hash(data, 'SHA-512');
    }

    /**
     * Generate hash using Web Crypto API
     */
    async hash(data, algorithm = 'SHA-256') {
        try {
            // Convert string to ArrayBuffer
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);

            // Generate hash
            const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);

            // Convert ArrayBuffer to hex string
            return this.bufferToHex(hashBuffer);

        } catch (error) {
            console.error('Hashing error:', error);
            throw new Error(`Failed to generate ${algorithm} hash`);
        }
    }

    /**
     * Generate hash with salt
     */
    async hashWithSalt(data, salt, algorithm = 'SHA-256') {
        const saltedData = data + salt;
        return await this.hash(saltedData, algorithm);
    }

    /**
     * Generate hash from ArrayBuffer (for binary data)
     */
    async hashBuffer(buffer, algorithm = 'SHA-256') {
        try {
            const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
            return this.bufferToHex(hashBuffer);
        } catch (error) {
            console.error('Buffer hashing error:', error);
            throw new Error(`Failed to hash buffer with ${algorithm}`);
        }
    }

    /**
     * Generate hash from File object
     */
    async hashFile(file, algorithm = 'SHA-256') {
        try {
            const buffer = await file.arrayBuffer();
            return await this.hashBuffer(buffer, algorithm);
        } catch (error) {
            console.error('File hashing error:', error);
            throw new Error('Failed to hash file');
        }
    }

    /**
     * Generate multiple hashes with different algorithms
     */
    async hashMultiple(data) {
        const hashes = {};
        
        for (const algorithm of this.algorithms) {
            try {
                hashes[algorithm] = await this.hash(data, algorithm);
            } catch (error) {
                hashes[algorithm] = null;
            }
        }

        return hashes;
    }

    /**
     * Progressive hash generation (for visualization)
     */
    async hashProgressive(data, algorithm = 'SHA-256', onProgress = null) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        // Simulate progressive hashing for visualization
        const chunks = 10;
        const chunkSize = Math.ceil(dataBuffer.length / chunks);
        
        for (let i = 0; i <= chunks; i++) {
            const progress = i / chunks;
            
            if (onProgress) {
                // Generate partial hash for visualization
                const partialData = dataBuffer.slice(0, Math.floor(dataBuffer.length * progress));
                const partialHash = await this.hashBuffer(partialData, algorithm);
                onProgress(progress, partialHash);
            }
            
            // Small delay for visualization
            await this.sleep(50);
        }

        // Return final hash
        return await this.hashBuffer(dataBuffer, algorithm);
    }

    /**
     * Compare two hashes (constant-time comparison)
     */
    compareHashes(hash1, hash2) {
        if (!hash1 || !hash2) return false;
        if (hash1.length !== hash2.length) return false;
        
        // Constant-time comparison to prevent timing attacks
        let result = 0;
        for (let i = 0; i < hash1.length; i++) {
            result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
        }
        
        return result === 0;
    }

    /**
     * Verify hash against original data
     */
    async verifyHash(data, expectedHash, algorithm = 'SHA-256') {
        const actualHash = await this.hash(data, algorithm);
        return this.compareHashes(actualHash, expectedHash);
    }

    /**
     * Verify hash with salt
     */
    async verifyHashWithSalt(data, salt, expectedHash, algorithm = 'SHA-256') {
        const actualHash = await this.hashWithSalt(data, salt, algorithm);
        return this.compareHashes(actualHash, expectedHash);
    }

    /**
     * Convert ArrayBuffer to hex string
     */
    bufferToHex(buffer) {
        const byteArray = new Uint8Array(buffer);
        const hexParts = [];
        
        for (let i = 0; i < byteArray.length; i++) {
            const hex = byteArray[i].toString(16).padStart(2, '0');
            hexParts.push(hex);
        }
        
        return hexParts.join('');
    }

    /**
     * Convert hex string to ArrayBuffer
     */
    hexToBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        
        return bytes.buffer;
    }

    /**
     * Get hash information
     */
    getHashInfo(algorithm = 'SHA-256') {
        const info = {
            'SHA-1': { bits: 160, bytes: 20, hexLength: 40, secure: false },
            'SHA-256': { bits: 256, bytes: 32, hexLength: 64, secure: true },
            'SHA-384': { bits: 384, bytes: 48, hexLength: 96, secure: true },
            'SHA-512': { bits: 512, bytes: 64, hexLength: 128, secure: true }
        };

        return info[algorithm] || null;
    }

    /**
     * Calculate hash rate (hashes per second)
     */
    async benchmarkHashRate(algorithm = 'SHA-256', iterations = 1000) {
        const testData = 'benchmark test data';
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            await this.hash(testData + i, algorithm);
        }

        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const hashRate = iterations / duration;

        return {
            algorithm: algorithm,
            iterations: iterations,
            duration: duration,
            hashRate: Math.round(hashRate),
            unit: 'hashes/second'
        };
    }

    /**
     * Generate checksum for data integrity
     */
    async generateChecksum(data, algorithm = 'SHA-256') {
        const hash = await this.hash(data, algorithm);
        return {
            checksum: hash,
            algorithm: algorithm,
            timestamp: Date.now(),
            dataLength: data.length
        };
    }

    /**
     * Verify checksum
     */
    async verifyChecksum(data, checksumInfo) {
        const newHash = await this.hash(data, checksumInfo.algorithm);
        return {
            valid: this.compareHashes(newHash, checksumInfo.checksum),
            originalChecksum: checksumInfo.checksum,
            newChecksum: newHash,
            dataLength: data.length,
            expectedLength: checksumInfo.dataLength
        };
    }

    /**
     * Sleep utility for progressive operations
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get supported algorithms
     */
    getSupportedAlgorithms() {
        return this.algorithms;
    }

    /**
     * Check if algorithm is supported
     */
    isAlgorithmSupported(algorithm) {
        return this.algorithms.includes(algorithm);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HashGenerator;
}
