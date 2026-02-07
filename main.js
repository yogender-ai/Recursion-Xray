import { SceneManager } from './src/vis3d/SceneManager.js';
import { StackVisualizer3D } from './src/vis3d/StackVisualizer3D.js';
import { RecursionTracer } from './src/core/RecursionTracer.js';
import { CppTranspiler } from './src/core/CppTranspiler.js';

// --- State ---
const sceneManager = new SceneManager('visContainer');
const stackVis = new StackVisualizer3D(sceneManager);
const tracer = new RecursionTracer();
const transpiler = new CppTranspiler();
let timeline = [];
let currentIndex = 0;
let isPlaying = false;

// --- Elements ---
const elEditor = document.getElementById('codeEditor');
const elOverlay = document.getElementById('professorText');

// --- Global Scope for Eval ---
window.tracer = tracer;

// --- Event Loops ---
function animate() {
    requestAnimationFrame(animate);
    sceneManager.render();
}
animate();

// --- Controls ---
document.getElementById('btnRun').addEventListener('click', async () => {
    const rawCpp = elEditor.value;
    const jsCode = transpiler.transpile(rawCpp);

    console.log("Transpiled JS:\n", jsCode); // User can debug

    tracer.reset();

    // Execute
    try {
        // We need to run the code. It defines functions.
        // We need to call the entry point (e.g., 'solve' or 'main' or the first fn?);
        // Let's assume the user calls the function at the end or we detect it.
        // For the Prototype, let's append a call to 'permute([1,2,3])' or similar if detected?
        // Better: Expect the user to write the call.

        // Wrap in async IIFE
        await eval(`(async () => { 
            ${jsCode} 
        })()`);

        timeline = tracer.getTimeline();
        stackVis.reset();
        currentIndex = 0;
        updateVisuals(0);

    } catch (e) {
        console.error("Execution Error:", e);
        elOverlay.textContent = "Error: " + e.message;
    }
});

document.getElementById('slider').addEventListener('input', (e) => {
    currentIndex = parseInt(e.target.value);
    updateVisuals(currentIndex);
});

document.getElementById('btnNext').addEventListener('click', () => {
    if (currentIndex < timeline.length - 1) {
        currentIndex++;
        updateVisuals(currentIndex);
    }
});

function updateVisuals(index) {
    if (!timeline[index]) return;

    // 3D Update
    stackVis.update(index, timeline);

    // UI Update
    const event = timeline[index];
    elOverlay.textContent = `${event.type}: ${event.message}`;
    document.getElementById('slider').max = timeline.length - 1;
    document.getElementById('slider').value = index;
}
