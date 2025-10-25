/**
 * Geometry Factory - Creates complex 3D geometries
 * DNA helix, organic shapes, procedural geometry
 */

class GeometryFactory {
    constructor() {
        this.geometries = new Map();
    }

    /**
     * Create DNA Helix
     */
    createDNAHelix(options = {}) {
        const config = {
            helixPoints: 100,
            radius: 1.5,
            height: 8,
            sphereSize: 0.15,
            barInterval: 5,
            color1: 0x00ff88,
            color2: 0x00ccff,
            barColor: 0xff6b35,
            ...options
        };

        const group = new THREE.Group();

        for (let i = 0; i < config.helixPoints; i++) {
            const angle = (i / config.helixPoints) * Math.PI * 4;
            const y = (i / config.helixPoints) * config.height - config.height / 2;

            // Strand 1
            const sphere1Geometry = new THREE.SphereGeometry(config.sphereSize, 16, 16);
            const sphere1Material = new THREE.MeshStandardMaterial({
                color: config.color1,
                emissive: config.color1,
                emissiveIntensity: 0.3,
                metalness: 0.8,
                roughness: 0.2
            });
            const sphere1 = new THREE.Mesh(sphere1Geometry, sphere1Material);
            sphere1.position.set(
                Math.cos(angle) * config.radius,
                y,
                Math.sin(angle) * config.radius
            );
            group.add(sphere1);

            // Strand 2
            const sphere2Geometry = new THREE.SphereGeometry(config.sphereSize, 16, 16);
            const sphere2Material = new THREE.MeshStandardMaterial({
                color: config.color2,
                emissive: config.color2,
                emissiveIntensity: 0.3,
                metalness: 0.8,
                roughness: 0.2
            });
            const sphere2 = new THREE.Mesh(sphere2Geometry, sphere2Material);
            sphere2.position.set(
                Math.cos(angle + Math.PI) * config.radius,
                y,
                Math.sin(angle + Math.PI) * config.radius
            );
            group.add(sphere2);

            // Connecting bars
            if (i % config.barInterval === 0) {
                const barGeometry = new THREE.CylinderGeometry(0.05, 0.05, config.radius * 2, 8);
                const barMaterial = new THREE.MeshStandardMaterial({
                    color: config.barColor,
                    metalness: 0.6,
                    roughness: 0.3
                });
                const bar = new THREE.Mesh(barGeometry, barMaterial);
                bar.position.y = y;
                bar.rotation.z = angle + Math.PI / 2;
                group.add(bar);
            }
        }

        group.userData.type = 'dna-helix';
        return group;
    }

    /**
     * Create Morphing Icosahedron
     */
    createMorphingSphere(options = {}) {
        const config = {
            radius: 2,
            detail: 4,
            color: 0x00ff88,
            metalness: 0.9,
            roughness: 0.1,
            ...options
        };

        const geometry = new THREE.IcosahedronGeometry(config.radius, config.detail);
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            wireframe: false,
            metalness: config.metalness,
            roughness: config.roughness,
            emissive: config.color,
            emissiveIntensity: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Store original positions for morphing
        mesh.geometry.userData.originalPositions = 
            mesh.geometry.attributes.position.array.slice();
        
        mesh.userData.type = 'morphing-sphere';
        return mesh;
    }

    /**
     * Create Torus Knot
     */
    createTorusKnot(options = {}) {
        const config = {
            radius: 1.5,
            tube: 0.4,
            tubularSegments: 128,
            radialSegments: 32,
            p: 2,
            q: 3,
            color: 0xa855f7,
            ...options
        };

        const geometry = new THREE.TorusKnotGeometry(
            config.radius,
            config.tube,
            config.tubularSegments,
            config.radialSegments,
            config.p,
            config.q
        );

        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            metalness: 0.9,
            roughness: 0.1,
            emissive: config.color,
            emissiveIntensity: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.type = 'torus-knot';
        return mesh;
    }

    /**
     * Create Instanced Mesh (thousands of objects)
     */
    createInstancedCubes(options = {}) {
        const config = {
            count: 1000,
            size: 0.5,
            spread: 20,
            color: 0x00ccff,
            ...options
        };

        const geometry = new THREE.BoxGeometry(config.size, config.size, config.size);
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            metalness: 0.7,
            roughness: 0.3
        });

        const instancedMesh = new THREE.InstancedMesh(geometry, material, config.count);

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        for (let i = 0; i < config.count; i++) {
            dummy.position.set(
                (Math.random() - 0.5) * config.spread,
                (Math.random() - 0.5) * config.spread,
                (Math.random() - 0.5) * config.spread
            );

            dummy.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            dummy.scale.setScalar(Math.random() * 0.5 + 0.5);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);

            color.setHSL(i / config.count, 1, 0.5);
            instancedMesh.setColorAt(i, color);
        }

        instancedMesh.userData.type = 'instanced-cubes';
        return instancedMesh;
    }

    /**
     * Create Octahedron Spiral
     */
    createOctahedronSpiral(options = {}) {
        const config = {
            count: 50,
            radius: 0.3,
            spiralRadius: 3,
            height: 10,
            color: 0xa855f7,
            ...options
        };

        const group = new THREE.Group();

        for (let i = 0; i < config.count; i++) {
            const angle = (i / config.count) * Math.PI * 6;
            const y = (i / config.count) * config.height - config.height / 2;

            const geometry = new THREE.OctahedronGeometry(config.radius);
            const material = new THREE.MeshStandardMaterial({
                color: config.color,
                metalness: 0.8,
                roughness: 0.2,
                emissive: config.color,
                emissiveIntensity: 0.1
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                Math.cos(angle) * config.spiralRadius,
                y,
                Math.sin(angle) * config.spiralRadius
            );
            mesh.rotation.set(angle, angle, 0);

            group.add(mesh);
        }

        group.userData.type = 'octahedron-spiral';
        return group;
    }

    /**
     * Create parametric surface
     */
    createParametricSurface(options = {}) {
        const config = {
            uSegments: 50,
            vSegments: 50,
            color: 0x00ccff,
            ...options
        };

        const geometry = new THREE.ParametricGeometry(
            (u, v, target) => {
                const x = Math.sin(u * Math.PI * 2) * (1 + Math.cos(v * Math.PI * 2) * 0.5);
                const y = Math.sin(v * Math.PI * 2) * 2;
                const z = Math.cos(u * Math.PI * 2) * (1 + Math.cos(v * Math.PI * 2) * 0.5);
                target.set(x, y, z);
            },
            config.uSegments,
            config.vSegments
        );

        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            side: THREE.DoubleSide,
            metalness: 0.8,
            roughness: 0.2,
            wireframe: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.type = 'parametric-surface';
        return mesh;
    }

    /**
     * Dispose geometry
     */
    disposeGeometry(geometry) {
        if (geometry) {
            geometry.dispose();
        }
    }

    /**
     * Get all created geometries
     */
    getGeometries() {
        return Array.from(this.geometries.values());
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeometryFactory;
}
