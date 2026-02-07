import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510); // Deep space blue/black
        this.scene.fog = new THREE.FogExp2(0x050510, 0.002);

        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 20);
        this.camera.lookAt(0, 0, -10);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.lights = [];
        this.initLights();
        this.initStarfield();

        // Layers
        this.stackGroup = new THREE.Group();
        this.treeGroup = new THREE.Group();
        this.scene.add(this.stackGroup);
        this.scene.add(this.treeGroup);

        this.treeGroup.position.set(20, 0, 0); // Offset tree to right

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    initLights() {
        // Ambient
        const ambi = new THREE.AmbientLight(0x4040a0, 0.5);
        this.scene.add(ambi);

        // Point Light (The "Core")
        const point = new THREE.PointLight(0x3b82f6, 2, 100);
        point.position.set(0, 10, 10);
        this.scene.add(point);

        // Purple rim light
        const rim = new THREE.DirectionalLight(0xa855f7, 1);
        rim.position.set(-10, 5, -10);
        this.scene.add(rim);
    }

    initStarfield() {
        const geometry = new THREE.BufferGeometry();
        const count = 2000;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 200;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.2,
            transparent: true,
            opacity: 0.8
        });

        this.starfield = new THREE.Points(geometry, material);
        this.scene.add(this.starfield);
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    render() {
        this.starfield.rotation.y += 0.0005; // Subtle rotation
        this.renderer.render(this.scene, this.camera);
    }

    // API to add/remove objects
    addStackFrame(mesh) {
        this.stackGroup.add(mesh);
    }

    removeStackFrame(mesh) {
        this.stackGroup.remove(mesh);
    }

    clear() {
        // Remove children of groups
        while (this.stackGroup.children.length > 0) {
            this.stackGroup.remove(this.stackGroup.children[0]);
        }
        while (this.treeGroup.children.length > 0) {
            this.treeGroup.remove(this.treeGroup.children[0]);
        }
    }
}
