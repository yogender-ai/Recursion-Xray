// Depends on THREE (loaded globally)

class StackVisualizer3D {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.frames = new Map(); // frameId -> Mesh
        this.spacing = 3.0; // Distance between frames Z
    }

    update(index, timeline) {
        // Similar to 2D event replay, but in ID
        // Determine active frames
        const currentFrames = [];
        const activeIds = new Set();

        for (let i = 0; i <= index; i++) {
            const e = timeline[i];
            if (e.type === 'CALL') {
                activeIds.add(e.frameId);
                // We need to keep order for Z-index
                currentFrames.push(e);
            } else if (e.type === 'RETURN') {
                activeIds.delete(e.frameId);
                // Remove from currentFrames array
                const idx = currentFrames.findIndex(x => x.frameId === e.frameId);
                if (idx !== -1) currentFrames.splice(idx, 1);
            }
        }

        // Diff and Animate
        // 2. Diff and Animate
        currentFrames.forEach((eCall, depth) => {
            if (!this.frames.has(eCall.frameId)) {
                this.createFrame(eCall.frameId, eCall.data.frame, depth);
            }
        });

        // 3. Auto-Frame: Move the Stack Group so the active frame is always at Z = -5
        // effectively "pushing" old frames back.
        // or move Camera? Moving group is easier.
        const activeDepth = currentFrames.length - 1;
        if (activeDepth >= 0) {
            // We want activeDepth * spacing to be at some fixed visual Z.
            // Say Z=0 is the "StageFront".
            const targetZ = activeDepth * this.spacing;
            this.sceneManager.stackGroup.position.z = targetZ;
        }

        // 2. Remove returns
        this.frames.forEach((mesh, id) => {
            if (!activeIds.has(id)) {
                // Animate out?
                this.sceneManager.removeStackFrame(mesh);
                this.frames.delete(id);
            }
        });
    }

    createFrame(id, frameData, depth) {
        console.log(`[StackViz3D] Creating Frame ${id} at depth ${depth}`, frameData);
        // Create a Plane
        const geometry = new THREE.PlaneGeometry(4, 3);
        const texture = this.createTexture(frameData);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            depthWrite: true, // Fix depth sorting issue (frames won't look "inside out")
            alphaTest: 0.1 // Cleaner edges
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position
        // Z moves negative into screen
        mesh.position.set(0, 0, -depth * this.spacing);

        this.frames.set(id, mesh);
        this.sceneManager.addStackFrame(mesh);
        console.log(`[StackViz3D] Frame added to scene. Total frames: ${this.frames.size}`);
    }

    createTexture(frameData) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 384;
        const ctx = canvas.getContext('2d');

        // Styles
        ctx.fillStyle = 'rgba(10, 20, 40, 0.8)'; // Dark glass
        ctx.fillRect(0, 0, 512, 384);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 512, 384);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(frameData.name, 20, 50);

        ctx.font = '24px monospace';
        ctx.fillStyle = '#94a3b8';
        let y = 100;

        // Args
        if (frameData.args) {
            Object.entries(frameData.args).forEach(([k, v]) => {
                let valStr = JSON.stringify(v);
                if (valStr.length > 20) valStr = valStr.substring(0, 20) + '...';
                ctx.fillText(`${k}: ${valStr}`, 20, y);
                y += 35;
            });
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    reset() {
        this.frames.forEach(mesh => this.sceneManager.removeStackFrame(mesh));
        this.frames.clear();
    }
}
