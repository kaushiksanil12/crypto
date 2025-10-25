/**
 * WebAuthn Handler - Fingerprint and Face ID Authentication
 * Handles browser-native biometric authentication using Web Authentication API
 */

class WebAuthnHandler {
    constructor() {
        this.isSupported = this.checkSupport();
        this.credentials = new Map(); // Store credentials in memory (demo purposes)
    }

    /**
     * Check if WebAuthn is supported in current browser
     */
    checkSupport() {
        if (!window.PublicKeyCredential) {
            console.warn('WebAuthn not supported in this browser');
            return false;
        }
        return true;
    }

    /**
     * Check if platform authenticator (fingerprint/face) is available
     */
    async isPlatformAuthenticatorAvailable() {
        if (!this.isSupported) return false;
        
        try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return available;
        } catch (error) {
            console.error('Error checking platform authenticator:', error);
            return false;
        }
    }

    /**
     * Register new biometric credential (Enrollment)
     */
    async register(username, displayName = null) {
        if (!this.isSupported) {
            throw new Error('WebAuthn not supported');
        }

        // Generate challenge (should come from server in production)
        const challenge = this.generateChallenge();
        
        // Generate user ID
        const userId = this.generateUserId();

        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: "Crypto Biometric System",
                id: window.location.hostname
            },
            user: {
                id: userId,
                name: username,
                displayName: displayName || username
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 },  // ES256
                { type: "public-key", alg: -257 } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform", // Force platform authenticator
                userVerification: "required",
                requireResidentKey: false
            },
            timeout: 60000,
            attestation: "direct"
        };

        try {
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            // Store credential info
            const credentialData = {
                id: credential.id,
                rawId: this.arrayBufferToBase64(credential.rawId),
                type: credential.type,
                username: username,
                displayName: displayName || username,
                timestamp: Date.now(),
                publicKey: this.arrayBufferToBase64(credential.response.getPublicKey()),
                attestationObject: this.arrayBufferToBase64(credential.response.attestationObject),
                clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON)
            };

            this.credentials.set(credential.id, credentialData);

            return {
                success: true,
                credentialId: credential.id,
                username: username,
                timestamp: credentialData.timestamp,
                data: credentialData
            };

        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.message,
                errorCode: error.name
            };
        }
    }

    /**
     * Authenticate using existing biometric credential (Verification)
     */
    async authenticate(credentialId = null) {
        if (!this.isSupported) {
            throw new Error('WebAuthn not supported');
        }

        const challenge = this.generateChallenge();

        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            timeout: 60000,
            userVerification: "required",
            rpId: window.location.hostname
        };

        // If specific credential ID provided, use it
        if (credentialId) {
            const storedCredential = this.credentials.get(credentialId);
            if (storedCredential) {
                publicKeyCredentialRequestOptions.allowCredentials = [{
                    id: this.base64ToArrayBuffer(storedCredential.rawId),
                    type: "public-key",
                    transports: ["internal"]
                }];
            }
        }

        try {
            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            // Verify credential exists
            const storedCredential = this.credentials.get(assertion.id);
            
            if (!storedCredential) {
                return {
                    success: false,
                    error: "Credential not found"
                };
            }

            return {
                success: true,
                credentialId: assertion.id,
                username: storedCredential.username,
                displayName: storedCredential.displayName,
                timestamp: Date.now(),
                authenticatorData: this.arrayBufferToBase64(assertion.response.authenticatorData),
                signature: this.arrayBufferToBase64(assertion.response.signature),
                userHandle: assertion.response.userHandle ? 
                    this.arrayBufferToBase64(assertion.response.userHandle) : null
            };

        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: error.message,
                errorCode: error.name
            };
        }
    }

    /**
     * Get all registered credentials for current user
     */
    getStoredCredentials() {
        return Array.from(this.credentials.values());
    }

    /**
     * Get specific credential by ID
     */
    getCredential(credentialId) {
        return this.credentials.get(credentialId);
    }

    /**
     * Delete credential
     */
    deleteCredential(credentialId) {
        return this.credentials.delete(credentialId);
    }

    /**
     * Generate random challenge
     */
    generateChallenge() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return array;
    }

    /**
     * Generate random user ID
     */
    generateUserId() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return array;
    }

    /**
     * Convert ArrayBuffer to Base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    /**
     * Convert Base64 to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Get browser and platform info
     */
    getPlatformInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            webAuthnSupported: this.isSupported,
            hasCredentials: this.credentials.size > 0
        };
    }

    /**
     * Clear all credentials (for demo/testing)
     */
    clearAllCredentials() {
        this.credentials.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebAuthnHandler;
}
