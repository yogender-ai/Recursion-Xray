/**
 * AlgorithmRegistry.js
 * Central repository for all recursion algorithms, their default inputs, and educational metadata.
 */

const ALGORITHM_REGISTRY = {
    // --- 1. LINEAR RECURSION ---
    "linear": {
        name: "Linear Recursion",
        description: "A function makes exactly one recursive call. The stack grows linearly with input size.",
        algorithms: {
            "factorial": {
                name: "Factorial",
                defaultInput: "5",
                inputType: "number",
                params: ["n"],
                rootFn: "factorial",
                code: `int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Driver
int n = 5;
factorial(n);`
            },
            "sum_array": {
                name: "Sum of Array",
                defaultInput: "1, 2, 3, 4, 5",
                inputType: "array",
                params: ["arr", "n"],
                rootFn: "sumArray",
                code: `int sumArray(vector<int> arr, int n) {
    if (n <= 0) return 0;
    return sumArray(arr, n - 1) + arr[n - 1];
}

// Driver
vector<int> arr = {1, 2, 3, 4, 5};
sumArray(arr, arr.size());`
            },
            "reverse_string": {
                name: "Reverse String",
                defaultInput: "\"hello\"",
                inputType: "string",
                params: ["s"],
                rootFn: "reverseString",
                code: `string reverseString(string s) {
    if (s.length() == 0) return "";
    return reverseString(s.substr(1)) + s[0];
}

// Driver
string s = "hello";
reverseString(s);`
            }
        }
    },

    // --- 2. TREE RECURSION ---
    "tree": {
        name: "Tree Recursion",
        description: "A function makes multiple recursive calls. The execution visualizes as a branching tree.",
        algorithms: {
            "fibonacci": {
                name: "Fibonacci Number",
                defaultInput: "5",
                inputType: "number",
                params: ["n"],
                rootFn: "fib",
                code: `int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

// Driver
int n = 5;
fib(n);`
            },
            "merge_sort": {
                name: "Merge Sort (Divide & Conquer)",
                defaultInput: "38, 27, 43, 3, 9, 82, 10",
                inputType: "array",
                params: ["arr"],
                extraArgs: ["0", "arr.size() - 1"],
                rootFn: "mergeSort",
                code: `void merge(vector<int>& arr, int l, int m, int r) {
    // Merge logic simplified for visualization focus
    // In actual C++, this would be complex. 
    // Here we focus on the call structure.
}

void mergeSort(vector<int>& arr, int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(arr, l, m);
    mergeSort(arr, m + 1, r);
    merge(arr, l, m, r);
}

// Driver
vector<int> arr = {38, 27, 43, 3, 9, 82, 10};
mergeSort(arr, 0, arr.size() - 1);`
            }
        }
    },

    // --- 3. BACKTRACKING ---
    "backtracking": {
        name: "Backtracking",
        description: "Explores all potential solutions by building candidates and abandoning valid ones (backtracking).",
        algorithms: {
            "permutations": {
                name: "Permutations",
                defaultInput: "1, 2, 3",
                inputType: "array",
                params: ["nums"],
                extraArgs: ["{}", "{}"], // curr, visited
                rootFn: "permute",
                code: `void permute(vector<int> nums, vector<int> curr, vector<bool> visited) {
    if (curr.size() == nums.size()) {
        cout << "Found: " << curr; 
        return;
    }

    for (int i = 0; i < nums.size(); i++) {
        if (visited[i]) continue;
        
        visited[i] = true;
        curr.push_back(nums[i]);
        
        permute(nums, curr, visited);
        
        visited[i] = false;
        curr.pop_back();
    }
}

// Driver
vector<int> nums = {1, 2, 3};
vector<bool> visited = {false, false, false};
permute(nums, {}, visited);`
            },
            "subsets": {
                name: "Subsets",
                defaultInput: "1, 2, 3",
                inputType: "array",
                params: ["nums"],
                extraArgs: ["{}", "0"], // curr, index
                rootFn: "subsets",
                code: `void subsets(vector<int> nums, vector<int> curr, int index) {
    cout << "Subset: " << curr;
    
    for (int i = index; i < nums.size(); i++) {
        curr.push_back(nums[i]);
        subsets(nums, curr, i + 1);
        curr.pop_back();
    }
}

// Driver
vector<int> nums = {1, 2, 3};
subsets(nums, {}, 0);`
            }
        }
    },

    // --- 4. TAIL RECURSION ---
    "tail": {
        name: "Tail Recursion",
        description: "The recursive call is the final action. Modern compilers can optimize this to a loop.",
        algorithms: {
            "tail_factorial": {
                name: "Tail Recursive Factorial",
                defaultInput: "5",
                inputType: "number",
                params: ["n"],
                rootFn: "tailFactorial",
                code: `int tailFactorial(int n, int accumulator) {
    if (n == 0) return accumulator;
    return tailFactorial(n - 1, n * accumulator);
}

// Driver
int n = 5;
tailFactorial(n, 1);`
            }
        }
    },

    // --- 5. INDIRECT RECURSION ---
    "indirect": {
        name: "Indirect Recursion",
        description: "Functions call each other in a cycle (A calls B, B calls A).",
        algorithms: {
            "even_odd": {
                name: "Even / Odd",
                defaultInput: "5",
                inputType: "number",
                params: ["n"],
                rootFn: "isEven",
                code: `bool isEven(int n);
bool isOdd(int n);

bool isEven(int n) {
    if (n == 0) return true;
    return isOdd(n - 1);
}

bool isOdd(int n) {
    if (n == 0) return false;
    return isEven(n - 1);
}

// Driver
int n = 5;
isEven(n);`
            }
        }
    },

    // --- 6. NESTED RECURSION ---
    "nested": {
        name: "Nested Recursion",
        description: "A recursive function passes a recursive call to itself as an argument.",
        algorithms: {
            "ackermann": {
                name: "Ackermann Function",
                defaultInput: "2, 1",
                inputType: "multi-number",
                params: ["m", "n"],
                rootFn: "ackermann",
                code: `int ackermann(int m, int n) {
    if (m == 0) return n + 1;
    if (m > 0 && n == 0) return ackermann(m - 1, 1);
    return ackermann(m - 1, ackermann(m, n - 1));
}

// Driver
int m = 2;
int n = 1;
ackermann(m, n);`
            }
        }
    },
    // --- 7. CUSTOM USER CODE ---
    "custom": {
        name: "My Code",
        description: "Write your own recursive function and driver code here. The visualizer will run exactly what you write.",
        algorithms: {
            "playground": {
                name: "Playground",
                defaultInput: "", // Input ignored for custom code
                inputType: "none",
                params: [],
                rootFn: "solve", // Default name, user can change
                code: `// Write your recursive function here
void solve(int n) {
    if (n <= 0) return;
    cout << "Step: " << n;
    solve(n - 1);
}

// Driver
// Call your function here with any arguments
solve(3);`
            }
        }
    }
};
