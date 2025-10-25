/**
 * Flow Animator - Animated process flow visualization
 * Visualizes enrollment and verification workflows
 */

class FlowAnimator {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
        this.width = canvasElement ? canvasElement.width : 800;
        this.height = canvasElement ? canvasElement.height : 600;
        
        this.nodes = [];
        this.connections = [];
        this.particles = [];
        this.currentStep = -1;
        this.isAnimating = false;
        
        this.colors = {
            primary: '#00ff88',
            secondary: '#00ccff',
            accent: '#ff6b35',
            background: '#0a0a0a',
            node: '#1a1a1a',
            nodeActive: '#00ff88',
            text: '#ffffff'
        };
    }

    /**
     * Create enrollment flow
     */
    createEnrollmentFlow() {
        this.nodes = [
            { id: 'capture', x: 100, y: 300, label: 'Capture\nBiometric', active: false },
            { id: 'extract', x: 250, y: 300, label: 'Extract\nFeatures', active: false },
            { id: 'salt', x: 400, y: 300, label: 'Generate\nSalt', active: false },
            { id: 'hash', x: 550, y: 300, label: 'Compute\nHash', active: false },
            { id: 'store', x: 700, y: 300, label: 'Store\nSecurely', active: false }
        ];

        this.connections = [
            { from: 'capture', to: 'extract' },
            { from: 'extract', to: 'salt' },
            { from: 'salt', to: 'hash' },
            { from: 'hash', to: 'store' }
        ];

        this.currentStep = -1;
        this.particles = [];
    }

    /**
     * Create verification flow
     */
    createVerificationFlow() {
        this.nodes = [
            { id: 'capture', x: 100, y: 250, label: 'Capture\nBiometric', active: false },
            { id: 'extract', x: 250, y: 250, label: 'Extract\nFeatures', active: false },
            { id: 'retrieve', x: 400, y: 150, label: 'Retrieve\nStored Data', active: false },
            { id: 'hash', x: 550, y: 250, label: 'Compute\nHash', active: false },
            { id: 'compare', x: 700, y: 250, label: 'Compare\nHashes', active: false }
        ];

        this.connections = [
            { from: 'capture', to: 'extract' },
            { from: 'extract', to: 'hash' },
            { from: 'retrieve', to: 'hash' },
            { from: 'hash', to: 'compare' }
        ];

        this.currentStep = -1;
        this.particles = [];
    }

    /**
     * Animate to step
     */
    async animateToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.nodes.length) return;

        this.currentStep = stepIndex;
        
        // Activate current node
        this.nodes.forEach((node, index) => {
            node.active = index <= stepIndex;
        });

        // Create particles along connections
        if (stepIndex > 0) {
            const prevNode = this.nodes[stepIndex - 1];
            const currentNode = this.nodes[stepIndex];
            
            this.createParticleFlow(prevNode, currentNode);
        }

        // Draw frame
        this.draw();
    }

    /**
     * Create particle flow between nodes
     */
    createParticleFlow(fromNode, toNode) {
        const particleCount = 10;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: fromNode.x,
                y: fromNode.y,
                targetX: toNode.x,
                targetY: toNode.y,
                progress: i / particleCount,
                speed: 0.02,
                size: 3,
                color: this.colors.primary
            });
        }
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animationLoop();
    }

    /**
     * Stop animation
     */
    stopAnimation() {
        this.isAnimating = false;
    }

    /**
     * Animation loop
     */
    animationLoop() {
        if (!this.isAnimating) return;

        this.updateParticles();
        this.draw();

        requestAnimationFrame(() => this.animationLoop());
    }

    /**
     * Update particles
     */
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.progress += particle.speed;
            
            if (particle.progress >= 1) {
                return false; // Remove completed particles
            }

            // Update position
            particle.x = particle.x + (particle.targetX - particle.x) * particle.speed;
            particle.y = particle.y + (particle.targetY - particle.y) * particle.speed;

            return true;
        });
    }

    /**
     * Draw flow
     */
    draw() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw connections
        this.drawConnections();

        // Draw nodes
        this.drawNodes();

        // Draw particles
        this.drawParticles();
    }

    /**
     * Draw connections between nodes
     */
    drawConnections() {
        this.connections.forEach(conn => {
            const fromNode = this.nodes.find(n => n.id === conn.from);
            const toNode = this.nodes.find(n => n.id === conn.to);

            if (!fromNode || !toNode) return;

            this.ctx.strokeStyle = fromNode.active && toNode.active 
                ? this.colors.nodeActive 
                : 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
            this.ctx.stroke();

            // Draw arrow
            if (fromNode.active && toNode.active) {
                this.drawArrow(fromNode.x, fromNode.y, toNode.x, toNode.y);
            }
        });
    }

    /**
     * Draw arrow
     */
    drawArrow(fromX, fromY, toX, toY) {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowLength = 10;
        const arrowWidth = 5;

        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;

        this.ctx.save();
        this.ctx.translate(midX, midY);
        this.ctx.rotate(angle);

        this.ctx.fillStyle = this.colors.nodeActive;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-arrowLength, -arrowWidth);
        this.ctx.lineTo(-arrowLength, arrowWidth);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    /**
     * Draw nodes
     */
    drawNodes() {
        this.nodes.forEach(node => {
            const radius = 40;

            // Draw node circle
            this.ctx.fillStyle = node.active ? this.colors.nodeActive : this.colors.node;
            this.ctx.strokeStyle = node.active ? this.colors.nodeActive : 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 3;

            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Draw node label
            this.ctx.fillStyle = node.active ? this.colors.background : this.colors.text;
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            const lines = node.label.split('\n');
            lines.forEach((line, index) => {
                const offsetY = (index - (lines.length - 1) / 2) * 15;
                this.ctx.fillText(line, node.x, node.y + offsetY);
            });
        });
    }

    /**
     * Draw particles
     */
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Reset animation
     */
    reset() {
        this.currentStep = -1;
        this.particles = [];
        this.nodes.forEach(node => node.active = false);
        this.draw();
    }

    /**
     * Resize canvas
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        this.draw();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowAnimator;
}
