import { Algorithm } from './Algorithm.js';

export class Permutations extends Algorithm {
    run(nums) {
        this.tracer.reset();
        this.tracer.log('Starting Permutations with input: ' + JSON.stringify(nums));
        this.nums = nums;
        this.result = [];
        this.visited = new Array(nums.length).fill(false);

        this.permute([], 0);
        return this.tracer.getTimeline();
    }

    permute(currentPerm, depth) {
        const frameId = this.tracer.call('permute', { currentPerm, depth }, 1);

        this.tracer.step(`Checking base case: Is current length (${currentPerm.length}) == target (${this.nums.length})?`, 2);

        if (currentPerm.length === this.nums.length) {
            this.tracer.step(`Base case reached! Found permutation: [${currentPerm.join(', ')}]`, 3);
            this.result.push([...currentPerm]);
            this.tracer.return([...currentPerm], 3);
            return;
        }

        for (let i = 0; i < this.nums.length; i++) {
            this.tracer.step(`Loop index i=${i}, Element=${this.nums[i]}`, 5);

            this.tracer.step(`Checking if visited[${i}] is true...`, 6);
            if (this.visited[i]) {
                this.tracer.step(`Skipping ${this.nums[i]} (Already visited)`, 7);
                continue;
            }

            // DO CHOICE
            this.tracer.step(`Choosing ${this.nums[i]}`, 9);
            this.visited[i] = true;
            currentPerm.push(this.nums[i]);

            this.tracer.set('visited', [...this.visited], 10);
            this.tracer.set('currentPerm', [...currentPerm], 11);

            // RECURSE
            this.tracer.step(`Recursing with new state...`, 12);
            this.permute(currentPerm, depth + 1);

            // UNDO (BACKTRACK)
            this.tracer.step(`Backtracking: Undoing choice of ${this.nums[i]}`, 14);
            this.visited[i] = false;
            currentPerm.pop();

            this.tracer.set('visited', [...this.visited], 15);
            this.tracer.set('currentPerm', [...currentPerm], 16);
        }

        this.tracer.step('Loop finished. Returning to caller.', 18);
        this.tracer.return(null, 18);
    }

    getCode() {
        return `function permute(currentPerm) {
    // 1. Function Start
    if (currentPerm.length === nums.length) {
        // 3. Base Case: Found one!
        return;
    }
    for (let i = 0; i < nums.length; i++) {
        // 6. Check if used
        if (visited[i]) continue;

        // 9. Choose
        visited[i] = true;
        currentPerm.push(nums[i]);

        // 12. Explore
        permute(currentPerm);

        // 14. Backtrack (Undo)
        visited[i] = false;
        currentPerm.pop();
    }
    // 18. Return
}`;
    }
}
