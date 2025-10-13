

import { Problem, Difficulty } from './types';

export const cppTemplate = `#include <bits/stdc++.h>
using namespace std;

void solve() {
    // Your solution for each test case here
}

int main() {
    cin.tie(0)->sync_with_stdio(0);
    int t=1;
    std::cin >> t; // Read the number of test cases
    while (t--) {
        solve();
    }
    return 0;
}`;

export const jsTemplate = `'use strict';

process.stdin.resume();
process.stdin.setEncoding('utf-8');

let inputString = '';
let currentLine = 0;

process.stdin.on('data', function(inputStdin) {
    inputString += inputStdin;
});

process.stdin.on('end', function() {
    inputString = inputString.split('\\n');
    main();
});

function readLine() {
    return inputString[currentLine++];
}

function solve() {
    // Your solution for each test case here
    // Use readLine() to read input lines
}

function main() {
    try {
        const t = parseInt(readLine().trim(), 10);
        for (let i = 0; i < t; i++) {
            solve();
        }
    } catch (e) {
        // Gracefully handle empty input
    }
}
`;


export const DUMMY_PROBLEMS: Problem[] = [
  {
    "id": "p_001",
    "title": "Longest Increasing Subsequence (LIS)",
    "difficulty": Difficulty.Medium,
    "tags": ["dp", "binary-search", "array"],
    "timeLimit": "1s",
    "memoryLimit": "256MB",
    "description": "Given an array of integers, return the length of the longest strictly increasing subsequence. A subsequence is a sequence that can be derived from an array by deleting some or no elements without changing the order of the remaining elements.",
    "isSolved": true,
    "examples": [
      {
        "input": "nums = [10,9,2,5,3,7,101,18]",
        "output": "4",
        "explanation": "The longest increasing subsequence is [2,3,7,101], therefore the length is 4."
      }
    ],
    "testcases": [
      { "id": "t1", "input": "[10,9,2,5,3,7,101,18]", "expected": "4" },
      { "id": "t2", "input": "[0,1,0,3,2,3]", "expected": "4" },
      { "id": "t3", "input": "[7,7,7,7,7,7,7]", "expected": "1" }
    ],
    "templates": {
      "cpp": cppTemplate,
      "js": jsTemplate
    }
  },
  {
    "id": "p_002",
    "title": "Two Sum",
    "difficulty": Difficulty.Easy,
    "tags": ["array", "hash-table"],
    "timeLimit": "1s",
    "memoryLimit": "256MB",
    "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    "isSolved": false,
    "examples": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "output": "[0,1]",
        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
      }
    ],
    "testcases": [
      { "id": "t1", "input": "[2,7,11,15], 9", "expected": "[0,1]" },
      { "id": "t2", "input": "[3,2,4], 6", "expected": "[1,2]" },
      { "id": "t3", "input": "[3,3], 6", "expected": "[0,1]" }
    ],
    "templates": {
      "cpp": cppTemplate,
      "js": jsTemplate
    }
  },
   {
    "id": "p_003",
    "title": "Trapping Rain Water",
    "difficulty": Difficulty.Hard,
    "tags": ["array", "two-pointers", "dp", "stack"],
    "timeLimit": "1s",
    "memoryLimit": "256MB",
    "description": "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    "isSolved": true,
    "examples": [
      {
        "input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        "output": "6",
        "explanation": "The above elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water (blue section) are being trapped."
      }
    ],
    "testcases": [
      { "id": "t1", "input": "[0,1,0,2,1,0,1,3,2,1,2,1]", "expected": "6" },
      { "id": "t2", "input": "[4,2,0,3,2,5]", "expected": "9" }
    ],
    "templates": {
      "cpp": cppTemplate,
      "js": jsTemplate
    }
  }
];

export const DIFFICULTY_COLORS: { [key in Difficulty]: string } = {
    [Difficulty.Easy]: 'bg-difficulty-easy text-white',
    [Difficulty.Medium]: 'bg-difficulty-medium text-white',
    [Difficulty.Hard]: 'bg-difficulty-hard text-white',
};