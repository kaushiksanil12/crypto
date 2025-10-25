/**
 * Biometric Storage - Secure storage simulation for biometric data
 * Simulates secure database storage using in-memory storage
 */

class BiometricStorage {
    constructor() {
        this.storage = new Map();
        this.encryptionKey = this.generateEncryptionKey();
    }

    /**
     * Store biometric enrollment data
     */
    storeEnrollment(userId, biometricData) {
        const enrollmentRecord = {
            userId: userId,
            enrollmentId: this.generateId(),
            biometricType: biometricData.type || 'unknown',
            hash: biometricData.hash,
            salt: biometricData.salt,
            algorithm: biometricData.algorithm || 'SHA-256',
            metadata: {
                enrollmentDate: new Date().toISOString(),
                deviceInfo: biometricData.deviceInfo || this.getDeviceInfo(),
                templateSize: biometricData.templateSize || 'unknown',
                confidence: biometricData.confidence || 1.0
            },
            timestamp: Date.now()
        };

        // Store with encrypted data
        const encryptedRecord = this.encrypt(enrollmentRecord);
        this.storage.set(userId, encryptedRecord);

        return {
            success: true,
            enrollmentId: enrollmentRecord.enrollmentId,
            userId: userId,
            timestamp: enrollmentRecord.timestamp
        };
    }

    /**
     * Retrieve biometric data for verification
     */
    retrieveEnrollment(userId) {
        const encryptedRecord = this.storage.get(userId);
        
        if (!encryptedRecord) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        const record = this.decrypt(encryptedRecord);

        return {
            success: true,
            data: {
                userId: record.userId,
                enrollmentId: record.enrollmentId,
                hash: record.hash,
                salt: record.salt,
                algorithm: record.algorithm,
                biometricType: record.biometricType,
                metadata: record.metadata
            }
        };
    }

    /**
     * Verify biometric against stored data
     */
    verifyBiometric(userId, providedHash) {
        const enrollmentResult = this.retrieveEnrollment(userId);
        
        if (!enrollmentResult.success) {
            return {
                success: false,
                verified: false,
                error: enrollmentResult.error
            };
        }

        const storedHash = enrollmentResult.data.hash;
        const match = this.compareHashes(storedHash, providedHash);

        // Log verification attempt
        this.logVerificationAttempt(userId, match);

        return {
            success: true,
            verified: match,
            userId: userId,
            timestamp: Date.now(),
            metadata: enrollmentResult.data.metadata
        };
    }

    /**
     * Compare two hash values
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
     * Update enrollment data
     */
    updateEnrollment(userId, updates) {
        const enrollmentResult = this.retrieveEnrollment(userId);
        
        if (!enrollmentResult.success) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        const record = this.decrypt(this.storage.get(userId));
        
        // Update fields
        if (updates.hash) record.hash = updates.hash;
        if (updates.salt) record.salt = updates.salt;
        if (updates.confidence) record.metadata.confidence = updates.confidence;
        
        record.metadata.lastUpdated = new Date().toISOString();
        record.timestamp = Date.now();

        // Re-encrypt and store
        const encryptedRecord = this.encrypt(record);
        this.storage.set(userId, encryptedRecord);

        return {
            success: true,
            userId: userId,
            timestamp: record.timestamp
        };
    }

    /**
     * Delete enrollment
     */
    deleteEnrollment(userId) {
        const existed = this.storage.has(userId);
        this.storage.delete(userId);

        return {
            success: existed,
            userId: userId,
            deleted: existed
        };
    }

    /**
     * Get all enrollments (admin function)
     */
    getAllEnrollments() {
        const enrollments = [];
        
        for (const [userId, encryptedRecord] of this.storage) {
            const record = this.decrypt(encryptedRecord);
            enrollments.push({
                userId: record.userId,
                enrollmentId: record.enrollmentId,
                biometricType: record.biometricType,
                enrollmentDate: record.metadata.enrollmentDate,
                confidence: record.metadata.confidence
            });
        }

        return enrollments;
    }

    /**
     * Log verification attempt
     */
    logVerificationAttempt(userId, success) {
        const logKey = `${userId}_log`;
        let log = this.storage.get(logKey) || [];
        
        log.push({
            userId: userId,
            timestamp: Date.now(),
            success: success,
            date: new Date().toISOString()
        });

        // Keep only last 100 attempts
        if (log.length > 100) {
            log = log.slice(-100);
        }

        this.storage.set(logKey, log);
    }

    /**
     * Get verification history
     */
    getVerificationHistory(userId) {
        const logKey = `${userId}_log`;
        return this.storage.get(logKey) || [];
    }

    /**
     * Simulate encryption (for demo purposes)
     */
    encrypt(data) {
        // In production, use Web Crypto API for real encryption
        const jsonString = JSON.stringify(data);
        return {
            encrypted: btoa(jsonString), // Base64 encoding (not real encryption)
            iv: this.generateId(),
            tag: this.generateId()
        };
    }

    /**
     * Simulate decryption
     */
    decrypt(encryptedData) {
        try {
            const jsonString = atob(encryptedData.encrypted);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    /**
     * Generate encryption key
     */
    generateEncryptionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get device information
     */
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`
        };
    }

    /**
     * Export data (for backup/migration)
     */
    exportData() {
        const data = {};
        for (const [key, value] of this.storage) {
            data[key] = value;
        }
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import data
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            for (const [key, value] of Object.entries(data)) {
                this.storage.set(key, value);
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear all data
     */
    clearAll() {
        this.storage.clear();
        return { success: true };
    }

    /**
     * Get storage statistics
     */
    getStatistics() {
        const enrollments = this.getAllEnrollments();
        const types = {};
        
        enrollments.forEach(enrollment => {
            types[enrollment.biometricType] = (types[enrollment.biometricType] || 0) + 1;
        });

        return {
            totalEnrollments: enrollments.length,
            biometricTypes: types,
            storageKeys: this.storage.size
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BiometricStorage;
}
