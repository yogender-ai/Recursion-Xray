// Main Entry Point
// Assumes all dependencies (SceneManager, CppTranspiler, etc.) are loaded globally via <script> tags.

// --- State ---
const sceneManager = new SceneManager('vis3d');
const stackVis = new StackVisualizer3D(sceneManager);
// TreeVisualizer container ID is 'treeContainer' in index.html
const treeVis = new RecursionTreeVisualizer('treeContainer');
const tracer = new RecursionTracer();
const transpiler = new CppTranspiler();

// Global State
let timeline = [];
let currentIndex = 0;
let isPlaying = false;
let playbackSpeed = 500;
let currentLineNum = 1;

// --- Elements ---
const elEditor = document.getElementById('codeEditor');
const elOverlay = document.getElementById('codeHighlightOverlay');
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
        // Dramatic delay
        await new Promise(r => setTimeout(r, 600));

        const jsCode = transpiler.transpile(rawCpp);
        console.log("Transpiled JS:\n", jsCode);

        // Reset All Visuals
        tracer.reset();
        stackVis.reset(); // Fix: Clear 3D meshes
        sceneManager.clear();
        treeVis.reset([]);
        timeline = [];
        currentIndex = 0;

        // Execute Code
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

        // Post-Run Analysis
        timeline = tracer.getTimeline();
        console.log("Timeline Generated:", timeline);

        // Re-init Tree with full timeline (for layout calculation)
        treeVis.reset(timeline);

        if (timeline.length > 0) {
            elSlider.max = timeline.length - 1;
            elSlider.value = 0;
            updateVisuals(0);
            elStepDesc.textContent = "Execution Complete. Standby.";
            elStepTitle.textContent = "READY";
        } else {
            elStepDesc.textContent = "No Recursion Detected.";
            elStepTitle.textContent = "DONE";
        }

    } catch (e) {
        console.error("Compilation/Runtime Error:", e);
        elStepDesc.textContent = "Error: " + e.message;
        elStepTitle.textContent = "ERROR";
    }
});

// Slider Control
elSlider.addEventListener('input', (e) => {
    currentIndex = parseInt(e.target.value);
    updateVisuals(currentIndex);
});

// Speed Control
elSpeed.addEventListener('input', (e) => {
    // Slider: 100 (Fast) -> 2000 (Slow)
    playbackSpeed = parseInt(e.target.value);
});

// Navigation
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

// Play/Pause
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

// Visual Update Core
function updateVisuals(index) {
    if (!timeline[index]) return;

    const event = timeline[index];

    // 3D Stack Update
    stackVis.update(index, timeline);

    // 2D Tree Update
    treeVis.update(index, timeline);

    // UI Overlay Update
    const msg = event.message || event.type;
    elStepDesc.textContent = `${msg}`;
    elStepTitle.textContent = event.type.toUpperCase();

    // Code Highlight
    if (event.lineNumber) {
        highlightLine(event.lineNumber);
    }
}

// Code Highlighter with Scroll Sync
function highlightLine(lineNum) {
    currentLineNum = lineNum;

    // Get computed styles to be accurate
    const style = window.getComputedStyle(elEditor);
    const lineHeight = parseFloat(style.lineHeight);
    const paddingTop = parseFloat(style.paddingTop);

    // Calculate top position relative to the container
    // We strictly use the line number.
    // NOTE: This assumes scrollTop affects the text rendering, which it does.
    // The overlay is absolute positioned inside code-editor-container which is relative.
    // The textarea scrolls.
    // If the overlay is OUTSIDE the textarea, we must subtract scrollTop.

    const scrollTop = elEditor.scrollTop;
    const top = paddingTop + (lineNum - 1) * lineHeight - scrollTop;

    elOverlay.style.top = `${top}px`;
    elOverlay.style.height = `${lineHeight}px`;

    // Hide if out of view (optional, but good for polish)
    const viewHeight = elEditor.clientHeight;
    if (top < 0 || top > viewHeight - lineHeight) {
        // elOverlay.style.opacity = '0'; 
        // Optional: Auto-scroll to line?
        // elEditor.scrollTop = (lineNum - 1) * lineHeight - viewHeight / 2;
    } else {
        elOverlay.style.opacity = '1';
    }
}

// Sync Highlight on Scroll
elEditor.addEventListener('scroll', () => {
    if (currentLineNum) highlightLine(currentLineNum);
});

// Theme Toggle
document.getElementById('btnTheme').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
});

// --- Initial Setup ---
// Focus editor
elEditor.focus();
