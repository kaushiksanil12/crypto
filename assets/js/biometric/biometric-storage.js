/**
 * Biometric Storage - Persistent secure storage simulation for biometric data using localStorage.
 */
class BiometricStorage {
    constructor() {
        this.encryptionKey = this.generateEncryptionKey();
    }

    // Store biometric enrollment data (to localStorage)
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
        const key = `biometric-user-${userId}`;
        localStorage.setItem(key, JSON.stringify(enrollmentRecord));
        return {
            success: true,
            enrollmentId: enrollmentRecord.enrollmentId,
            userId: userId,
            timestamp: enrollmentRecord.timestamp
        };
    }

    // Retrieve biometric data for verification (from localStorage)
    retrieveEnrollment(userId) {
        const key = `biometric-user-${userId}`;
        const raw = localStorage.getItem(key);
        if (!raw) {
            return { success: false, error: 'User not found' };
        }
        let record;
        try {
            record = JSON.parse(raw);
        } catch (e) {
            return { success: false, error: 'Corrupt enrollment data' };
        }
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

    // Verify biometric against stored data
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

    // Constant-time compare two hash values
    compareHashes(hash1, hash2) {
        if (!hash1 || !hash2) return false;
        if (hash1.length !== hash2.length) return false;
        let result = 0;
        for (let i = 0; i < hash1.length; i++) {
            result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
        }
        return result === 0;
    }

    // Update enrollment data (persisted)
    updateEnrollment(userId, updates) {
        const enrollment = this.retrieveEnrollment(userId);
        if (!enrollment.success) {
            return { success: false, error: 'User not found' };
        }
        const record = enrollment.data;
        if (updates.hash) record.hash = updates.hash;
        if (updates.salt) record.salt = updates.salt;
        if (updates.confidence) record.metadata.confidence = updates.confidence;
        record.metadata.lastUpdated = new Date().toISOString();
        record.timestamp = Date.now();
        localStorage.setItem(`biometric-user-${userId}`, JSON.stringify(record));
        return { success: true, userId: userId, timestamp: record.timestamp };
    }

    // Delete enrollment (from localStorage)
    deleteEnrollment(userId) {
        const key = `biometric-user-${userId}`;
        const existed = localStorage.getItem(key) != null;
        localStorage.removeItem(key);
        localStorage.removeItem(`${userId}_log`);
        return { success: existed, userId: userId, deleted: existed };
    }

    // Get all enrollments (admin function)
    getAllEnrollments() {
        const enrollments = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('biometric-user-')) {
                try {
                    const record = JSON.parse(localStorage.getItem(key));
                    enrollments.push({
                        userId: record.userId,
                        enrollmentId: record.enrollmentId,
                        biometricType: record.biometricType,
                        enrollmentDate: record.metadata.enrollmentDate,
                        confidence: record.metadata.confidence
                    });
                } catch (e) { /* Ignore corrupt records */ }
            }
        }
        return enrollments;
    }

    // Log verification attempt (append to log in localStorage)
    logVerificationAttempt(userId, success) {
        const logKey = `${userId}_log`;
        let log = [];
        try {
            log = JSON.parse(localStorage.getItem(logKey)) || [];
        } catch (e) {}
        log.push({
            userId: userId,
            timestamp: Date.now(),
            success: success,
            date: new Date().toISOString()
        });
        if (log.length > 100) log = log.slice(-100);
        localStorage.setItem(logKey, JSON.stringify(log));
    }

    // Get verification history
    getVerificationHistory(userId) {
        const logKey = `${userId}_log`;
        try {
            return JSON.parse(localStorage.getItem(logKey)) || [];
        } catch (e) {
            return [];
        }
    }

    // Utility/misc below (not used directly by localStorage)
    encrypt(data) { return data; }
    decrypt(data) { return data; }
    generateEncryptionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`
        };
    }
    exportData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('biometric-user-') || key.endsWith('_log')) {
                data[key] = localStorage.getItem(key);
            }
        }
        return JSON.stringify(data, null, 2);
    }
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            for (const key in data) {
                localStorage.setItem(key, data[key]);
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    clearAll() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('biometric-user-') || key.endsWith('_log')) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
        return { success: true };
    }
    getStatistics() {
        const enrollments = this.getAllEnrollments();
        const types = {};
        enrollments.forEach(enrollment => {
            types[enrollment.biometricType] = (types[enrollment.biometricType] || 0) + 1;
        });
        return {
            totalEnrollments: enrollments.length,
            biometricTypes: types,
            storageKeys: localStorage.length
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BiometricStorage;
}
