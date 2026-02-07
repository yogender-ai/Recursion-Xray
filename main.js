// Main Entry Point
// Assumes all dependencies (SceneManager, CppTranspiler, etc.) are loaded globally via <script> tags.

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
    elOverlay.textContent = "Compiling...";

    try {
        const jsCode = transpiler.transpile(rawCpp);
        console.log("Transpiled JS:\n", jsCode);

        // Reset
        tracer.reset();
        stackVis.reset();
        timeline = [];
        currentIndex = 0;

        // Execute
        const wrappedCode = `
            (async () => {
                try {
                    ${jsCode}
                    
                    if (typeof main === 'function') { await main(); }

                } catch (e) {
                    console.error("Runtime Error:", e);
                    throw e; 
                }
            })()
        `;

        await eval(wrappedCode);

        // Post-Run
        timeline = tracer.getTimeline();
        console.log("Timeline Generated:", timeline);

        if (timeline.length > 0) {
            updateVisuals(0);
            elOverlay.textContent = "Execution Complete.";
        } else {
            elOverlay.textContent = "Execution Complete (No Recursion Detected).";
        }

    } catch (e) {
        console.error("Compilation/Runtime Error:", e);
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

document.getElementById('btnPrev').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateVisuals(currentIndex);
    }
});

document.getElementById('btnPlay').addEventListener('click', () => {
    if (isPlaying) {
        isPlaying = false;
        document.getElementById('btnPlay').textContent = "▶";
    } else {
        isPlaying = true;
        document.getElementById('btnPlay').textContent = "⏸";
        playLoop();
    }
});

function playLoop() {
    if (!isPlaying) return;
    if (currentIndex < timeline.length - 1) {
        currentIndex++;
        updateVisuals(currentIndex);
        setTimeout(playLoop, 500); // 500ms delay
    } else {
        isPlaying = false;
        document.getElementById('btnPlay').textContent = "▶";
    }
}

function updateVisuals(index) {
    if (!timeline[index]) return;

    // 3D Update
    stackVis.update(index, timeline);

    // UI Update
    const event = timeline[index];
    const msg = event.message || event.type;
    elOverlay.textContent = `${event.type}: ${msg}`;

    const slider = document.getElementById('slider');
    slider.max = timeline.length - 1;
    slider.value = index;
}
