import { TraceEvent } from './TraceEvent.js';
import { StackFrame } from './StackFrame.js';

export class RecursionTracer {
    constructor() {
        this.events = [];
        this.stack = [];
        this.frames = new Map();
        this.frameCount = 0;
    }

    call(name, args, lineNumber) {
        const id = `frame_${this.frameCount++}`;
        const parentId = this.stack.length > 0 ? this.stack[this.stack.length - 1].id : null;
        const depth = this.stack.length;

        // Capture args
        const safeArgs = JSON.parse(JSON.stringify(args));

        const frame = new StackFrame(id, name, safeArgs, parentId, depth);
        this.frames.set(id, frame);
        this.stack.push(frame);

        this.addEvent('CALL', {
            frame: frame,
            stackDepth: this.stack.length
        }, `Called function ${name}`, lineNumber, id);

        return id;
    }

    return(value, lineNumber) {
        if (this.stack.length === 0) return;

        const frame = this.stack.pop();
        frame.setReturn(value);

        this.addEvent('RETURN', {
            frame: frame,
            returnValue: value,
            stackDepth: this.stack.length
        }, `Returning from ${frame.name}`, lineNumber, frame.id);
    }

    // Called before every line execution
    registerLine(lineNumber) {
        // We can try to capture local vars here? 
        // In the transpiled code, we can modify it to pass `eval('vars')`? No, generic `step` is easier.
        const frameId = this.stack.length > 0 ? this.stack[this.stack.length - 1].id : null;
        if (frameId) {
            this.addEvent('LINE', {}, "Executing line " + lineNumber, lineNumber, frameId);
        }
    }

    // Explicit variable set (if we can detect it)
    set(name, value, lineNumber) {
        if (this.stack.length === 0) return;
        const frame = this.stack[this.stack.length - 1];
        frame.setLocal(name, value);

        this.addEvent('VAR', {
            frameId: frame.id,
            varName: name,
            value: value,
            locals: frame.locals
        }, `Updated ${name}`, lineNumber, frame.id);
    }

    // Explicit Log/Print (cout)
    log(message, lineNumber) {
        const frameId = this.stack.length > 0 ? this.stack[this.stack.length - 1].id : null;
        this.addEvent('LOG', { message }, `Console: ${message}`, lineNumber, frameId);
    }

    addEvent(type, data, message, lineNumber, frameId) {
        const event = new TraceEvent(type, data, message, lineNumber, frameId);
        this.events.push(event);
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
