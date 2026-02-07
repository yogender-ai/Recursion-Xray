/**
 * CppTranspiler.js
 * 
 * Converts a subset of C++ into executable JavaScript that interacts with our RecursionTracer.
 */

class CppTranspiler {
    constructor() {
        this.frameCounter = 0;
    }

    transpile(cppCode) {
        let jsCode = cppCode;

        // 0. New: Remove Forward Declarations FIRST
        // Pattern: Type Name(Args);
        // regex: (void|int|bool|string|vector<...>) name (...);
        jsCode = jsCode.replace(/(?:void|int|bool|string|vector\s*<.*?>)\s+\w+\s*\(.*?\);/g, '');

        // 1. Remove Headers (naive)
        jsCode = jsCode.replace(/#include\s+<.*?>/g, '');
        jsCode = jsCode.replace(/using\s+namespace\s+std;/g, '');

        // 2. Transpile Cout
        jsCode = jsCode.replace(/cout\s*<<\s*(.*?);/g, (match, content) => {
            let msg = content.replace(/<<\s*endl/g, '').trim();
            msg = msg.replace(/<</g, '+');
            return `tracer.log(${msg}, 0);`;
        });

        // 3. Handle Function Definitions
        // Match: void|int|bool|string|vector<...> name ( ... ) {
        const funcRegex = /(?:void|int|string|bool|vector\s*<.*?>)\s+(\w+)\s*\((.*?)\)\s*\{/g;

        jsCode = jsCode.replace(funcRegex, (match, funcName, argsRaw) => {
            // Parse Args
            let argsList = argsRaw.split(',');
            let cleanArgs = argsList.map(arg => {
                arg = arg.trim();
                if (!arg) return '';
                let parts = arg.split(/\s+|&/);
                return parts[parts.length - 1]; // Last part is var name
            }).filter(x => x).join(', ');

            return `
            function ${funcName}(${cleanArgs}) {
                const _frameId = tracer.call('${funcName}', { ${cleanArgs} }, 0);
            `;
        });

        // 4. Trace Returns
        jsCode = jsCode.replace(/return\s*(.*?);/g, (match, retVal) => {
            let val = retVal.trim();
            if (!val) val = 'undefined';
            // Capture in temp var to avoid double-execution of recursive calls
            return `{ let _ret = ${val}; tracer.return(_ret, 0); return _ret; }`;
        });

        // 5. Variable Declarations
        jsCode = jsCode.replace(/vector\s*<.*?>/g, 'let');
        jsCode = jsCode.replace(/\b(int|void|string|bool|double)\b/g, 'let');

        // 6. Vector/String Methods
        jsCode = jsCode.replace(/\.push_back\(/g, '.push(');
        jsCode = jsCode.replace(/\.pop_back\(/g, '.pop(');
        jsCode = jsCode.replace(/\.size\(\)/g, '.length');
        jsCode = jsCode.replace(/\.length\(\)/g, '.length'); // Fix for string.length()
        jsCode = jsCode.replace(/\.substr\(/g, '.substring('); // substr is deprecated, use substring

        // New: Handle Initialization Lists {1, 2, 3} -> [1, 2, 3]
        jsCode = jsCode.replace(/=\s*\{(.*?)\};/g, ' = [$1];');
        jsCode = jsCode.replace(/return\s*\{(.*?)\};/g, 'return [$1];');
        jsCode = jsCode.replace(/,\s*\{(.*?)\}/g, ', [$1]');
        jsCode = jsCode.replace(/\(\{(.*?)\}/g, '([$1]');

        // 7. Line Stepper & Implicit Returns
        const lines = jsCode.split('\n');
        const instrumentedLines = [];
        let braceDepth = 0;

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            const lineNum = idx + 1;

            // Track braces to find end of function
            // Simple heuristic since we don't have a parser
            if (trimmed.includes('{')) braceDepth++;
            if (trimmed.includes('}')) {
                braceDepth--;
                if (braceDepth === 0) {
                    // Exiting function? Inject return if it was void
                    // Safe to inject always, as unreachable code is fine in JS
                    instrumentedLines.push(`tracer.return(undefined, 0);`);
                }
            }

            if (!trimmed || trimmed.startsWith('//')) {
                instrumentedLines.push(line);
                return;
            }
            if (trimmed === '}' || trimmed === '{') {
                instrumentedLines.push(line);
                return;
            }
            if (trimmed.startsWith('async function')) { // Don't instrument function header line again?
                instrumentedLines.push(line);
                return;
            }

            // Avoid instrumenting our injected code (starts with tracer)
            if (trimmed.startsWith('function') || trimmed.startsWith('tracer.')) {
                instrumentedLines.push(line);
                return;
            }

            instrumentedLines.push(`tracer.registerLine(${lineNum}); ${line}`);
        });

        jsCode = instrumentedLines.join('\n');

        return jsCode;
    }

    getLineNumber(match) {
        return 0;
    }
}
