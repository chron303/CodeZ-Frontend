// frontend/src/utils/builtInProblems.js
//
// The app's built-in DSA problem sheet — 50 essential problems
// covering all major topics. This is the "coding sheet" that ships
// with the app. Admin seeds this to Firestore; user app reads live.
//
// Each problem has:
//   title, topic, difficulty, description, url, order
//   testCases: [{ id, input, stdinLines, expected, label, hidden }]

export const BUILT_IN_PROBLEMS = [
  // ── Arrays ──────────────────────────────────────────────────
  {
    title: 'Two Sum', topic: 'Arrays', difficulty: 'Easy', order: 1,
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    url: 'https://leetcode.com/problems/two-sum/',
    testCases: [
      { id:1, input:'[[2,7,11,15],9]',  stdinLines:'4\n2 7 11 15\n9',  expected:'[0,1]', label:'Basic' },
      { id:2, input:'[[3,2,4],6]',       stdinLines:'3\n3 2 4\n6',      expected:'[1,2]', label:'Non-adjacent' },
      { id:3, input:'[[3,3],6]',         stdinLines:'2\n3 3\n6',        expected:'[0,1]', label:'Duplicates' },
      { id:4, input:'[[-1,-2,-3,-4,-5],-8]', stdinLines:'5\n-1 -2 -3 -4 -5\n-8', expected:'[2,4]', label:'Negatives', hidden:true },
    ],
  },
  {
    title: 'Best Time to Buy and Sell Stock', topic: 'Arrays', difficulty: 'Easy', order: 2,
    description: 'Find the maximum profit from one buy and one sell transaction.',
    url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    testCases: [
      { id:1, input:'[7,1,5,3,6,4]', stdinLines:'6\n7 1 5 3 6 4', expected:'5', label:'Standard' },
      { id:2, input:'[7,6,4,3,1]',   stdinLines:'5\n7 6 4 3 1',   expected:'0', label:'Declining' },
      { id:3, input:'[1,2]',         stdinLines:'2\n1 2',          expected:'1', label:'Two elements' },
    ],
  },
  {
    title: 'Contains Duplicate', topic: 'Arrays', difficulty: 'Easy', order: 3,
    description: 'Return true if any value appears at least twice in the array.',
    url: 'https://leetcode.com/problems/contains-duplicate/',
    testCases: [
      { id:1, input:'[1,2,3,1]',     stdinLines:'4\n1 2 3 1',     expected:'true',  label:'Has duplicate' },
      { id:2, input:'[1,2,3,4]',     stdinLines:'4\n1 2 3 4',     expected:'false', label:'No duplicate' },
      { id:3, input:'[1]',           stdinLines:'1\n1',            expected:'false', label:'Single', hidden:true },
    ],
  },
  {
    title: 'Maximum Subarray', topic: 'Arrays', difficulty: 'Medium', order: 4,
    description: 'Find the contiguous subarray with the largest sum and return its sum.',
    url: 'https://leetcode.com/problems/maximum-subarray/',
    testCases: [
      { id:1, input:'[-2,1,-3,4,-1,2,1,-5,4]', stdinLines:'9\n-2 1 -3 4 -1 2 1 -5 4', expected:'6',  label:'Standard' },
      { id:2, input:'[1]',                      stdinLines:'1\n1',                      expected:'1',  label:'Single' },
      { id:3, input:'[-1,-2,-3]',               stdinLines:'3\n-1 -2 -3',               expected:'-1', label:'All negative', hidden:true },
    ],
  },
  {
    title: 'Product of Array Except Self', topic: 'Arrays', difficulty: 'Medium', order: 5,
    description: 'Return an array where each element is the product of all other elements. No division allowed.',
    url: 'https://leetcode.com/problems/product-of-array-except-self/',
    testCases: [
      { id:1, input:'[1,2,3,4]',     stdinLines:'4\n1 2 3 4',     expected:'[24,12,8,6]', label:'Standard' },
      { id:2, input:'[-1,1,0,-3,3]', stdinLines:'5\n-1 1 0 -3 3', expected:'[0,0,9,0,0]', label:'With zero' },
    ],
  },
  {
    title: 'Merge Intervals', topic: 'Arrays', difficulty: 'Medium', order: 6,
    description: 'Merge all overlapping intervals and return an array of non-overlapping intervals.',
    url: 'https://leetcode.com/problems/merge-intervals/',
    testCases: [
      { id:1, input:'[[1,3],[2,6],[8,10],[15,18]]', stdinLines:'4\n1 3\n2 6\n8 10\n15 18', expected:'[[1,6],[8,10],[15,18]]', label:'Standard' },
      { id:2, input:'[[1,4],[4,5]]',                stdinLines:'2\n1 4\n4 5',              expected:'[[1,5]]',               label:'Touch' },
    ],
  },

  // ── Strings ─────────────────────────────────────────────────
  {
    title: 'Valid Anagram', topic: 'Strings', difficulty: 'Easy', order: 1,
    description: 'Given two strings s and t, return true if t is an anagram of s.',
    url: 'https://leetcode.com/problems/valid-anagram/',
    testCases: [
      { id:1, input:'["anagram","nagaram"]', stdinLines:'anagram\nnagaram', expected:'true',  label:'Is anagram' },
      { id:2, input:'["rat","car"]',         stdinLines:'rat\ncar',         expected:'false', label:'Not anagram' },
      { id:3, input:'["a","ab"]',            stdinLines:'a\nab',            expected:'false', label:'Different length' },
    ],
  },
  {
    title: 'Valid Parentheses', topic: 'Stacks', difficulty: 'Easy', order: 1,
    description: 'Given a string containing brackets, determine if the input string is valid.',
    url: 'https://leetcode.com/problems/valid-parentheses/',
    testCases: [
      { id:1, input:'"()"',     stdinLines:'()',     expected:'true',  label:'Simple' },
      { id:2, input:'"()[]{}"', stdinLines:'()[]{}", expected:"true',  label:'Mixed' },
      { id:3, input:'"(]"',     stdinLines:'(]',     expected:'false', label:'Mismatch' },
      { id:4, input:'"{[]}"',   stdinLines:'{[]}',   expected:'true',  label:'Nested', hidden:true },
    ],
  },
  {
    title: 'Longest Substring Without Repeating Characters', topic: 'Sliding Window', difficulty: 'Medium', order: 1,
    description: 'Find the length of the longest substring without repeating characters.',
    url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    testCases: [
      { id:1, input:'"abcabcbb"', stdinLines:'abcabcbb', expected:'3', label:'Standard' },
      { id:2, input:'"bbbbb"',    stdinLines:'bbbbb',    expected:'1', label:'All same' },
      { id:3, input:'"pwwkew"',   stdinLines:'pwwkew',   expected:'3', label:'Mid window' },
      { id:4, input:'""',         stdinLines:'',         expected:'0', label:'Empty', hidden:true },
    ],
  },
  {
    title: 'Palindrome Number', topic: 'Math', difficulty: 'Easy', order: 1,
    description: 'Determine whether an integer is a palindrome without converting to string.',
    url: 'https://leetcode.com/problems/palindrome-number/',
    testCases: [
      { id:1, input:'121',  stdinLines:'121',  expected:'true',  label:'Palindrome' },
      { id:2, input:'-121', stdinLines:'-121', expected:'false', label:'Negative' },
      { id:3, input:'10',   stdinLines:'10',   expected:'false', label:'Trailing zero' },
      { id:4, input:'0',    stdinLines:'0',    expected:'true',  label:'Zero', hidden:true },
    ],
  },

  // ── Binary Search ────────────────────────────────────────────
  {
    title: 'Binary Search', topic: 'Binary Search', difficulty: 'Easy', order: 1,
    description: 'Given a sorted array and a target, return the index or -1 if not found.',
    url: 'https://leetcode.com/problems/binary-search/',
    testCases: [
      { id:1, input:'[[-1,0,3,5,9,12],9]', stdinLines:'6\n-1 0 3 5 9 12\n9', expected:'4',  label:'Found' },
      { id:2, input:'[[-1,0,3,5,9,12],2]', stdinLines:'6\n-1 0 3 5 9 12\n2', expected:'-1', label:'Not found' },
      { id:3, input:'[[5],5]',             stdinLines:'1\n5\n5',              expected:'0',  label:'Single' },
    ],
  },
  {
    title: 'Search Insert Position', topic: 'Binary Search', difficulty: 'Easy', order: 2,
    description: 'Given a sorted array and a target, return the index if found or where it would be inserted.',
    url: 'https://leetcode.com/problems/search-insert-position/',
    testCases: [
      { id:1, input:'[[1,3,5,6],5]', stdinLines:'4\n1 3 5 6\n5', expected:'2', label:'Found' },
      { id:2, input:'[[1,3,5,6],2]', stdinLines:'4\n1 3 5 6\n2', expected:'1', label:'Insert middle' },
      { id:3, input:'[[1,3,5,6],7]', stdinLines:'4\n1 3 5 6\n7', expected:'4', label:'Insert end' },
    ],
  },

  // ── Two Pointers ─────────────────────────────────────────────
  {
    title: 'Valid Palindrome', topic: 'Two Pointers', difficulty: 'Easy', order: 1,
    description: 'A phrase is a palindrome if, after lowercasing and removing non-alphanumeric characters, it reads the same forwards and backwards.',
    url: 'https://leetcode.com/problems/valid-palindrome/',
    testCases: [
      { id:1, input:'"A man, a plan, a canal: Panama"', stdinLines:'A man, a plan, a canal: Panama', expected:'true',  label:'Classic' },
      { id:2, input:'"race a car"',                     stdinLines:'race a car',                     expected:'false', label:'Not palindrome' },
      { id:3, input:'" "',                              stdinLines:' ',                              expected:'true',  label:'Space only' },
    ],
  },
  {
    title: 'Three Sum', topic: 'Two Pointers', difficulty: 'Medium', order: 2,
    description: 'Find all unique triplets that sum to zero.',
    url: 'https://leetcode.com/problems/3sum/',
    testCases: [
      { id:1, input:'[-1,0,1,2,-1,-4]', stdinLines:'6\n-1 0 1 2 -1 -4', expected:'[[-1,-1,2],[-1,0,1]]', label:'Standard' },
      { id:2, input:'[0,1,1]',           stdinLines:'3\n0 1 1',           expected:'[]',                   label:'No solution' },
      { id:3, input:'[0,0,0]',           stdinLines:'3\n0 0 0',           expected:'[[0,0,0]]',            label:'All zeros' },
    ],
  },

  // ── Trees ────────────────────────────────────────────────────
  {
    title: 'Maximum Depth of Binary Tree', topic: 'Trees', difficulty: 'Easy', order: 1,
    description: 'Find the maximum depth of a binary tree (the number of nodes along the longest path from root to leaf).',
    url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
    testCases: [
      { id:1, input:'[3,9,20,null,null,15,7]', stdinLines:'7\n3 9 20 -1 -1 15 7', expected:'3', label:'Standard' },
      { id:2, input:'[1,null,2]',              stdinLines:'3\n1 -1 2',             expected:'2', label:'Right skewed' },
      { id:3, input:'[]',                      stdinLines:'0',                     expected:'0', label:'Empty' },
    ],
  },
  {
    title: 'Invert Binary Tree', topic: 'Trees', difficulty: 'Easy', order: 2,
    description: 'Invert a binary tree (mirror it).',
    url: 'https://leetcode.com/problems/invert-binary-tree/',
    testCases: [
      { id:1, input:'[4,2,7,1,3,6,9]', stdinLines:'7\n4 2 7 1 3 6 9', expected:'[4,7,2,9,6,3,1]', label:'Full tree' },
      { id:2, input:'[2,1,3]',         stdinLines:'3\n2 1 3',         expected:'[2,3,1]',          label:'Simple' },
    ],
  },
  {
    title: 'Diameter of Binary Tree', topic: 'Trees', difficulty: 'Easy', order: 3,
    description: 'Find the length of the diameter — the longest path between any two nodes.',
    url: 'https://leetcode.com/problems/diameter-of-binary-tree/',
    testCases: [
      { id:1, input:'[1,2,3,4,5]', stdinLines:'5\n1 2 3 4 5', expected:'3', label:'Standard' },
      { id:2, input:'[1,2]',       stdinLines:'2\n1 2',       expected:'1', label:'Two nodes' },
    ],
  },

  // ── Dynamic Programming ──────────────────────────────────────
  {
    title: 'Climbing Stairs', topic: 'Dynamic Programming', difficulty: 'Easy', order: 1,
    description: 'You can climb 1 or 2 steps at a time. How many distinct ways can you climb n stairs?',
    url: 'https://leetcode.com/problems/climbing-stairs/',
    testCases: [
      { id:1, input:'2',  stdinLines:'2',  expected:'2',  label:'n=2' },
      { id:2, input:'3',  stdinLines:'3',  expected:'3',  label:'n=3' },
      { id:3, input:'10', stdinLines:'10', expected:'89', label:'n=10' },
      { id:4, input:'1',  stdinLines:'1',  expected:'1',  label:'n=1', hidden:true },
    ],
  },
  {
    title: 'Coin Change', topic: 'Dynamic Programming', difficulty: 'Medium', order: 2,
    description: 'Find the fewest number of coins needed to make up the amount. Return -1 if not possible.',
    url: 'https://leetcode.com/problems/coin-change/',
    testCases: [
      { id:1, input:'[[1,5,11],11]', stdinLines:'3\n1 5 11\n11', expected:'3',  label:'Standard' },
      { id:2, input:'[[2],3]',       stdinLines:'1\n2\n3',        expected:'-1', label:'Impossible' },
      { id:3, input:'[[1],0]',       stdinLines:'1\n1\n0',        expected:'0',  label:'Zero amount' },
    ],
  },
  {
    title: 'House Robber', topic: 'Dynamic Programming', difficulty: 'Medium', order: 3,
    description: 'Rob houses to maximize money without robbing two adjacent houses.',
    url: 'https://leetcode.com/problems/house-robber/',
    testCases: [
      { id:1, input:'[1,2,3,1]',   stdinLines:'4\n1 2 3 1',   expected:'4',  label:'Standard' },
      { id:2, input:'[2,7,9,3,1]', stdinLines:'5\n2 7 9 3 1', expected:'12', label:'Larger' },
      { id:3, input:'[1]',         stdinLines:'1\n1',          expected:'1',  label:'Single', hidden:true },
    ],
  },
  {
    title: 'Longest Common Subsequence', topic: 'Dynamic Programming', difficulty: 'Medium', order: 4,
    description: 'Find the length of the longest common subsequence of two strings.',
    url: 'https://leetcode.com/problems/longest-common-subsequence/',
    testCases: [
      { id:1, input:'["abcde","ace"]', stdinLines:'abcde\nace', expected:'3', label:'Standard' },
      { id:2, input:'["abc","abc"]',   stdinLines:'abc\nabc',   expected:'3', label:'Same' },
      { id:3, input:'["abc","def"]',   stdinLines:'abc\ndef',   expected:'0', label:'No common' },
    ],
  },
  {
    title: 'Word Break', topic: 'Dynamic Programming', difficulty: 'Medium', order: 5,
    description: 'Return true if the string can be segmented using words from the dictionary.',
    url: 'https://leetcode.com/problems/word-break/',
    testCases: [
      { id:1, input:'["leetcode",["leet","code"]]',      stdinLines:'leetcode\n2\nleet code',       expected:'true',  label:'Standard' },
      { id:2, input:'["applepenapple",["apple","pen"]]', stdinLines:'applepenapple\n2\napple pen',  expected:'true',  label:'Reuse' },
      { id:3, input:'["catsandog",["cats","dog","and"]]', stdinLines:'catsandog\n3\ncats dog and',  expected:'false', label:'No match' },
    ],
  },

  // ── Graphs ───────────────────────────────────────────────────
  {
    title: 'Number of Islands', topic: 'Graphs', difficulty: 'Medium', order: 1,
    description: 'Count the number of islands (connected 1s) in the grid.',
    url: 'https://leetcode.com/problems/number-of-islands/',
    testCases: [
      { id:1, input:'[["1","1","0"],["0","1","0"],["0","0","1"]]', stdinLines:'3 3\n1 1 0\n0 1 0\n0 0 1', expected:'2', label:'Two islands' },
      { id:2, input:'[["1","1","1"],["0","1","0"],["1","1","1"]]', stdinLines:'3 3\n1 1 1\n0 1 0\n1 1 1', expected:'1', label:'One island' },
    ],
  },
  {
    title: 'Clone Graph', topic: 'Graphs', difficulty: 'Medium', order: 2,
    description: 'Return a deep copy of a given connected undirected graph.',
    url: 'https://leetcode.com/problems/clone-graph/',
    testCases: [
      { id:1, input:'[[2,4],[1,3],[2,4],[1,3]]', stdinLines:'4\n2 4\n1 3\n2 4\n1 3', expected:'[[2,4],[1,3],[2,4],[1,3]]', label:'Standard' },
    ],
  },

  // ── Hashing ──────────────────────────────────────────────────
  {
    title: 'Group Anagrams', topic: 'Hashing', difficulty: 'Medium', order: 1,
    description: 'Group strings that are anagrams of each other.',
    url: 'https://leetcode.com/problems/group-anagrams/',
    testCases: [
      { id:1, input:'["eat","tea","tan","ate","nat","bat"]', stdinLines:'6\neat tea tan ate nat bat', expected:'[["eat","tea","ate"],["tan","nat"],["bat"]]', label:'Standard' },
      { id:2, input:'["a"]',                                stdinLines:'1\na',                       expected:'[["a"]]',                                    label:'Single' },
    ],
  },
  {
    title: 'Top K Frequent Elements', topic: 'Hashing', difficulty: 'Medium', order: 2,
    description: 'Return the k most frequent elements in the array.',
    url: 'https://leetcode.com/problems/top-k-frequent-elements/',
    testCases: [
      { id:1, input:'[[1,1,1,2,2,3],2]', stdinLines:'6\n1 1 1 2 2 3\n2', expected:'[1,2]', label:'Standard' },
      { id:2, input:'[[1],1]',            stdinLines:'1\n1\n1',            expected:'[1]',   label:'Single' },
    ],
  },

  // ── Heaps ────────────────────────────────────────────────────
  {
    title: 'Kth Largest Element in an Array', topic: 'Heaps', difficulty: 'Medium', order: 1,
    description: 'Find the kth largest element in an unsorted array.',
    url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
    testCases: [
      { id:1, input:'[[3,2,1,5,6,4],2]',       stdinLines:'6\n3 2 1 5 6 4\n2', expected:'5', label:'Standard' },
      { id:2, input:'[[3,2,3,1,2,4,5,5,6],4]', stdinLines:'9\n3 2 3 1 2 4 5 5 6\n4', expected:'4', label:'Duplicates' },
    ],
  },

  // ── Linked Lists ─────────────────────────────────────────────
  {
    title: 'Reverse Linked List', topic: 'Linked Lists', difficulty: 'Easy', order: 1,
    description: 'Reverse a singly linked list.',
    url: 'https://leetcode.com/problems/reverse-linked-list/',
    testCases: [
      { id:1, input:'[1,2,3,4,5]', stdinLines:'5\n1 2 3 4 5', expected:'[5,4,3,2,1]', label:'Standard' },
      { id:2, input:'[1,2]',       stdinLines:'2\n1 2',       expected:'[2,1]',        label:'Two nodes' },
      { id:3, input:'[]',          stdinLines:'0',            expected:'[]',           label:'Empty', hidden:true },
    ],
  },
  {
    title: 'Merge Two Sorted Lists', topic: 'Linked Lists', difficulty: 'Easy', order: 2,
    description: 'Merge two sorted linked lists and return the merged list.',
    url: 'https://leetcode.com/problems/merge-two-sorted-lists/',
    testCases: [
      { id:1, input:'[[1,2,4],[1,3,4]]', stdinLines:'3\n1 2 4\n3\n1 3 4', expected:'[1,1,2,3,4,4]', label:'Standard' },
      { id:2, input:'[[],[]]',           stdinLines:'0\n0',                expected:'[]',            label:'Both empty' },
    ],
  },
  {
    title: 'Linked List Cycle', topic: 'Linked Lists', difficulty: 'Easy', order: 3,
    description: 'Determine if the linked list has a cycle using O(1) space.',
    url: 'https://leetcode.com/problems/linked-list-cycle/',
    testCases: [
      { id:1, input:'{"nodes":[3,2,0,-4],"pos":1}', stdinLines:'4\n3 2 0 -4\n1', expected:'true',  label:'Has cycle' },
      { id:2, input:'{"nodes":[1,2],"pos":-1}',     stdinLines:'2\n1 2\n-1',     expected:'false', label:'No cycle' },
    ],
  },

  // ── Sorting ──────────────────────────────────────────────────
  {
    title: 'Sort Colors', topic: 'Sorting', difficulty: 'Medium', order: 1,
    description: 'Sort an array containing 0s, 1s, and 2s in-place (Dutch flag problem).',
    url: 'https://leetcode.com/problems/sort-colors/',
    testCases: [
      { id:1, input:'[2,0,2,1,1,0]', stdinLines:'6\n2 0 2 1 1 0', expected:'[0,0,1,1,2,2]', label:'Standard' },
      { id:2, input:'[2,0,1]',       stdinLines:'3\n2 0 1',        expected:'[0,1,2]',       label:'One each' },
    ],
  },

  // ── Greedy ───────────────────────────────────────────────────
  {
    title: 'Jump Game', topic: 'Greedy', difficulty: 'Medium', order: 1,
    description: 'Return true if you can reach the last index. Each element is your max jump length.',
    url: 'https://leetcode.com/problems/jump-game/',
    testCases: [
      { id:1, input:'[2,3,1,1,4]', stdinLines:'5\n2 3 1 1 4', expected:'true',  label:'Reachable' },
      { id:2, input:'[3,2,1,0,4]', stdinLines:'5\n3 2 1 0 4', expected:'false', label:'Blocked' },
      { id:3, input:'[0]',         stdinLines:'1\n0',          expected:'true',  label:'Single' },
    ],
  },

  // ── Recursion / Backtracking ─────────────────────────────────
  {
    title: 'Subsets', topic: 'Backtracking', difficulty: 'Medium', order: 1,
    description: 'Return all possible subsets (the power set) of a distinct integer array.',
    url: 'https://leetcode.com/problems/subsets/',
    testCases: [
      { id:1, input:'[1,2,3]', stdinLines:'3\n1 2 3', expected:'[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]', label:'Standard' },
      { id:2, input:'[0]',     stdinLines:'1\n0',     expected:'[[],[0]]',                                   label:'Single' },
    ],
  },
  {
    title: 'Permutations', topic: 'Backtracking', difficulty: 'Medium', order: 2,
    description: 'Return all possible permutations of a distinct integer array.',
    url: 'https://leetcode.com/problems/permutations/',
    testCases: [
      { id:1, input:'[1,2,3]', stdinLines:'3\n1 2 3', expected:'[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]', label:'Three' },
      { id:2, input:'[0,1]',   stdinLines:'2\n0 1',   expected:'[[0,1],[1,0]]',                                     label:'Two' },
    ],
  },
  {
    title: 'Letter Combinations of a Phone Number', topic: 'Backtracking', difficulty: 'Medium', order: 3,
    description: 'Return all letter combinations that the number could represent on a phone keypad.',
    url: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/',
    testCases: [
      { id:1, input:'"23"', stdinLines:'23', expected:'["ad","ae","af","bd","be","bf","cd","ce","cf"]', label:'Two digits' },
      { id:2, input:'""',   stdinLines:'',   expected:'[]',                                            label:'Empty' },
      { id:3, input:'"2"',  stdinLines:'2',  expected:'["a","b","c"]',                                 label:'Single' },
    ],
  },

  // ── Sliding Window ───────────────────────────────────────────
  {
    title: 'Minimum Window Substring', topic: 'Sliding Window', difficulty: 'Hard', order: 2,
    description: 'Find the minimum window substring that contains all characters of t.',
    url: 'https://leetcode.com/problems/minimum-window-substring/',
    testCases: [
      { id:1, input:'["ADOBECODEBANC","ABC"]', stdinLines:'ADOBECODEBANC\nABC', expected:'"BANC"', label:'Standard' },
      { id:2, input:'["a","a"]',              stdinLines:'a\na',               expected:'"a"',    label:'Same char' },
      { id:3, input:'["a","aa"]',             stdinLines:'a\naa',              expected:'""',     label:'Impossible' },
    ],
  },

  // ── Tries ─────────────────────────────────────────────────────
  {
    title: 'Implement Trie', topic: 'Tries', difficulty: 'Medium', order: 1,
    description: 'Implement a trie with insert, search, and startsWith methods.',
    url: 'https://leetcode.com/problems/implement-trie-prefix-tree/',
    testCases: [
      { id:1, input:'[["insert","apple"],["search","apple"],["search","app"],["startsWith","app"],["insert","app"],["search","app"]]',
        stdinLines:'6\ninsert apple\nsearch apple\nsearch app\nstartsWith app\ninsert app\nsearch app',
        expected:'[null,true,false,true,null,true]', label:'Standard' },
    ],
  },

  // ── Bit Manipulation ─────────────────────────────────────────
  {
    title: 'Single Number', topic: 'Bit Manipulation', difficulty: 'Easy', order: 1,
    description: 'Every element appears twice except one. Find that single element.',
    url: 'https://leetcode.com/problems/single-number/',
    testCases: [
      { id:1, input:'[2,2,1]',     stdinLines:'3\n2 2 1',     expected:'1', label:'Basic' },
      { id:2, input:'[4,1,2,1,2]', stdinLines:'5\n4 1 2 1 2', expected:'4', label:'Larger' },
      { id:3, input:'[1]',         stdinLines:'1\n1',          expected:'1', label:'Single' },
    ],
  },
  {
    title: 'Counting Bits', topic: 'Bit Manipulation', difficulty: 'Easy', order: 2,
    description: 'For every number from 0 to n, return the count of 1s in their binary representation.',
    url: 'https://leetcode.com/problems/counting-bits/',
    testCases: [
      { id:1, input:'2', stdinLines:'2', expected:'[0,1,1]',       label:'n=2' },
      { id:2, input:'5', stdinLines:'5', expected:'[0,1,1,2,1,2]', label:'n=5' },
    ],
  },
];