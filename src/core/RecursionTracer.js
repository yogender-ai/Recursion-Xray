import { TraceEvent } from './TraceEvent.js';
import { StackFrame } from './StackFrame.js';

export class RecursionTracer {
    constructor() {
        this.events = [];
        this.stack = []; // Current active stack of frames
        this.frames = new Map(); // All frames by ID
        this.frameCount = 0;
    }

    /**
     * Start a new recursive call.
     * @param {string} validName - e.g., "factorial"
     * @param {object} args - e.g., { n: 5 }
     * @param {number} lineNumber - Line number in code
     */
    call(name, args, lineNumber) {
        const id = `frame_${this.frameCount++}`;
        const parentId = this.stack.length > 0 ? this.stack[this.stack.length - 1].id : null;
        const depth = this.stack.length;

        const frame = new StackFrame(id, name, args, parentId, depth);
        this.frames.set(id, frame);
        this.stack.push(frame);

        this.addEvent('CALL', {
            frame: frame,
            stackDepth: this.stack.length
        }, `Called ${name}(${this.formatArgs(args)})`, lineNumber, id);

        return id;
    }

    /**
     * Return from the current function.
     * @param {any} value - Return value
     * @param {number} lineNumber 
     */
    return(value, lineNumber) {
        if (this.stack.length === 0) return;

        const frame = this.stack.pop();
        frame.setReturn(value);

        this.addEvent('RETURN', {
            frame: frame,
            returnValue: value,
            stackDepth: this.stack.length
        }, `Returning ${value} from ${frame.name}`, lineNumber, frame.id);
    }

    /**
     * Update a local variable.
     * @param {string} name 
     * @param {any} value 
     * @param {number} lineNumber 
     */
    set(name, value, lineNumber) {
        if (this.stack.length === 0) return;
        const frame = this.stack[this.stack.length - 1];
        frame.setLocal(name, value);

        this.addEvent('VAR', {
            frameId: frame.id,
            varName: name,
            value: value,
            locals: frame.locals
        }, `Set ${name} = ${JSON.stringify(value)}`, lineNumber, frame.id);
    }

    /**
     * Log a generic step or comment.
     * @param {string} message 
     * @param {number} lineNumber 
     */
    step(message, lineNumber) {
        const frameId = this.stack.length > 0 ? this.stack[this.stack.length - 1].id : null;
        this.addEvent('LINE', {}, message, lineNumber, frameId);
    }

    addEvent(type, data, message, lineNumber, frameId) {
        const event = new TraceEvent(type, data, message, lineNumber, frameId);
        this.events.push(event);
    }

    formatArgs(args) {
        return Object.values(args).join(', ');
    }

    getTimeline() {
        return this.events;
    }

    reset() {
        this.events = [];
        this.stack = [];
        this.frames.clear();
        this.frameCount = 0;
    }
}
