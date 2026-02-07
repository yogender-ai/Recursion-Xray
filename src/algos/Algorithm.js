export class Algorithm {
    constructor(tracer) {
        this.tracer = tracer;
    }

    /**
     * Run the algorithm with the given arguments.
     * Must be implemented by subclasses.
     * @param args 
     */
    run(args) {
        throw new Error("Method 'run' must be implemented.");
    }

    getCode() {
        throw new Error("Method 'getCode' must be implemented.");
    }
}
