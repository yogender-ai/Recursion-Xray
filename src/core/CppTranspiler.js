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

        // 2. Transpile Types -> let
        // vector<int> x -> let x
        jsCode = jsCode.replace(/vector\s*<.*?>/g, 'let');
        jsCode = jsCode.replace(/\b(int|void|string|bool|double)\b/g, 'let');

        // 3. Transpile C++ Vector Methods -> JS Array Methods
        // .push_back(...) -> .push(...)
        jsCode = jsCode.replace(/\.push_back\(/g, '.push(');
        // .pop_back() -> .pop()
        jsCode = jsCode.replace(/\.pop_back\(/g, '.pop(');
        // .size() -> .length
        jsCode = jsCode.replace(/\.size\(\)/g, '.length');

        // 4. Instrumentation: Function Entry/Exit
        // We need to find function definitions. This is hard with regex.
        // Simplified approach: find blocks that look like functions.
        // Actually, let's inject a wrapper.
        // For now, assume the user writes a function named `solve` or `permute`.

        // Let's replace function definitions with instrumented ones.
        // catch: `let funcName = (args) => {`
        // Regex for function: `let\s+(\w+)\s*\((.*?)\)\s*\{`  (since we replaced types with 'let')
        jsCode = jsCode.replace(/let\s+(\w+)\s*\((.*?)\)\s*\{/g, (match, funcName, args) => {
            return `
            async function ${funcName}(${args}) {
                const _frameId = tracer.call('${funcName}', { ${args} }, ${this.getLineNumber(match)});
            `;
        });

        // 5. Instrumentation: Return statements
        jsCode = jsCode.replace(/return\s*(.*?);/g, (match, retVal) => {
            // tracer.return(val, line)
            // If void return, retVal is empty
            const val = retVal.trim() || 'undefined';
            return `
                tracer.return(${val}, 0);
                return ${val};
            `;
        });

        // 6. Instrumentation: Variable Assignments
        // x = 5; -> x = 5; tracer.set('x', x, line);
        // Naive regex: `(\w+)\s*=\s*(.*?);`
        // Excluding 'let' declarations to avoid double setting? 
        // Actually, capturing after assignment is better.
        // Warning: This is fragile. Ideally use an AST parser (Babel/Acorn).
        // For this prototype, we'll manually instrument specific lines or use a simpler "Line Stepper".

        // ALTERNATIVE: INJECT "tracer.step()" AT EVERY LINE
        // Split by newline, inject tracer.step(lineNum)
        const lines = jsCode.split('\n');
        const instrumentedLines = lines.map((line, idx) => {
            const trimmed = line.trim();
            const lineNum = idx + 1;

            // Skip empty or comment
            if (!trimmed || trimmed.startsWith('//')) return line;

            // Inject step BEFORE the line executes (for visuals)
            // But for recursion, we want to see the stack frame first.
            // Let's inject `await tracer.step(..., lineNum)`? 
            // We need `await` if we want to pause execution in reality?
            // No, our tracer is synchronous recording. Playback is async.
            // So we just record.

            // If it's a bracket `}`, don't trace.
            if (trimmed === '}' || trimmed === '{') return line;

            // If it's a function def, we handled it in step 4 (mostly).
            // Actually step 4 replaced the opening brace line.

            return `tracer.registerLine(${lineNum}); ${line}`;
        });

        jsCode = instrumentedLines.join('\n');

        // 7. Inject implicit return at end of function if missing?
        // JS functions return undefined by default, which is fine.
        // But our tracer needs a pop.
        // We need to detect the closing brace of the function.
        // This is too hard with regex. 
        // STRATEGY: We will rely on explicit returns or just "Auto-Pop" if the stack depth decreases?
        // No, we need explicit instrumentation.

        // REFINED STRATEGY FOR PROTOTYPE:
        // Assume the user writes code in a specific format or we provide a "Template".
        // Or, use a lightweight parser like `acorn`?
        // Loading `acorn` from CDN might be safer.

        // For now, let's stick to the simple replacement and fix the "Function End" issue by wrapping code in a try/finally?

        return jsCode;
    }

    getLineNumber(match) {
        // Placeholder
        return 0;
    }
}
