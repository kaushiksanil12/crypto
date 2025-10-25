/**
 * Verification Simulation - Biometric verification process
 * Handles the complete verification workflow with hash comparison
 */

class VerificationSimulation {
    constructor() {
        this.webauthn = null;
        this.faceDetection = null;
        this.hashGenerator = null;
        this.storage = null;
        
        this.verificationResult = null;
        this.currentStep = 0;
        this.steps = [
            'capture',
            'extract',
            'retrieve',
            'hash',
            'compare'
        ];
        
        this.callbacks = {
            onStepChange: [],
            onProgress: [],
            onComplete: [],
            onError: []
        };
    }

    /**
     * Initialize verification simulation
     */
    async init() {
        // Initialize required modules
        if (typeof WebAuthnHandler !== 'undefined') {
            this.webauthn = new WebAuthnHandler();
        }
        
        if (typeof FaceDetection !== 'undefined') {
            this.faceDetection = new FaceDetection();
        }
        
        if (typeof HashGenerator !== 'undefined') {
            this.hashGenerator = new HashGenerator();
        }
        
        if (typeof BiometricStorage !== 'undefined') {
            this.storage = new BiometricStorage();
        }

        return {
            success: true,
            modules: {
                webauthn: !!this.webauthn,
                faceDetection: !!this.faceDetection,
                hashGenerator: !!this.hashGenerator,
                storage: !!this.storage
            }
        };
    }

    /**
     * Verify fingerprint
     */
    async verifyFingerprint(username) {
        try {
            this.resetVerification();
            this.triggerStepChange('capture', 0);

            // Step 1: Capture biometric
            this.triggerProgress(0.2, 'Capturing fingerprint...');
            
            if (!this.webauthn) {
                throw new Error('WebAuthn not initialized');
            }

            const assertion = await this.webauthn.authenticate();
            
            if (!assertion.success) {
                throw new Error(assertion.error);
            }

            this.triggerProgress(0.4, 'Fingerprint captured');
            this.triggerStepChange('extract', 1);

            // Step 2: Extract features
            await this.sleep(500);
            const biometricTemplate = this.simulateBiometricExtraction(assertion);
            this.triggerProgress(0.5, 'Features extracted');
            this.triggerStepChange('retrieve', 2);

            // Step 3: Retrieve stored data
            await this.sleep(300);
            const enrollment = this.storage.retrieveEnrollment(username);
            
            if (!enrollment.success) {
                throw new Error('User not enrolled');
            }

            const storedSalt = enrollment.data.salt;
            const storedHash = enrollment.data.hash;
            
            this.triggerProgress(0.6, 'Retrieved stored data');
            this.triggerStepChange('hash', 3);

            // Step 4: Generate hash with stored salt
            await this.sleep(500);
            const computedHash = await this.hashGenerator.hashWithSalt(biometricTemplate, storedSalt);
            this.triggerProgress(0.8, 'Hash computed');
            this.triggerStepChange('compare', 4);

            // Step 5: Compare hashes
            await this.sleep(300);
            const match = this.hashGenerator.compareHashes(computedHash, storedHash);
            
            const verificationResult = this.storage.verifyBiometric(username, computedHash);
            
            this.triggerProgress(1.0, match ? 'Verification successful' : 'Verification failed');

            this.verificationResult = {
                success: match,
                username: username,
                type: 'fingerprint',
                storedHash: storedHash,
                computedHash: computedHash,
                match: match,
                timestamp: Date.now(),
                similarity: this.calculateSimilarity(storedHash, computedHash)
            };

            this.triggerComplete(this.verificationResult);

            return {
                success: true,
                verified: match,
                data: this.verificationResult
            };

        } catch (error) {
            this.triggerError(error);
            return {
                success: false,
                verified: false,
                error: error.message
            };
        }
    }

    /**
     * Verify face
     */
    async verifyFace(username, videoElement) {
        try {
            this.resetVerification();
            this.triggerStepChange('capture', 0);

            // Step 1: Initialize camera
            this.triggerProgress(0.1, 'Initializing camera...');
            
            if (!this.faceDetection) {
                throw new Error('Face detection not initialized');
            }

            const cameraInit = await this.faceDetection.initializeCamera(videoElement);
            
            if (!cameraInit.success) {
                throw new Error('Failed to initialize camera');
            }

            this.triggerProgress(0.2, 'Camera ready');
            await this.sleep(1000);

            // Step 2: Capture face
            this.triggerProgress(0.3, 'Capturing face...');
            const capture = this.faceDetection.captureFaceImage();
            
            this.triggerProgress(0.4, 'Face captured');
            this.triggerStepChange('extract', 1);

            // Step 3: Extract face template
            await this.sleep(500);
            const template = this.faceDetection.extractFaceTemplate(capture.imageData);
            
            if (!template) {
                throw new Error('No face detected');
            }

            this.triggerProgress(0.5, 'Features extracted');
            this.triggerStepChange('retrieve', 2);

            // Step 4: Retrieve stored data
            await this.sleep(300);
            const enrollment = this.storage.retrieveEnrollment(username);
            
            if (!enrollment.success) {
                throw new Error('User not enrolled');
            }

            const storedSalt = enrollment.data.salt;
            const storedHash = enrollment.data.hash;
            
            this.triggerProgress(0.6, 'Retrieved stored data');
            this.triggerStepChange('hash', 3);

            // Step 5: Generate hash
            await this.sleep(500);
            const templateString = JSON.stringify(template.features);
            const computedHash = await this.hashGenerator.hashWithSalt(templateString, storedSalt);
            this.triggerProgress(0.8, 'Hash computed');
            this.triggerStepChange('compare', 4);

            // Step 6: Compare hashes
            await this.sleep(300);
            const match = this.hashGenerator.compareHashes(computedHash, storedHash);
            
            // Stop camera
            this.faceDetection.stopCamera();
            
            this.triggerProgress(1.0, match ? 'Verification successful' : 'Verification failed');

            this.verificationResult = {
                success: match,
                username: username,
                type: 'face',
                storedHash: storedHash,
                computedHash: computedHash,
                match: match,
                timestamp: Date.now(),
                similarity: this.calculateSimilarity(storedHash, computedHash),
                faceConfidence: template.confidence
            };

            this.triggerComplete(this.verificationResult);

            return {
                success: true,
                verified: match,
                data: this.verificationResult
            };

        } catch (error) {
            if (this.faceDetection) {
                this.faceDetection.stopCamera();
            }
            this.triggerError(error);
            return {
                success: false,
                verified: false,
                error: error.message
            };
        }
    }

    /**
     * Simulate biometric extraction
     */
    simulateBiometricExtraction(assertionData) {
    // ALWAYS return the same string for demo
    return "demo-static-biometric-template";
}


    /**
     * Calculate hash similarity (for visualization)
     */
    calculateSimilarity(hash1, hash2) {
        if (hash1 === hash2) return 1.0;
        
        let matches = 0;
        const length = Math.min(hash1.length, hash2.length);
        
        for (let i = 0; i < length; i++) {
            if (hash1[i] === hash2[i]) {
                matches++;
            }
        }
        
        return matches / length;
    }

    /**
     * Reset verification state
     */
    resetVerification() {
        this.verificationResult = null;
        this.currentStep = 0;
    }

    /**
     * Get verification result
     */
    getVerificationResult() {
        return this.verificationResult;
    }

    /**
     * Get current step
     */
    getCurrentStep() {
        return this.currentStep;
    }

    /**
     * Register callback
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * Trigger step change
     */
    triggerStepChange(stepName, stepIndex) {
        this.currentStep = stepIndex;
        this.callbacks.onStepChange.forEach(cb => cb({ step: stepName, index: stepIndex }));
    }

    /**
     * Trigger progress
     */
    triggerProgress(progress, message) {
        this.callbacks.onProgress.forEach(cb => cb({ progress, message }));
    }

    /**
     * Trigger complete
     */
    triggerComplete(data) {
        this.callbacks.onComplete.forEach(cb => cb(data));
    }

    /**
     * Trigger error
     */
    triggerError(error) {
        this.callbacks.onError.forEach(cb => cb(error));
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VerificationSimulation;
}
