/**
 * Represents a single stack frame in the recursion.
 * Maintains local variables and arguments.
 */
export class StackFrame {
    constructor(id, name, args, parentId = null, depth = 0) {
        this.id = id;
        this.name = name;
        this.args = args; // Object { n: 5 }
        this.locals = {}; // Object { result: 120 }
        this.parentId = parentId;
        this.depth = depth;
        this.returnValue = undefined;
        this.state = 'ACTIVE'; // 'ACTIVE', 'RETURNED', 'PRUNED'
    }

    setLocal(key, value) {
        this.locals[key] = value;
    }

    setReturn(value) {
        this.returnValue = value;
        this.state = 'RETURNED';
    }
}
