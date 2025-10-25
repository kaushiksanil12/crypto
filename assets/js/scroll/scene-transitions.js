/**
 * Scene Transitions - Multi-directional scene transition manager
 * Handles smooth transitions between different 3D scenes
 */

class SceneTransitions {
    constructor(totalScenes, options = {}) {
        this.totalScenes = totalScenes;
        this.currentScene = 0;
        this.targetScene = 0;
        this.transitionProgress = 0;
        
        this.options = {
            transitionDuration: 0.8,
            easing: 'easeInOutCubic',
            horizontal: false,
            ...options
        };

        this.sceneTitles = [];
        this.sceneObjects = [];
        this.callbacks = {
            onSceneChange: [],
            onTransitionStart: [],
            onTransitionEnd: [],
            onTransitionProgress: []
        };
    }

    /**
     * Set scene titles
     */
    setSceneTitles(titles) {
        this.sceneTitles = titles;
    }

    /**
     * Set scene 3D objects
     */
    setSceneObjects(objects) {
        this.sceneObjects = objects;
    }

    /**
     * Update based on scroll progress
     */
    update(scrollProgress) {
        const sceneProgress = scrollProgress * (this.totalScenes - 1);
        const newScene = Math.floor(sceneProgress);
        const sceneTransition = sceneProgress - newScene;

        // Check for scene change
        if (newScene !== this.currentScene) {
            this.handleSceneChange(newScene);
        }

        this.transitionProgress = sceneTransition;
        this.targetScene = newScene;

        // Trigger transition progress callbacks
        this.triggerCallbacks('onTransitionProgress', {
            currentScene: this.currentScene,
            nextScene: Math.min(newScene + 1, this.totalScenes - 1),
            progress: sceneTransition
        });

        return {
            currentScene: newScene,
            progress: sceneTransition
        };
    }

    /**
     * Handle scene change
     */
    handleSceneChange(newScene) {
        const previousScene = this.currentScene;
        this.currentScene = newScene;

        this.triggerCallbacks('onSceneChange', {
            previousScene: previousScene,
            currentScene: newScene,
            title: this.sceneTitles[newScene] || `Scene ${newScene + 1}`
        });

        // Update UI
        this.updateSceneUI(newScene);
    }

    /**
     * Update scene UI elements
     */
    updateSceneUI(sceneIndex) {
        const sceneNumber = document.getElementById('sceneNumber');
        const sceneTitle = document.getElementById('sceneTitle');

        if (sceneNumber) {
            sceneNumber.textContent = String(sceneIndex + 1).padStart(2, '0');
        }

        if (sceneTitle && this.sceneTitles[sceneIndex]) {
            sceneTitle.textContent = this.sceneTitles[sceneIndex];
        }
    }

    /**
     * Transition 3D objects between scenes
     */
    transitionObjects(sceneIndex, progress) {
        if (this.sceneObjects.length === 0) return;

        this.sceneObjects.forEach((obj, index) => {
            if (index === sceneIndex) {
                // Current scene - fully visible
                obj.visible = true;
                if (obj.material) {
                    obj.material.opacity = 1;
                    obj.material.transparent = false;
                }
            } else if (index === sceneIndex + 1 && progress > 0.7) {
                // Next scene - fading in
                obj.visible = true;
                if (obj.material) {
                    obj.material.transparent = true;
                    const fadeProgress = (progress - 0.7) / 0.3;
                    obj.material.opacity = this.easeInOut(fadeProgress);
                }
            } else if (index === sceneIndex - 1 && progress < 0.3) {
                // Previous scene - fading out
                obj.visible = true;
                if (obj.material) {
                    obj.material.transparent = true;
                    const fadeProgress = 1 - (progress / 0.3);
                    obj.material.opacity = this.easeInOut(fadeProgress);
                }
            } else {
                // Other scenes - hidden
                obj.visible = false;
            }
        });
    }

    /**
     * Horizontal scene transition
     */
    horizontalTransition(sceneIndex, progress) {
        if (this.sceneObjects.length === 0) return;

        const transitionDistance = 10;

        this.sceneObjects.forEach((obj, index) => {
            if (index === sceneIndex) {
                obj.visible = true;
                obj.position.x = -progress * transitionDistance;
                if (obj.material) {
                    obj.material.opacity = 1;
                }
            } else if (index === sceneIndex + 1) {
                obj.visible = progress > 0.3;
                obj.position.x = transitionDistance - (progress * transitionDistance);
                if (obj.material) {
                    obj.material.transparent = true;
                    obj.material.opacity = progress;
                }
            } else {
                obj.visible = false;
            }
        });
    }

    /**
     * Animate scene objects
     */
    animateSceneObject(object, sceneIndex, progress, time) {
        if (!object || !object.visible) return;

        // Different animations based on scene
        switch (sceneIndex) {
            case 0:
            case 6:
                // Torus knot - continuous rotation
                object.rotation.y += 0.005;
                object.rotation.x = Math.sin(time * 0.5) * 0.2;
                break;

            case 1:
            case 4:
                // DNA Helix - continuous rotation
                object.rotation.y += 0.005;
                break;

            case 2:
            case 5:
                // Morphing sphere - vertex displacement
                if (object.geometry && object.geometry.userData.originalPositions) {
                    const positions = object.geometry.attributes.position.array;
                    const original = object.geometry.userData.originalPositions;
                    
                    for (let i = 0; i < positions.length; i += 3) {
                        const offset = Math.sin(time + i * 0.1) * 0.2;
                        positions[i] = original[i] + offset;
                        positions[i + 1] = original[i + 1] + offset;
                        positions[i + 2] = original[i + 2] + offset;
                    }
                    object.geometry.attributes.position.needsUpdate = true;
                }
                break;

            case 3:
                // Instanced cubes - individual rotations
                if (object.isInstancedMesh) {
                    const dummy = new THREE.Object3D();
                    for (let i = 0; i < object.count; i++) {
                        object.getMatrixAt(i, dummy.matrix);
                        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                        dummy.rotation.x += 0.01;
                        dummy.rotation.y += 0.01;
                        dummy.updateMatrix();
                        object.setMatrixAt(i, dummy.matrix);
                    }
                    object.instanceMatrix.needsUpdate = true;
                }
                break;
        }

        // Scale pulse based on transition progress
        const scale = 1 + Math.sin(progress * Math.PI) * 0.15;
        object.scale.set(scale, scale, scale);
    }

    /**
     * Easing function
     */
    easeInOut(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Get current scene
     */
    getCurrentScene() {
        return this.currentScene;
    }

    /**
     * Get transition progress
     */
    getTransitionProgress() {
        return this.transitionProgress;
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
     * Trigger callbacks
     */
    triggerCallbacks(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    /**
     * Jump to specific scene
     */
    jumpToScene(sceneIndex) {
        if (sceneIndex >= 0 && sceneIndex < this.totalScenes) {
            this.currentScene = sceneIndex;
            this.updateSceneUI(sceneIndex);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SceneTransitions;
}
