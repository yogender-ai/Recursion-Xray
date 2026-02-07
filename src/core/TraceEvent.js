export class TraceEvent {
    constructor(type, data, message, lineNumber = null, frameId = null) {
        this.id = crypto.randomUUID();
        this.type = type; // 'CALL', 'RETURN', 'LINE', 'VAR', 'LOG', 'ERROR'
        this.data = JSON.parse(JSON.stringify(data));
        this.message = message;
        this.lineNumber = lineNumber;
        this.frameId = frameId;
        this.timestamp = Date.now();
    }
}
