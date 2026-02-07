class RecursionTreeVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.nodes = new Map(); // frameId -> Node
        this.root = null;
        this.width = 0;
        this.height = 0;
        this.scale = 1.0;
        this.mainGroup = null; // Scale group
    }

    zoomIn() {
        this.scale = Math.min(this.scale * 1.2, 5.0);
        this.updateTransform();
    }

    zoomOut() {
        this.scale = Math.max(this.scale / 1.2, 0.2);
        this.updateTransform();
    }

    updateTransform() {
        if (this.mainGroup) {
            // Transform origin? Center?
            // Simple scale for now.
            this.mainGroup.setAttribute("transform", `scale(${this.scale})`);

            // Adjust SVG size to allow scrolling?
            // If we zoom in, the content gets bigger.
            // But 'scale' on a group inside SVG doesn't change SVG dimensions.
            // We might need to scale width/height of SVG too?
            // Or just visual zoom? Use visual zoom + CSS overflow.
            // Better: update SVG width/height based on scale.

            // Re-render check?
            // Actually, let's just scale the group. 
            // The browser scrollbars will handle it IF the SVG size matches the scaled content.
            // But SVG viewbox...

            // Simplest: Scale the group, and if we want scrollbars to update,
            // we should probably increase SVG width/height.
            // For now, let's just scale visual.
        }
    }

    reset(timeline) {
        this.nodes.clear();
        this.root = null;
        this.container.innerHTML = '';

        // 1. Build Structure
        this.buildTreeStructure(timeline);

        // 2. Compute Layout
        if (this.root) {
            this.calculateLayout(this.root, 0);
            this.centerTree();
        }

        // 3. Initial Render (Hidden)
        this.renderStaticTree();
    }

    buildTreeStructure(timeline) {
        // First pass: Create all nodes from CALL events
        timeline.forEach(event => {
            if (event.type === 'CALL') {
                const frame = event.data.frame;
                const node = {
                    id: frame.id,
                    name: frame.name,
                    args: frame.args,
                    children: [],
                    x: 0,
                    y: 0,
                    depth: frame.depth,
                    parentId: frame.parentId,
                    events: {
                        call: event.timestamp, // Use as simple marker
                        return: null
                    }
                };

                this.nodes.set(frame.id, node);

                if (frame.parentId && this.nodes.has(frame.parentId)) {
                    const parent = this.nodes.get(frame.parentId);
                    parent.children.push(node);
                } else {
                    this.root = node;
                }
            }
        });
    }

    // Simple layout algorithm
    calculateLayout(node, depth) {
        const NODE_SIZE = 30; // Reduced from 50
        const GAP_X = 20; // Reduced from 70
        const LEVEL_HEIGHT = 80; // Reduced from 120

        node.y = depth * LEVEL_HEIGHT + 40; // Top padding

        if (node.children.length === 0) {
            node.width = NODE_SIZE;
        } else {
            let totalWidth = 0;
            node.children.forEach(child => {
                this.calculateLayout(child, depth + 1);
                totalWidth += child.width + GAP_X;
            });
            totalWidth -= GAP_X;
            node.width = totalWidth;
        }
    }

    // Second pass to assign X coordinates centered
    centerTree() {
        if (!this.root) return;

        // We need to position children relative to parents, but leaves dictate width.
        // Let's do a post-order traversal to set distinct x ranges?
        // Actually, Reingold-Tilford is hard.
        // Let's do a simple "next available x" traversal for leaves.

        let currentX = 40; // Left padding
        const positionLeaves = (node) => {
            if (node.children.length === 0) {
                node.x = currentX;
                currentX += 50; // Node width (30) + gap (20)
            } else {
                node.children.forEach(positionLeaves);
                // Parent is centered above children
                const first = node.children[0];
                const last = node.children[node.children.length - 1];
                node.x = (first.x + last.x) / 2;
            }
        };

        positionLeaves(this.root);
    }

    renderStaticTree() {
        if (!this.root) return;

        // Calculate Bounding Box
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        this.nodes.forEach(node => {
            if (node.x < minX) minX = node.x;
            if (node.x > maxX) maxX = node.x;
            if (node.y < minY) minY = node.y;
            if (node.y > maxY) maxY = node.y;
        });

        // Add Padding
        const padding = 100; // Generous padding
        const width = (maxX - minX) + (padding * 2);
        const height = (maxY - minY) + (padding * 2);

        // SVG Container
        console.log(`[TreeViz] Nodes: ${this.nodes.size}, MinX: ${minX}, MaxX: ${maxX}, MinY: ${minY}, MaxY: ${maxY}`);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        // Force dimensions
        // Force dimensions
        // Fallback to Calculated Width if Container is 0 (e.g. hidden tab)
        const containerWidth = this.container.clientWidth || 500;
        const containerHeight = this.container.clientHeight || 500;

        const finalWidth = Math.max(width, containerWidth);
        const finalHeight = Math.max(height, containerHeight);

        console.log(`[TreeViz] Container Size: ${containerWidth}x${containerHeight}`);
        console.log(`[TreeViz] SVG Size: ${finalWidth}x${finalHeight}`);

        svg.style.width = `${finalWidth}px`;
        svg.style.height = `${finalHeight}px`;
        // Use min-width to ensure scrolling if content is larger
        svg.style.minWidth = `${Math.max(width, finalWidth)}px`;
        svg.style.minHeight = `${Math.max(height, finalHeight)}px`;
        svg.style.display = "block";
        svg.style.background = "rgba(20, 30, 50, 0.5)"; // Debug background

        // Center content if it's smaller than container
        // ViewBox is strictly content
        svg.setAttribute("viewBox", `${minX - padding} ${minY - padding} ${width} ${height}`);

        this.container.appendChild(svg);

        // Debug Border
        const debugRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        debugRect.setAttribute("x", minX - padding);
        debugRect.setAttribute("y", minY - padding);
        debugRect.setAttribute("width", width);
        debugRect.setAttribute("height", height);
        debugRect.setAttribute("fill", "none");
        debugRect.setAttribute("stroke", "red");
        debugRect.setAttribute("stroke-width", "5");
        svg.appendChild(debugRect);

        svg.appendChild(debugRect);

        // Main Scale Group
        this.mainGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.mainGroup.setAttribute("id", "tree-scale-group");
        // Center the group initially? Or just 0,0
        // If we scale, we scale from 0,0
        svg.appendChild(this.mainGroup);

        // Draw Links
        this.nodes.forEach(node => {
            if (node.children.length > 0) {
                node.children.forEach(child => {
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", node.x);
                    line.setAttribute("y1", node.y);
                    line.setAttribute("x2", child.x);
                    line.setAttribute("y2", child.y);
                    line.setAttribute("stroke", "rgba(60, 200, 255, 0.3)"); // Subtle Cyan
                    line.setAttribute("stroke-width", "2");
                    line.setAttribute("id", `link-${child.id}`);
                    line.setAttribute("class", "tree-link");
                    this.mainGroup.appendChild(line);
                });
            }
        });

        // Draw Nodes
        this.nodes.forEach(node => {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
            g.setAttribute("id", `node-${node.id}`);
            g.setAttribute("class", "tree-node-group");
            g.style.opacity = "0.1"; // Start hidden/faint

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("r", "12"); // Reduced from 20
            circle.setAttribute("fill", "#ffffff");
            circle.setAttribute("stroke", "#94a3b8");
            circle.setAttribute("stroke-width", "2");
            circle.setAttribute("class", "tree-circle");

            // Text (Args)
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dy", "3"); // Adjusted for smaller circle
            text.setAttribute("font-size", "8px"); // Reduced from 10px
            text.setAttribute("fill", "#334155");

            // Format simple args
            const argVals = Object.values(node.args);
            // Handle arrays (permutations)
            let label = argVals[0];
            if (Array.isArray(label)) label = `[${label.join(',')}]`;
            else if (typeof label === 'object') label = '{...}';

            text.textContent = label;

            g.appendChild(circle);
            g.appendChild(text);
            this.mainGroup.appendChild(g);
        });

        // Apply initial scale
        this.updateTransform();
    }

    update(index, timeline) {
        // Determine the state of each node at this timestamp
        // We know which frames are ACTIVE, RETURNED, or NOT STARTED.

        // 1. Identify active frames in the stack
        const activeFrames = new Set();
        const returnedFrames = new Set();
        const createdFrames = new Set();

        for (let i = 0; i <= index; i++) {
            const e = timeline[i];
            if (e.type === 'CALL') {
                createdFrames.add(e.frameId);
                activeFrames.add(e.frameId);
            } else if (e.type === 'RETURN') {
                activeFrames.delete(e.frameId);
                returnedFrames.add(e.frameId);
            }
        }

        // 2. Update styles
        this.nodes.forEach(node => {
            const el = document.getElementById(`node-${node.id}`);
            const link = document.getElementById(`link-${node.id}`);
            if (!el) return;

            const circle = el.querySelector('circle');

            if (activeFrames.has(node.id)) {
                // Active
                el.style.opacity = "1";
                circle.setAttribute("fill", "#dbeafe"); // Light blue
                circle.setAttribute("stroke", "#2563eb"); // Blue
                circle.setAttribute("stroke-width", "3");
                if (link) link.setAttribute("stroke", "#2563eb");
            } else if (returnedFrames.has(node.id)) {
                // Returned
                el.style.opacity = "1";
                circle.setAttribute("fill", "#dcfce7"); // Light green
                circle.setAttribute("stroke", "#10b981"); // Green
                circle.setAttribute("stroke-width", "2");
                if (link) link.setAttribute("stroke", "#10b981");
            } else if (createdFrames.has(node.id)) {
                // Technically shouldn't happen if created=active until return, 
                // but possible if we stepped back? 
                // If it's in created but not active and not returned? 
                // Means it's Popped but not "Returned"? (e.g. error)
                // Or, if we are doing Backtracking, "Returned" covers it.
                // Wait, for Permutations:
                // We pop, but do we "Return"?
                // My Permutation code calls 'return' only at base case or end of loop.
                // It does NOT call 'return' when just popping to backtrack?
                // Actually, recursion ALWAYS returns.
                // Even implicit return is a return.
            } else {
                // Not reached yet
                el.style.opacity = "0.1";
                circle.setAttribute("fill", "#ffffff");
                circle.setAttribute("stroke", "#cbd5e1");
                if (link) link.setAttribute("stroke", "#cbd5e1");
            }
        });
    }
}
