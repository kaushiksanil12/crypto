/**
 * Crypto Utilities - General cryptographic utility functions
 * Helper functions for encryption, encoding, and crypto operations
 */

class CryptoUtils {
    constructor() {
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    /**
     * Generate cryptographically secure random bytes
     */
    randomBytes(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    }

    /**
     * Generate random integer in range
     */
    randomInt(min, max) {
        const range = max - min;
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return min + (array[0] % range);
    }

    /**
     * Generate random string (alphanumeric)
     */
    randomString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomValues = this.randomBytes(length);
        
        for (let i = 0; i < length; i++) {
            result += chars[randomValues[i] % chars.length];
        }
        
        return result;
    }

    /**
     * XOR two byte arrays
     */
    xor(buffer1, buffer2) {
        const array1 = new Uint8Array(buffer1);
        const array2 = new Uint8Array(buffer2);
        const result = new Uint8Array(array1.length);

        for (let i = 0; i < array1.length; i++) {
            result[i] = array1[i] ^ array2[i % array2.length];
        }

        return result.buffer;
    }

    /**
     * Constant-time string comparison
     */
    constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }

        return result === 0;
    }

    /**
     * Convert string to ArrayBuffer
     */
    stringToBuffer(str) {
        return this.encoder.encode(str).buffer;
    }

    /**
     * Convert ArrayBuffer to string
     */
    bufferToString(buffer) {
        return this.decoder.decode(buffer);
    }

    /**
     * Convert ArrayBuffer to hex string
     */
    bufferToHex(buffer) {
        const byteArray = new Uint8Array(buffer);
        return Array.from(byteArray)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
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
     * Convert ArrayBuffer to Base64
     */
    bufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return btoa(binary);
    }

    /**
     * Convert Base64 to ArrayBuffer
     */
    base64ToBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        return bytes.buffer;
    }

    /**
     * Simple encryption using XOR (for demo purposes only)
     */
    simpleEncrypt(data, key) {
        const dataBuffer = this.stringToBuffer(data);
        const keyBuffer = this.stringToBuffer(key);
        const encrypted = this.xor(dataBuffer, keyBuffer);
        
        return this.bufferToBase64(encrypted);
    }

    /**
     * Simple decryption using XOR (for demo purposes only)
     */
    simpleDecrypt(encryptedData, key) {
        const encryptedBuffer = this.base64ToBuffer(encryptedData);
        const keyBuffer = this.stringToBuffer(key);
        const decrypted = this.xor(encryptedBuffer, keyBuffer);
        
        return this.bufferToString(decrypted);
    }

    /**
     * Generate cryptographic nonce
     */
    generateNonce(length = 16) {
        return this.bufferToBase64(this.randomBytes(length));
    }

    /**
     * Calculate Hamming distance between two strings
     */
    hammingDistance(str1, str2) {
        if (str1.length !== str2.length) {
            throw new Error('Strings must be of equal length');
        }

        let distance = 0;
        for (let i = 0; i < str1.length; i++) {
            if (str1[i] !== str2[i]) {
                distance++;
            }
        }

        return distance;
    }

    /**
     * Check if Web Crypto API is available
     */
    isWebCryptoAvailable() {
        return !!(window.crypto && window.crypto.subtle);
    }

    /**
     * Get crypto capabilities
     */
    getCryptoCapabilities() {
        return {
            webCrypto: this.isWebCryptoAvailable(),
            getRandomValues: !!window.crypto?.getRandomValues,
            subtle: !!window.crypto?.subtle,
            algorithms: this.isWebCryptoAvailable() ? [
                'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512',
                'AES-CBC', 'AES-GCM', 'RSA-OAEP', 'ECDH'
            ] : []
        };
    }

    /**
     * Format bytes to human-readable size
     */
    formatByteSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * Calculate entropy of a string
     */
    calculateEntropy(str) {
        const frequency = {};
        
        for (const char of str) {
            frequency[char] = (frequency[char] || 0) + 1;
        }

        let entropy = 0;
        const length = str.length;

        for (const count of Object.values(frequency)) {
            const probability = count / length;
            entropy -= probability * Math.log2(probability);
        }

        return {
            entropy: entropy,
            maxEntropy: Math.log2(length),
            normalized: entropy / Math.log2(length),
            bits: entropy * length
        };
    }

    /**
     * Visualize hash as color
     */
    hashToColor(hash) {
        // Take first 6 characters as RGB hex color
        const colorHex = hash.substring(0, 6);
        const r = parseInt(colorHex.substring(0, 2), 16);
        const g = parseInt(colorHex.substring(2, 4), 16);
        const b = parseInt(colorHex.substring(4, 6), 16);

        return {
            hex: `#${colorHex}`,
            rgb: `rgb(${r}, ${g}, ${b})`,
            r: r,
            g: g,
            b: b
        };
    }

    /**
     * Generate QR-friendly data format
     */
    toQRFormat(data) {
        return this.bufferToBase64(this.stringToBuffer(JSON.stringify(data)));
    }

    /**
     * Parse QR-friendly data
     */
    fromQRFormat(qrData) {
        try {
            const json = this.bufferToString(this.base64ToBuffer(qrData));
            return JSON.parse(json);
        } catch (error) {
            throw new Error('Invalid QR data format');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptoUtils;
}
