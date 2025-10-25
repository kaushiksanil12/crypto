/**
 * Face Detection - Camera-based face capture and simulation
 * Uses getUserMedia API for camera access and basic face detection
 */

class FaceDetection {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.isCapturing = false;
        this.faceTemplate = null;
    }

    /**
     * Check if camera is available
     */
    async isCameraAvailable() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Camera API not supported');
            return false;
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            return videoDevices.length > 0;
        } catch (error) {
            console.error('Error checking camera:', error);
            return false;
        }
    }

    /**
     * Initialize camera stream
     */
    async initializeCamera(videoElement, constraints = null) {
        this.videoElement = videoElement;

        const defaultConstraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user' // Front camera
            },
            audio: false
        };

        try {
            this.stream = await navigator.mediaDevices.getUserMedia(
                constraints || defaultConstraints
            );

            this.videoElement.srcObject = this.stream;
            this.videoElement.setAttribute('playsinline', '');
            this.videoElement.setAttribute('autoplay', '');
            
            return new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    this.isCapturing = true;
                    resolve({
                        success: true,
                        width: this.videoElement.videoWidth,
                        height: this.videoElement.videoHeight
                    });
                };
                this.videoElement.onerror = () => {
                    reject(new Error('Failed to load video'));
                };
            });

        } catch (error) {
            console.error('Camera initialization error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Capture face image from video stream
     */
    captureFaceImage(canvasElement = null) {
        if (!this.videoElement || !this.isCapturing) {
            throw new Error('Camera not initialized');
        }

        // Create canvas if not provided
        if (!canvasElement) {
            canvasElement = document.createElement('canvas');
            this.canvasElement = canvasElement;
        }

        const canvas = canvasElement;
        const context = canvas.getContext('2d');

        // Set canvas size to match video
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);

        return {
            imageData: imageData,
            dataURL: dataURL,
            width: canvas.width,
            height: canvas.height,
            timestamp: Date.now()
        };
    }

    /**
     * Simulate face detection (basic brightness analysis)
     * In production, use ML library like face-api.js or TensorFlow.js
     */
    detectFace(imageData) {
        const data = imageData.data;
        let totalBrightness = 0;
        let pixelCount = 0;

        // Calculate average brightness (simplified face detection simulation)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;
            pixelCount++;
        }

        const avgBrightness = totalBrightness / pixelCount;

        // Simple heuristic: if average brightness is in reasonable range, assume face detected
        const faceDetected = avgBrightness > 50 && avgBrightness < 200;
        const confidence = faceDetected ? Math.min(avgBrightness / 200, 1) : 0;

        return {
            faceDetected: faceDetected,
            confidence: confidence,
            avgBrightness: avgBrightness,
            boundingBox: faceDetected ? {
                x: imageData.width * 0.25,
                y: imageData.height * 0.2,
                width: imageData.width * 0.5,
                height: imageData.height * 0.6
            } : null
        };
    }

    /**
     * Extract face template (simplified feature extraction)
     */
    extractFaceTemplate(imageData) {
        const detection = this.detectFace(imageData);
        
        if (!detection.faceDetected) {
            return null;
        }

        // Simulate feature extraction by creating hash of image data
        const data = imageData.data;
        const features = [];

        // Sample pixels from different regions (simplified feature vector)
        const regions = 64; // 8x8 grid
        const regionWidth = Math.floor(imageData.width / 8);
        const regionHeight = Math.floor(imageData.height / 8);

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const x = j * regionWidth + regionWidth / 2;
                const y = i * regionHeight + regionHeight / 2;
                const index = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
                
                const r = data[index] || 0;
                const g = data[index + 1] || 0;
                const b = data[index + 2] || 0;
                
                features.push(Math.floor((r + g + b) / 3));
            }
        }

        this.faceTemplate = {
            features: features,
            width: imageData.width,
            height: imageData.height,
            timestamp: Date.now(),
            confidence: detection.confidence
        };

        return this.faceTemplate;
    }

    /**
     * Compare two face templates
     */
    compareFaceTemplates(template1, template2) {
        if (!template1 || !template2) {
            return { match: false, similarity: 0 };
        }

        if (template1.features.length !== template2.features.length) {
            return { match: false, similarity: 0 };
        }

        // Calculate Euclidean distance between feature vectors
        let distance = 0;
        for (let i = 0; i < template1.features.length; i++) {
            const diff = template1.features[i] - template2.features[i];
            distance += diff * diff;
        }
        distance = Math.sqrt(distance);

        // Normalize to 0-1 similarity score
        const maxDistance = Math.sqrt(template1.features.length * 255 * 255);
        const similarity = 1 - (distance / maxDistance);

        // Match if similarity is above threshold
        const threshold = 0.85;
        const match = similarity >= threshold;

        return {
            match: match,
            similarity: similarity,
            distance: distance,
            threshold: threshold
        };
    }

    /**
     * Stop camera stream
     */
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        this.isCapturing = false;
    }

    /**
     * Get current camera status
     */
    getStatus() {
        return {
            isCapturing: this.isCapturing,
            hasStream: this.stream !== null,
            hasTemplate: this.faceTemplate !== null,
            videoElement: this.videoElement !== null
        };
    }

    /**
     * Take snapshot with overlay
     */
    takeSnapshot(overlayText = 'CAPTURED') {
        const capture = this.captureFaceImage();
        
        if (this.canvasElement) {
            const context = this.canvasElement.getContext('2d');
            
            // Add overlay
            context.fillStyle = 'rgba(0, 255, 136, 0.2)';
            context.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
            
            context.font = '48px Arial';
            context.fillStyle = '#00ff88';
            context.textAlign = 'center';
            context.fillText(overlayText, this.canvasElement.width / 2, this.canvasElement.height / 2);
        }

        return capture;
    }

    /**
     * Get available video devices
     */
    async getVideoDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error getting video devices:', error);
            return [];
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FaceDetection;
}
