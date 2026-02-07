// Main Entry Point
// Assumes all dependencies (SceneManager, CppTranspiler, etc.) are loaded globally via <script> tags.

// --- State ---
const sceneManager = new SceneManager('vis3d');
const stackVis = new StackVisualizer3D(sceneManager);
const tracer = new RecursionTracer();
const transpiler = new CppTranspiler();
let timeline = [];
let currentIndex = 0;
let isPlaying = false;
let playbackSpeed = 500;

// --- Elements ---
const elEditor = document.getElementById('codeEditor');
const elOverlay = document.getElementById('professorText');
const elStepTitle = document.getElementById('stepTitle');
const elStepDesc = document.getElementById('stepDescription');
const elSlider = document.getElementById('progressSlider');
const elSpeed = document.getElementById('speedSlider');

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

    // UI Feedback
    elStepDesc.textContent = "Compiling Neural Link...";
    elStepTitle.textContent = "COMPILING";

    try {
        // Simple "fake" delay for dramatic effect
        await new Promise(r => setTimeout(r, 500));

        const jsCode = transpiler.transpile(rawCpp);
        console.log("Transpiled JS:\n", jsCode);

        // Reset
        tracer.reset();
        sceneManager.clear(); // Clear 3D objects
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
            elSlider.max = timeline.length - 1;
            elSlider.value = 0;
            updateVisuals(0);
            elStepDesc.textContent = "Execution Complete. Standby.";
            elStepTitle.textContent = "READY";
        } else {
            elStepDesc.textContent = "Execution Complete (No Recursion Detected).";
            elStepTitle.textContent = "DONE";
        }

    } catch (e) {
        console.error("Compilation/Runtime Error:", e);
        elStepDesc.textContent = "Error: " + e.message;
        elStepTitle.textContent = "ERROR";
    }
});

elSlider.addEventListener('input', (e) => {
    currentIndex = parseInt(e.target.value);
    updateVisuals(currentIndex);
});

elSpeed.addEventListener('input', (e) => {
    // Inverse logic: Higher value = Slower speed? 
    // Slider min=100 (fast), max=2000 (slow)
    playbackSpeed = parseInt(e.target.value);
});

document.getElementById('btnNext').addEventListener('click', () => {
    if (currentIndex < timeline.length - 1) {
        currentIndex++;
        updateVisuals(currentIndex);
        elSlider.value = currentIndex;
    }
});

document.getElementById('btnPrev').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateVisuals(currentIndex);
        elSlider.value = currentIndex;
    }
});

document.getElementById('btnPlayPause').addEventListener('click', togglePlay);

function togglePlay() {
    const btn = document.getElementById('btnPlayPause');
    if (isPlaying) {
        isPlaying = false;
        btn.textContent = "▶";
    } else {
        isPlaying = true;
        btn.textContent = "⏸";
        playLoop();
    }
}

function playLoop() {
    if (!isPlaying) return;

    if (currentIndex < timeline.length - 1) {
        currentIndex++;
        updateVisuals(currentIndex);
        elSlider.value = currentIndex;
        setTimeout(playLoop, playbackSpeed);
    } else {
        isPlaying = false;
        document.getElementById('btnPlayPause').textContent = "▶";
    }
}

function updateVisuals(index) {
    if (!timeline[index]) return;

    const event = timeline[index];

    // 3D Update
    stackVis.update(index, timeline);

    // UI Update
    const msg = event.message || event.type;
    elStepDesc.textContent = `${msg}`;
    elStepTitle.textContent = event.type.toUpperCase();

    // Highlight Code Line (Naive approach)
    // We would need a more robust highlighter, but for now:
    // highlightLine(event.lineNumber);
}

// Theme Toggle
document.getElementById('btnTheme').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
});

