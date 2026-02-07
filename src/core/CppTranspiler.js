/**
 * CppTranspiler.js
 * 
 * Converts a subset of C++ into executable JavaScript that interacts with our RecursionTracer.
 * This is a "Virtual Machine" approach: we don't compile to WASM, we transpile to JS.
 * 
 * Supported C++ Features (Subset):
 * - void functions
 * - int, string, vector<T> types (ignored/mapped to var/let)
 * - if, for, while
 * - push_back, pop_back, size()
 * - cout << ...
 */

export class CppTranspiler {
    constructor() {
        this.frameCounter = 0;
    }

    transpile(cppCode) {
        let jsCode = cppCode;

        // 1. Remove Headers (naive)
        jsCode = jsCode.replace(/#include\s+<.*?>/g, '');
        jsCode = jsCode.replace(/using\s+namespace\s+std;/g, '');

        // 2. Transpile Cout
        // cout << "Msg" << endl; -> tracer.log("Msg");
        jsCode = jsCode.replace(/cout\s*<<\s*(.*?);/g, (match, content) => {
            let msg = content.replace(/<<\s*endl/g, '').trim();
            // Replace remaining << with +
            msg = msg.replace(/<</g, '+');
            return `tracer.log(${msg}, 0);`;
        });

        // 3. Handle Function Definitions (BEFORE type replacement to protect args)
        // Regex: ReturnType FunctionName ( Args ) {
        // We support: void, int, string, bool, vector<...>
        const funcRegex = /(?:void|int|string|bool|vector\s*<.*?>)\s+(\w+)\s*\((.*?)\)\s*\{/g;

        jsCode = jsCode.replace(funcRegex, (match, funcName, argsRaw) => {
            // Process Arguments: "vector<int> nums, int i" -> "nums, i"
            let argsList = argsRaw.split(',');
            let cleanArgs = argsList.map(arg => {
                arg = arg.trim();
                if (!arg) return '';
                // Get the last word (variable name)
                let parts = arg.split(/\s+|&/);
                return parts[parts.length - 1];
            }).filter(x => x).join(', ');

            // Inject Tracer Call at start of function
            return `
            async function ${funcName}(${cleanArgs}) {
                const _frameId = tracer.call('${funcName}', { ${cleanArgs} }, 0);
            `;
        });

        // 4. Trace Returns
        jsCode = jsCode.replace(/return\s*(.*?);/g, (match, retVal) => {
            let val = retVal.trim();
            if (!val) val = 'undefined';
            return `tracer.return(${val}, 0); return ${val};`;
        });

        // 5. Variable Declarations (Local vars)
        // Convert `vector<int> v = ...` to `let v = ...`
        // Convert `int x = ...` to `let x = ...`
        jsCode = jsCode.replace(/vector\s*<.*?>/g, 'let');
        jsCode = jsCode.replace(/\b(int|void|string|bool|double)\b/g, 'let');

        // 6. Vector Methods
        jsCode = jsCode.replace(/\.push_back\(/g, '.push(');
        jsCode = jsCode.replace(/\.pop_back\(/g, '.pop(');
        jsCode = jsCode.replace(/\.size\(\)/g, '.length');

        // 7. Line Stepper (Simple)
        const lines = jsCode.split('\n');
        const instrumentedLines = lines.map((line, idx) => {
            const trimmed = line.trim();
            const lineNum = idx + 1;

            if (!trimmed || trimmed.startsWith('//')) return line;
            if (trimmed === '}' || trimmed === '{') return line;
            if (trimmed.startsWith('async function')) return line; // Already handled

            return `tracer.registerLine(${lineNum}); ${line}`;
        });

        jsCode = instrumentedLines.join('\n');

        return jsCode;
    }

    getLineNumber(match) {
        return 0;
    }
}
