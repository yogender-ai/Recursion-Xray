// Depends on THREE (loaded globally)

class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.scene = new THREE.Scene();
        this.scene.background = null; // Transparent to show CSS background
        this.scene.fog = new THREE.FogExp2(0x050510, 0.002);

        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 20);
        this.camera.lookAt(0, 0, -10);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.initLights();
        this.initStarfield();

        // OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true; // Allow panning up/down/left/right
        this.controls.minDistance = 2; // Allow zooming closer
        this.controls.maxDistance = 100;

        // Layers
        this.stackGroup = new THREE.Group();
        this.treeGroup = new THREE.Group();
        this.scene.add(this.stackGroup);
        this.scene.add(this.treeGroup);

        this.treeGroup.position.set(20, 0, 0); // Offset tree to right

        // Robust Resize Handling
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.onResize(entry.contentRect);
            }
        });
        this.resizeObserver.observe(this.container);
    }

    onResize(rect) {
        if (!this.camera || !this.renderer) return;

        const width = rect.width;
        const height = rect.height;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Update renderer size
        this.renderer.setSize(width, height, false); // false to prevent style overwrite if using CSS
    }

    initLights() {
        // Ambient - slightly brighter/blue for cyber feel
        const ambi = new THREE.AmbientLight(0x2a2a40, 0.6);
        this.scene.add(ambi);

        // Point Light (The "Core") - Intense Blue
        const point = new THREE.PointLight(0x00f3ff, 2.5, 100);
        point.position.set(5, 15, 15);
        this.scene.add(point);

        // Rim Light - Neon Purple/Pink from behind
        const rim = new THREE.DirectionalLight(0xff00ff, 1.5);
        rim.position.set(-10, 10, -20);
        this.scene.add(rim);

        // Fill Light - Soft Cyan
        const fill = new THREE.DirectionalLight(0x00ffff, 0.5);
        fill.position.set(20, 0, 10);
        this.scene.add(fill);
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

    render() {
        this.starfield.rotation.y += 0.0005; // Subtle rotation
        this.controls.update(); // Required for damping
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
