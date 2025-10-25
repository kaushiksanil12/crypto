/**
 * Hash Visualizer - Real-time hash generation visualization
 * Displays hash computation process step-by-step
 */

class HashVisualizer {
    constructor(containerElement) {
        this.container = containerElement;
        this.hashGenerator = null;
        this.currentHash = '';
        this.currentSalt = '';
        this.animationSpeed = 50; // ms per character
        
        this.init();
    }

    /**
     * Initialize visualizer
     */
    init() {
        if (typeof HashGenerator !== 'undefined') {
            this.hashGenerator = new HashGenerator();
        }
        
        this.createUI();
    }

    /**
     * Create UI elements
     */
    createUI() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="hash-visualizer">
                <div class="visualizer-section">
                    <label>Input Data:</label>
                    <div class="input-display" id="inputDisplay"></div>
                </div>
                
                <div class="visualizer-section">
                    <label>Salt:</label>
                    <div class="salt-display" id="saltDisplay"></div>
                </div>
                
                <div class="visualizer-section">
                    <label>Combined (Input + Salt):</label>
                    <div class="combined-display" id="combinedDisplay"></div>
                </div>
                
                <div class="visualizer-section">
                    <label>SHA-256 Hash:</label>
                    <div class="hash-display" id="hashDisplay"></div>
                    <div class="hash-progress" id="hashProgress"></div>
                </div>
                
                <div class="visualizer-stats">
                    <div class="stat">
                        <span class="stat-label">Algorithm:</span>
                        <span class="stat-value" id="algorithm">SHA-256</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Hash Length:</span>
                        <span class="stat-value" id="hashLength">0 / 64</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Entropy:</span>
                        <span class="stat-value" id="entropy">0 bits</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Visualize hash generation
     */
    async visualizeHash(inputData, salt = null, algorithm = 'SHA-256') {
        if (!this.hashGenerator) {
            console.error('Hash generator not initialized');
            return;
        }

        // Generate salt if not provided
        if (!salt && typeof SaltGenerator !== 'undefined') {
            const saltGen = new SaltGenerator();
            salt = saltGen.generate(32);
        }

        this.currentSalt = salt || '';

        // Update UI
        this.updateInput(inputData);
        await this.animateSalt(salt);
        await this.animateCombined(inputData, salt);

        // Generate hash with animation
        const hash = await this.animateHashGeneration(inputData, salt, algorithm);
        
        this.currentHash = hash;

        return {
            hash: hash,
            salt: salt,
            algorithm: algorithm
        };
    }

    /**
     * Update input display
     */
    updateInput(data) {
        const inputDisplay = document.getElementById('inputDisplay');
        if (inputDisplay) {
            inputDisplay.textContent = this.truncateString(data, 100);
        }
    }

    /**
     * Animate salt display
     */
    async animateSalt(salt) {
        const saltDisplay = document.getElementById('saltDisplay');
        if (!saltDisplay) return;

        saltDisplay.textContent = '';
        
        for (let i = 0; i < salt.length; i++) {
            saltDisplay.textContent += salt[i];
            await this.sleep(5);
        }
    }

    /**
     * Animate combined data
     */
    async animateCombined(input, salt) {
        const combinedDisplay = document.getElementById('combinedDisplay');
        if (!combinedDisplay) return;

        const combined = input + salt;
        combinedDisplay.textContent = '';
        
        const displayText = this.truncateString(combined, 150);
        
        for (let i = 0; i < displayText.length; i++) {
            combinedDisplay.textContent += displayText[i];
            await this.sleep(3);
        }
    }

    /**
     * Animate hash generation
     */
    async animateHashGeneration(input, salt, algorithm) {
        const hashDisplay = document.getElementById('hashDisplay');
        const hashProgress = document.getElementById('hashProgress');
        const hashLength = document.getElementById('hashLength');
        
        if (!hashDisplay) return null;

        // Clear display
        hashDisplay.textContent = '';
        if (hashProgress) hashProgress.style.width = '0%';

        // Generate actual hash
        const finalHash = await this.hashGenerator.hashWithSalt(input, salt, algorithm);

        // Animate hash appearance
        for (let i = 0; i < finalHash.length; i++) {
            hashDisplay.textContent += finalHash[i];
            
            const progress = ((i + 1) / finalHash.length) * 100;
            if (hashProgress) {
                hashProgress.style.width = `${progress}%`;
            }
            
            if (hashLength) {
                hashLength.textContent = `${i + 1} / ${finalHash.length}`;
            }
            
            await this.sleep(this.animationSpeed);
        }

        // Update entropy
        this.updateEntropy(finalHash);

        return finalHash;
    }

    /**
     * Update entropy display
     */
    updateEntropy(hash) {
        const entropyElement = document.getElementById('entropy');
        if (!entropyElement) return;

        const bits = hash.length * 4; // Each hex char = 4 bits
        entropyElement.textContent = `${bits} bits`;
    }

    /**
     * Compare two hashes visually
     */
    async compareHashes(hash1, hash2) {
        const hashDisplay = document.getElementById('hashDisplay');
        if (!hashDisplay) return;

        hashDisplay.innerHTML = '';

        for (let i = 0; i < Math.max(hash1.length, hash2.length); i++) {
            const char1 = hash1[i] || '';
            const char2 = hash2[i] || '';
            
            const span = document.createElement('span');
            span.textContent = char1 || char2;
            span.className = char1 === char2 ? 'hash-char-match' : 'hash-char-diff';
            
            hashDisplay.appendChild(span);
            await this.sleep(10);
        }

        const similarity = this.calculateSimilarity(hash1, hash2);
        return similarity;
    }

    /**
     * Calculate similarity percentage
     */
    calculateSimilarity(hash1, hash2) {
        let matches = 0;
        const length = Math.min(hash1.length, hash2.length);
        
        for (let i = 0; i < length; i++) {
            if (hash1[i] === hash2[i]) {
                matches++;
            }
        }
        
        return (matches / length) * 100;
    }

    /**
     * Show avalanche effect
     */
    async showAvalancheEffect(input) {
        const original = await this.hashGenerator.sha256(input);
        const modified = await this.hashGenerator.sha256(input + 'X');

        await this.compareHashes(original, modified);

        return {
            original: original,
            modified: modified,
            inputChange: '1 character',
            hashChange: this.countDifferences(original, modified)
        };
    }

    /**
     * Count differences between hashes
     */
    countDifferences(hash1, hash2) {
        let diffs = 0;
        for (let i = 0; i < Math.min(hash1.length, hash2.length); i++) {
            if (hash1[i] !== hash2[i]) diffs++;
        }
        return diffs;
    }

    /**
     * Clear visualizer
     */
    clear() {
        const displays = ['inputDisplay', 'saltDisplay', 'combinedDisplay', 'hashDisplay'];
        displays.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '';
        });

        const hashProgress = document.getElementById('hashProgress');
        if (hashProgress) hashProgress.style.width = '0%';

        const hashLength = document.getElementById('hashLength');
        if (hashLength) hashLength.textContent = '0 / 64';
    }

    /**
     * Set animation speed
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    /**
     * Get current hash
     */
    getCurrentHash() {
        return this.currentHash;
    }

    /**
     * Get current salt
     */
    getCurrentSalt() {
        return this.currentSalt;
    }

    /**
     * Truncate string for display
     */
    truncateString(str, maxLength) {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '...';
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
    module.exports = HashVisualizer;
}
