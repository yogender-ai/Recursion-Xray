/**
 * Represents a single event in the recursion timeline.
 * key types:
 * - CALL: Function called (push stack)
 * - RETURN: Function returned (pop stack)
 * - LINE: Code line executed
 * - VAR: Variable changed
 * - LOG: Generic message
 */
export class TraceEvent {
    constructor(type, data, message, lineNumber = null, frameId = null) {
        this.id = crypto.randomUUID();
        this.type = type; // 'CALL', 'RETURN', 'LINE', 'VAR', 'LOG', 'ERROR'
        this.data = JSON.parse(JSON.stringify(data)); // Deep copy state
        this.message = message;
        this.lineNumber = lineNumber;
        this.frameId = frameId;
        this.timestamp = Date.now();
    }
}
