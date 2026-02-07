import { RecursionTracer } from './src/core/RecursionTracer.js';
import { Factorial } from './src/algos/Factorial.js';
import { Permutations } from './src/algos/Permutations.js';
import { RecursionTreeVisualizer } from './src/vis/TreeVisualizer.js';

// --- State ---
let tracer = new RecursionTracer();
let timeline = [];
let currentIndex = 0;
let isPlaying = false;
let playbackSpeed = 1000;
let playbackInterval = null;
let currentAlgorithm = null;
let treeVis = new RecursionTreeVisualizer('treeContainer');

// --- Elements ---
const elCode = document.getElementById('codeDisplay');
const elStack = document.getElementById('stackContainer');
const elOverlayTitle = document.getElementById('stepTitle');
const elOverlayDesc = document.getElementById('stepDescription');
const elSlider = document.getElementById('progressSlider');

// --- Initialization ---
document.getElementById('btnRun').addEventListener('click', runSimulation);
document.getElementById('btnNext').addEventListener('click', stepForward);
document.getElementById('btnPrev').addEventListener('click', stepBackward);
document.getElementById('btnPlayPause').addEventListener('click', togglePlay);
document.getElementById('speedSlider').addEventListener('input', (e) => playbackSpeed = 2100 - e.target.value);
document.getElementById('progressSlider').addEventListener('input', (e) => {
    jumpToStep(parseInt(e.target.value));
});

// --- Core Logic ---

function runSimulation() {
    pause();
    const algoName = document.getElementById('algoSelect').value;
    const inputVal = document.getElementById('algoInput').value;

    tracer = new RecursionTracer(); // Fresh tracer

    if (algoName === 'factorial') {
        currentAlgorithm = new Factorial(tracer);
        const n = parseInt(inputVal) || 3;
        timeline = currentAlgorithm.run(n);
    } else if (algoName === 'permutations') {
        currentAlgorithm = new Permutations(tracer);
        // Expecting comma separated list or string
        let nums = inputVal.split(',').map(Number);
        if (nums.some(isNaN)) nums = [1, 2, 3]; // Default fallback
        timeline = currentAlgorithm.run(nums);
    }

    // Setup UI
    elCode.textContent = currentAlgorithm.getCode();
    elSlider.max = timeline.length - 1;
    elSlider.value = 0;
    currentIndex = 0;

    // Clear Visuals
    elStack.innerHTML = '';
    treeVis.reset(timeline);

    // Render initial state
    updateVisuals(0);
}

function updateVisuals(index) {
    if (index < 0 || index >= timeline.length) return;
    const event = timeline[index];

    // 1. Highlight Code
    highlightLine(event.lineNumber);

    // 2. Update Stack
    renderStack(index);

    // 3. Update Tree
    treeVis.update(index, timeline);

    // 4. Update Overlay
    elOverlayTitle.textContent = `Step ${index + 1}: ${event.type}`;
    elOverlayDesc.textContent = event.message;

    // 4. Update Slider
    elSlider.value = index;
}

// Re-renders the ENTIRE stack based on the state at 'index'
// This is the "Data-Driven" approach (Stateless View)
function renderStack(index) {
    // We need to reconstruct the stack state up to this point.
    // In a real optimized system, we'd use snapshots or delta updates.
    // For this prototype, we will scan the timeline up to 'index' to build the active stack.

    // Optimized: The event object ALREADY has a snapshot of the frame state if we designed it right.
    // But our tracer sends 'events', not full state snapshots.
    // Let's iterate to rebuild 'active frames'.

    const activeFrames = new Map();
    const stackOrder = [];

    for (let i = 0; i <= index; i++) {
        const e = timeline[i];
        if (e.type === 'CALL') {
            activeFrames.set(e.frameId, {
                ...e.data.frame,
                state: 'ACTIVE',
                locals: {}
            });
            stackOrder.push(e.frameId);
        } else if (e.type === 'RETURN') {
            if (activeFrames.has(e.frameId)) {
                const frame = activeFrames.get(e.frameId);
                frame.state = 'RETURNED';
                frame.returnValue = e.data.returnValue;
                // Don't remove immediately if you want to show the "returning" animation
                // But for now let's keep it simple: strict stack
                stackOrder.pop();
                activeFrames.delete(e.frameId);
            }
        } else if (e.type === 'VAR' || e.type === 'UPDATE') {
            if (activeFrames.has(e.frameId)) {
                const frame = activeFrames.get(e.frameId);
                // Merge locals
                frame.locals = { ...frame.locals, ...e.data.locals };
                // Specific var update
                frame.locals[e.data.varName] = e.data.value;
            }
        }
    }

    // Now render DOM
    elStack.innerHTML = '';
    stackOrder.forEach(fid => {
        const frame = activeFrames.get(fid);
        const el = document.createElement('div');
        el.className = 'stack-frame enter active';

        let varsHtml = Object.entries(frame.args || {}).map(([k, v]) =>
            `<div class="var-row"><span>arg: ${k}</span><span>${JSON.stringify(v)}</span></div>`
        ).join('');

        varsHtml += Object.entries(frame.locals || {}).map(([k, v]) =>
            `<div class="var-row"><span>${k}</span><span>${JSON.stringify(v)}</span></div>`
        ).join('');

        el.innerHTML = `
            <div class="frame-header">
                <span>${frame.name}</span>
                <span>Line: ${timeline[index].lineNumber || '?'}</span>
            </div>
            <div class="frame-vars">
                ${varsHtml}
            </div>
        `;
        elStack.appendChild(el);
    });
}

function highlightLine(lineNum) {
    const lines = elCode.textContent.split('\n');
    const highlighted = lines.map((line, idx) => {
        // Line numbers are 1-based in our tracer
        if (idx + 1 === lineNum) {
            return `<span style="background-color: #3b4252; width: 100%; display: inline-block;">${line}</span>`;
        }
        return line;
    }).join('\n');
    // NAIVE RE-RENDER (Optimizable)
    // elCode.innerHTML = highlighted; 

    // Better: Helper function to just toggle class
    // For now, let's just stick to the textContent and use a separate overlay or improved logic
    // Actually, let's keep it simple:

    // Re-rendering innerHTML is okay for small files
    elCode.innerHTML = lines.map((line, idx) => {
        return `<div class="${(idx + 1) === lineNum ? 'line-highlight' : ''}">${line}</div>`;
    }).join('');
}

// --- Playback ---

function stepForward() {
    if (currentIndex < timeline.length - 1) {
        currentIndex++;
        updateVisuals(currentIndex);
    } else {
        pause();
    }
}

function stepBackward() {
    if (currentIndex > 0) {
        currentIndex--;
        updateVisuals(currentIndex);
    }
}

function togglePlay() {
    if (isPlaying) {
        pause();
    } else {
        play();
    }
}

function play() {
    isPlaying = true;
    document.getElementById('btnPlayPause').textContent = '⏸';
    playbackInterval = setInterval(() => {
        if (currentIndex < timeline.length - 1) {
            stepForward();
        } else {
            pause();
        }
    }, playbackSpeed);
}

function pause() {
    isPlaying = false;
    document.getElementById('btnPlayPause').textContent = '▶';
    clearInterval(playbackInterval);
}

function jumpToStep(idx) {
    currentIndex = idx;
    updateVisuals(currentIndex);
}
