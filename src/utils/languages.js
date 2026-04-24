// frontend/src/utils/languages.js
//
// Language definitions for Python 3, C++ 17, Java.
// Code runs remotely via the Piston API — no local compiler needed.

export const LANGUAGES = [
  {
    id:     'python',
    label:  'Python 3',
    monaco: 'python',
    color:  'text-blue-400',
    badge:  'bg-blue-500/20 border-blue-500/30 text-blue-300',
  },
  {
    id:     'cpp',
    label:  'C++ 17',
    monaco: 'cpp',
    color:  'text-cyan-400',
    badge:  'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
  },
  {
    id:     'java',
    label:  'Java',
    monaco: 'java',
    color:  'text-orange-400',
    badge:  'bg-orange-500/20 border-orange-500/30 text-orange-300',
  },
];

export function getLanguage(langId) {
  return LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
}

// ── Starter code templates ─────────────────────────────────────
//
// Python: reads stdin as a JSON string, parses it, passes to solve()
//   Input "[2,7,11,15]\n9" → parsed list + number passed to solve()
//
// C++ / Java: reads from stdin line by line.
//   The test case `stdinLines` field has the pre-formatted stdin.

function pythonStarter(problem) {
  var title = problem ? problem.title : 'Select a problem';
  var info  = problem ? `# ${problem.topic}  |  ${problem.difficulty}\n` : '';
  return `# ${title}
${info}#
# Your solve(input) function receives the test input already parsed from JSON.
# Examples:
#   input = [2, 7, 11, 15]          → a list
#   input = [[1, 2], 6]             → multiple args: arr, target = input
#
import sys, json

def solve(input):
    # Write your solution here
    pass

# ── Runner (do not edit below this line) ──
raw = sys.stdin.read().strip()
try:
    data = json.loads(raw)
except:
    data = raw
result = solve(data)
print(json.dumps(result))
`;
}

function cppStarter(problem) {
  var title = problem ? problem.title : 'Select a problem';
  var info  = problem ? `// ${problem.topic}  |  ${problem.difficulty}\n` : '';
  return `// ${title}
${info}//
// Read from stdin. Print your answer to stdout.
// The judge compares your printed output to the expected answer.
//
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Read input — example for array + target:
    // int n; cin >> n;
    // vector<int> nums(n);
    // for (int i = 0; i < n; i++) cin >> nums[i];
    // int target; cin >> target;

    // Your solution here

    // Print result:
    // cout << answer << endl;

    return 0;
}
`;
}

function javaStarter(problem) {
  var title = problem ? problem.title : 'Select a problem';
  var info  = problem ? `// ${problem.topic}  |  ${problem.difficulty}\n` : '';
  return `// ${title}
${info}//
// Read from stdin. Print answer to stdout.
// Class MUST be named "Solution".
//
import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);

        // Read input — example for array + target:
        // int n = sc.nextInt();
        // int[] nums = new int[n];
        // for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        // int target = sc.nextInt();

        // Your solution here

        // Print result:
        // System.out.println(answer);
    }
}
`;
}

const STARTERS = { python: pythonStarter, cpp: cppStarter, java: javaStarter };

export function getStarterCode(langId, problem) {
  const fn = STARTERS[langId] || pythonStarter;
  return fn(problem || null);
}