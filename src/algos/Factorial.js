import { Algorithm } from './Algorithm.js';

export class Factorial extends Algorithm {
    run(n) {
        this.tracer.reset();
        this.factorial(n);
        return this.tracer.getTimeline();
    }

    factorial(n) {
        // Line numbers correspond to the getCode() output
        const frameId = this.tracer.call('factorial', { n }, 1);

        this.tracer.step(`Checking if n (${n}) <= 1`, 2);

        if (n <= 1) {
            this.tracer.step('Base case reached. Returning 1.', 3);
            this.tracer.return(1, 3);
            return 1;
        }

        this.tracer.step(`Recursive call: ${n} * factorial(${n - 1})`, 5);
        const subResult = this.factorial(n - 1);

        this.tracer.set('subResult', subResult, 6);
        const result = n * subResult;

        this.tracer.set('result', result, 7);
        this.tracer.step(`Returning result: ${result}`, 8);

        this.tracer.return(result, 8);
        return result;
    }

    getCode() {
        return `function factorial(n) {
    // 1. Function Start
    if (n <= 1) {
        // 3. Base case
        return 1;
    }
    // 5. Recursive step
    let subResult = factorial(n - 1);
    // 7. Calculate result
    return n * subResult;
}`;
    }
}
