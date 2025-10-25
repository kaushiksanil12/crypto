/**
 * Enrollment Simulation - Biometric enrollment process
 * Handles the complete enrollment workflow with visualization
 */

class EnrollmentSimulation {
    constructor() {
        this.webauthn = null;
        this.faceDetection = null;
        this.hashGenerator = null;
        this.saltGenerator = null;
        this.storage = null;
        
        this.enrollmentData = null;
        this.currentStep = 0;
        this.steps = [
            'capture',
            'extract',
            'salt',
            'hash',
            'store'
        ];
        
        this.callbacks = {
            onStepChange: [],
            onProgress: [],
            onComplete: [],
            onError: []
        };
    }

    /**
     * Initialize enrollment simulation
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
        
        if (typeof SaltGenerator !== 'undefined') {
            this.saltGenerator = new SaltGenerator();
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
                saltGenerator: !!this.saltGenerator,
                storage: !!this.storage
            }
        };
    }

    /**
     * Start fingerprint enrollment
     */
    async enrollFingerprint(username) {
        try {
            this.resetEnrollment();
            this.triggerStepChange('capture', 0);

            // Step 1: Capture biometric
            this.triggerProgress(0.2, 'Capturing fingerprint...');
            
            if (!this.webauthn) {
                throw new Error('WebAuthn not initialized');
            }

            const credential = await this.webauthn.register(username);
            
            if (!credential.success) {
                throw new Error(credential.error);
            }

            this.triggerProgress(0.4, 'Fingerprint captured');
            this.triggerStepChange('extract', 1);

            // Step 2: Extract features (simulated)
            await this.sleep(500);
            const biometricTemplate = this.simulateBiometricExtraction(credential.data);
            this.triggerProgress(0.5, 'Features extracted');
            this.triggerStepChange('salt', 2);

            // Step 3: Generate salt
            await this.sleep(300);
            const salt = this.saltGenerator.generate(32);
            this.triggerProgress(0.6, 'Salt generated');
            this.triggerStepChange('hash', 3);

            // Step 4: Generate hash
            await this.sleep(500);
            const hash = await this.hashGenerator.hashWithSalt(biometricTemplate, salt);
            this.triggerProgress(0.8, 'Hash computed');
            this.triggerStepChange('store', 4);

            // Step 5: Store
            await this.sleep(300);
            const stored = this.storage.storeEnrollment(username, {
                type: 'fingerprint',
                hash: hash,
                salt: salt,
                algorithm: 'SHA-256',
                credentialId: credential.credentialId,
                deviceInfo: 'WebAuthn Platform Authenticator',
                templateSize: biometricTemplate.length + ' bytes',
                confidence: 0.98
            });

            this.triggerProgress(1.0, 'Enrollment complete');

            this.enrollmentData = {
                username: username,
                type: 'fingerprint',
                hash: hash,
                salt: salt,
                credentialId: credential.credentialId,
                timestamp: Date.now()
            };

            this.triggerComplete(this.enrollmentData);

            return {
                success: true,
                data: this.enrollmentData
            };

        } catch (error) {
            this.triggerError(error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start face enrollment
     */
    async enrollFace(username, videoElement) {
        try {
            this.resetEnrollment();
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
            await this.sleep(1000); // Give user time to position face

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
            this.triggerStepChange('salt', 2);

            // Step 4: Generate salt
            await this.sleep(300);
            const salt = this.saltGenerator.generate(32);
            this.triggerProgress(0.6, 'Salt generated');
            this.triggerStepChange('hash', 3);

            // Step 5: Generate hash
            await this.sleep(500);
            const templateString = JSON.stringify(template.features);
            const hash = await this.hashGenerator.hashWithSalt(templateString, salt);
            this.triggerProgress(0.8, 'Hash computed');
            this.triggerStepChange('store', 4);

            // Step 6: Store
            await this.sleep(300);
            const stored = this.storage.storeEnrollment(username, {
                type: 'face',
                hash: hash,
                salt: salt,
                algorithm: 'SHA-256',
                deviceInfo: 'Camera',
                templateSize: templateString.length + ' bytes',
                confidence: template.confidence
            });

            // Stop camera
            this.faceDetection.stopCamera();

            this.triggerProgress(1.0, 'Enrollment complete');

            this.enrollmentData = {
                username: username,
                type: 'face',
                hash: hash,
                salt: salt,
                faceTemplate: template,
                timestamp: Date.now()
            };

            this.triggerComplete(this.enrollmentData);

            return {
                success: true,
                data: this.enrollmentData
            };

        } catch (error) {
            if (this.faceDetection) {
                this.faceDetection.stopCamera();
            }
            this.triggerError(error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Simulate biometric template extraction
     */
    simulateBiometricExtraction(assertionData) {
    // ALWAYS return the same string for demo
    return "demo-static-biometric-template";
}


    /**
     * Reset enrollment state
     */
    resetEnrollment() {
        this.enrollmentData = null;
        this.currentStep = 0;
    }

    /**
     * Get enrollment data
     */
    getEnrollmentData() {
        return this.enrollmentData;
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
    module.exports = EnrollmentSimulation;
}
