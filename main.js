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
// btnRun listener replaced below with dynamic logic

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

// Zoom Controls
document.getElementById('btnZoomIn').addEventListener('click', () => {
    treeVis.zoomIn();
});

document.getElementById('btnZoomOut').addEventListener('click', () => {
    treeVis.zoomOut();
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
    try {
        stackVis.update(index, timeline);
    } catch (e) {
        console.error("StackVis3D Error:", e);
    }

    // 2D Stack Update (DOM)
    try {
        render2DStack(index, timeline);
    } catch (e) {
        console.error("StackVis2D Error:", e);
    }

    // 2D Tree Update
    try {
        treeVis.update(index, timeline);
    } catch (e) {
        console.error("TreeVis Error:", e);
    }

    // UI Overlay Update
    const msg = event.message || event.type;
    elStepDesc.textContent = `${msg}`;
    elStepTitle.textContent = event.type.toUpperCase();

    // Final Result Panel Update
    const elFinalResult = document.getElementById('finalResultPanel');
    const elFinalValue = document.getElementById('finalResultValue');

    if (elFinalResult && elFinalValue) {
        // Only show final result if we are at the end OR if it's the last return
        // AND it's a root return.
        if (event.type === 'RETURN' && event.data.frame.depth === 0) {
            elFinalResult.classList.remove('hidden');
            elFinalValue.textContent = JSON.stringify(event.data.returnValue);
        } else if (index === 0) {
            elFinalResult.classList.add('hidden');
        }
    }

    // Code Highlight
    if (event.lineNumber) {
        highlightLine(event.lineNumber);
    }
}

// Render the 2D DOM Stack in the Right Panel
function render2DStack(index, timeline) {
    const container = document.getElementById('stackContainer');
    container.innerHTML = '';

    // Reconstruct stack state up to current index
    const activeStack = [];
    let returningFrame = null; // Special frame to show as "returning"

    // Logic: 
    // Iterate 0 to index. 
    // If we hit a RETURN at 'index' (current moment), we do NOT remove it yet visually,
    // but instead mark it as returning.

    for (let i = 0; i <= index; i++) {
        const e = timeline[i];
        if (e.type === 'CALL') {
            activeStack.push(e);
        } else if (e.type === 'RETURN') {
            // Find frame
            let foundIdx = -1;
            for (let j = activeStack.length - 1; j >= 0; j--) {
                if (activeStack[j].frameId === e.frameId) {
                    foundIdx = j;
                    break;
                }
            }

            if (foundIdx !== -1) {
                if (i === index) {
                    // THIS is the current event. The frame is "returning".
                    // We remove it from activeStack to emulate stack pop logic,
                    // BUT we save it to display it specially.
                    // Actually, usually a return pops the stack.
                    // If we want to see it "leaving", we can keep it in the list but style it.
                    // Let's keep it in the list for this render, but add metadata.
                    activeStack[foundIdx].isReturning = true;
                    activeStack[foundIdx].returnValue = e.data.returnValue;
                } else {
                    // Past event. It's gone.
                    activeStack.splice(foundIdx, 1);
                }
            }
        }
    }

    // Render from top (newest) to bottom (oldest)
    activeStack.forEach(e => {
        const frame = e.data.frame;
        const div = document.createElement('div');
        div.className = 'stack-frame active';

        // Apply "returning" style if marked
        if (e.isReturning) {
            div.className += ' returning';
        }

        let argsHtml = '';
        if (frame.args) {
            Object.entries(frame.args).forEach(([k, v]) => {
                let val = JSON.stringify(v);
                argsHtml += `<div class="var-row"><span>${k}</span><span>${val}</span></div>`;
            });
        }

        let returnHtml = '';
        if (e.isReturning) {
            returnHtml = `
                <div class="return-value-badge">
                    <span class="return-arrow">⤴</span>
                    <span>Returns: ${e.returnValue !== undefined ? e.returnValue : '?'}</span>
                </div>
            `;
        }

        div.innerHTML = `
            <div class="frame-header">
                <span>${frame.name}</span>
                <span style="opacity:0.5">#${frame.id.split('_')[1]}</span>
            </div>
            ${argsHtml}
            ${returnHtml}
        `;
        // Prepend to show newest at top (if using flex-col)
        // Or append if using column-reverse. 
        // We established CSS is column-reverse? No, let's just use prepend to be sure?
        // Wait, standard DOM order:
        // Container = Flex Col.
        // Append = Bottom.
        // We want Stack Top at Top.
        // So PREPEND.
        container.insertBefore(div, container.firstChild);
    });
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

// Populate Dropdown from Registry
const elAlgoSelect = document.getElementById('algoSelect');
const elAlgoInput = document.getElementById('algoInput');

function populateAlgoDropdown() {
    elAlgoSelect.innerHTML = '<option value="" disabled selected>Select Recursion Type...</option>';

    Object.keys(ALGORITHM_REGISTRY).forEach(categoryKey => {
        const category = ALGORITHM_REGISTRY[categoryKey];
        const optgroup = document.createElement('optgroup');
        optgroup.label = category.name; // e.g., "Linear Recursion"

        Object.keys(category.algorithms).forEach(algoKey => {
            const algo = category.algorithms[algoKey];
            const option = document.createElement('option');
            option.value = `${categoryKey}:${algoKey}`; // Store cat:algo
            option.textContent = algo.name;
            optgroup.appendChild(option);
        });

        elAlgoSelect.appendChild(optgroup);
    });
}

// Handle Selection
elAlgoSelect.addEventListener('change', (e) => {
    const [catKey, algoKey] = e.target.value.split(':');
    const algo = ALGORITHM_REGISTRY[catKey].algorithms[algoKey];
    const category = ALGORITHM_REGISTRY[catKey];

    // Update Editor
    elEditor.value = algo.code;

    // Update Inputs
    elAlgoInput.value = algo.defaultInput;

    // Educational Overlay
    elStepTitle.textContent = category.name.toUpperCase();
    elStepDesc.textContent = category.description;
});

// Update Run Button to use Dynamic Inputs
document.getElementById('btnRun').addEventListener('click', async () => {
    // 1. Get Code
    const rawCpp = elEditor.value;

    // 2. Get Inputs
    const [catKey, algoKey] = elAlgoSelect.value.split(':');
    const algo = ALGORITHM_REGISTRY[catKey].algorithms[algoKey];

    // Parse Input String "1, 2, 3" -> "vector<int> nums = {1,2,3};"
    const inputVal = elAlgoInput.value;
    let driverCode = "";
    const rootFn = algo.rootFn; // Use explicit root function name

    if (algo.inputType === "array") {
        // Assume first param is array
        // e.g. "1, 2, 3" -> vector<int> arr = {1, 2, 3};
        const arrName = algo.params[0];
        driverCode += `vector<int> ${arrName} = {${inputVal}};\n`;

        // If 2nd param is size (n), generate it
        if (algo.params.length > 1 && algo.params[1] === 'n') {
            driverCode += `int n = ${arrName}.size();\n`;
        }

        // Call: sumArray(arr, n) or mergeSort(arr, 0, size-1)
        const args = [...algo.params, ...(algo.extraArgs || [])].join(', ');
        driverCode += `${rootFn}(${args});`;

    } else if (algo.inputType === "number") {
        const paramName = algo.params[0];
        driverCode += `int ${paramName} = ${inputVal};\n`;
        driverCode += `${rootFn}(${paramName});`;

    } else if (algo.inputType === "string") {
        const paramName = algo.params[0];
        // Strip existing quotes if user typed them, then wrap in quotes
        const cleanInput = inputVal.replace(/^"|"$/g, '');
        driverCode += `string ${paramName} = "${cleanInput}";\n`;
        driverCode += `${rootFn}(${paramName});`;

    } else if (algo.inputType === "multi-number") {
        // e.g. "2, 1" -> m=2, n=1
        const parts = inputVal.split(',').map(x => x.trim());
        algo.params.forEach((p, i) => {
            driverCode += `int ${p} = ${parts[i] || 0};\n`; // Default 0
        });
        driverCode += `${rootFn}(${algo.params.join(', ')});`;
    }

    // Inject Driver Code
    const driverSplit = rawCpp.split('// Driver');
    let finalCpp = rawCpp;

    if (driverSplit.length > 1) {
        // Re-generate driver from Input Box
        finalCpp = driverSplit[0] + "\n// Driver\n" + driverCode;
        console.log("Injected Driver Code:", driverCode);
    } else {
        // Append if not found
        finalCpp = rawCpp + "\n\n// Driver\n" + driverCode;
    }

    // UI Feedback
    elStepDesc.textContent = "Compiling Neural Link...";
    // ... rest of run logic using finalCpp

    await runSimulation(finalCpp);
});

async function runSimulation(rawCpp) {
    // Extracted run logic for reuse
    try {
        await new Promise(r => setTimeout(r, 600)); // Delay

        const jsCode = transpiler.transpile(rawCpp);
        console.log("Transpiled JS:\n", jsCode);

        // Reset All Visuals
        tracer.reset();
        stackVis.reset();
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

        treeVis.reset(timeline);

        if (timeline.length > 0) {
            elSlider.max = timeline.length - 1;
            elSlider.value = 0;
            updateVisuals(0);
            elStepDesc.textContent = "Execution Complete.";
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
}

// Init
populateAlgoDropdown();
// Select Factorial by default
elAlgoSelect.value = "linear:factorial";
elAlgoSelect.dispatchEvent(new Event('change'));

// Focus editor
elEditor.focus();
