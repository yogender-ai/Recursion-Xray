class StackFrame {
    constructor(id, name, args, parentId = null, depth = 0) {
        this.id = id;
        this.name = name;
        this.args = args;
        this.locals = {};
        this.parentId = parentId;
        this.depth = depth;
        this.returnValue = undefined;
        this.state = 'ACTIVE';
    }

    setLocal(key, value) {
        this.locals[key] = value;
    }

    setReturn(value) {
        this.returnValue = value;
        this.state = 'RETURNED';
    }
}
