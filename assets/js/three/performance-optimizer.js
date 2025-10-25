/**
 * Performance Optimizer - FPS monitoring and quality adjustment
 * Automatically adjusts rendering quality based on performance
 */

class PerformanceOptimizer {
    constructor(renderer, scene) {
        this.renderer = renderer;
        this.scene = scene;
        
        this.fps = 60;
        this.fpsHistory = [];
        this.historySize = 60;
        
        this.qualityLevel = 'high'; // 'low', 'medium', 'high'
        this.autoAdjust = true;
        
        this.thresholds = {
            low: 30,
            medium: 45,
            high: 55
        };

        this.lastTime = performance.now();
        this.frames = 0;
    }

    /**
     * Update FPS counter (call in animation loop)
     */
    update() {
        this.frames++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= 1000) {
            this.fps = Math.round((this.frames * 1000) / deltaTime);
            this.fpsHistory.push(this.fps);
            
            if (this.fpsHistory.length > this.historySize) {
                this.fpsHistory.shift();
            }

            this.frames = 0;
            this.lastTime = currentTime;

            if (this.autoAdjust) {
                this.adjustQuality();
            }
        }
    }

    /**
     * Get current FPS
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Get average FPS
     */
    getAverageFPS() {
        if (this.fpsHistory.length === 0) return this.fps;
        
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.fpsHistory.length);
    }

    /**
     * Automatically adjust quality based on FPS
     */
    adjustQuality() {
        const avgFPS = this.getAverageFPS();

        if (avgFPS < this.thresholds.low && this.qualityLevel !== 'low') {
            this.setQuality('low');
        } else if (avgFPS < this.thresholds.medium && avgFPS >= this.thresholds.low && this.qualityLevel === 'high') {
            this.setQuality('medium');
        } else if (avgFPS >= this.thresholds.high && this.qualityLevel !== 'high') {
            this.setQuality('high');
        }
    }

    /**
     * Set quality level
     */
    setQuality(level) {
        this.qualityLevel = level;

        switch (level) {
            case 'low':
                this.renderer.setPixelRatio(1);
                this.renderer.shadowMap.enabled = false;
                this.disablePostProcessing();
                this.reduceParticles(0.3);
                break;

            case 'medium':
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                this.renderer.shadowMap.enabled = false;
                this.reduceParticles(0.6);
                break;

            case 'high':
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.renderer.shadowMap.enabled = true;
                this.enablePostProcessing();
                this.reduceParticles(1.0);
                break;
        }

        console.log(`Quality set to: ${level} (${this.getAverageFPS()} FPS)`);
    }

    /**
     * Reduce particle count
     */
    reduceParticles(factor) {
        this.scene.traverse((object) => {
            if (object instanceof THREE.Points) {
                object.material.size *= factor;
            }
        });
    }

    /**
     * Disable post-processing
     */
    disablePostProcessing() {
        // Placeholder for post-processing disable
    }

    /**
     * Enable post-processing
     */
    enablePostProcessing() {
        // Placeholder for post-processing enable
    }

    /**
     * Enable/disable auto-adjustment
     */
    setAutoAdjust(enabled) {
        this.autoAdjust = enabled;
    }

    /**
     * Get quality level
     */
    getQuality() {
        return this.qualityLevel;
    }

    /**
     * Get performance stats
     */
    getStats() {
        return {
            fps: this.fps,
            avgFPS: this.getAverageFPS(),
            quality: this.qualityLevel,
            pixelRatio: this.renderer.getPixelRatio()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}
