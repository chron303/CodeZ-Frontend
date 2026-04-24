// frontend/src/utils/testCaseLibrary.js
//
// Curated test cases for common DSA problems.
// Keyed by normalized problem title (lowercase, stripped).
//
// Each entry: [{ id, input, expected, label, hidden? }]
//
// Input format: JSON-parseable value passed directly to solve().
//   - Single value: solve receives it directly
//   - Multiple args: pass as an array, destructure in solve
//
// Covered topics: Arrays, Strings, Linked Lists, Trees, DP, Graphs,
//   Stacks, Queues, Binary Search, Two Pointers, Sliding Window,
//   Hashing, Heaps, Sorting, Greedy, Recursion, Backtracking

const LIBRARY = {
  // ── Arrays ──────────────────────────────────────────────────
  'two sum': [
    { id: 1, input: '[[2,7,11,15],9]',  expected: '[0,1]',  label: 'Basic' },
    { id: 2, input: '[[3,2,4],6]',       expected: '[1,2]',  label: 'Non-adjacent' },
    { id: 3, input: '[[3,3],6]',         expected: '[0,1]',  label: 'Duplicates' },
    { id: 4, input: '[[1,2,3,4,5],9]',   expected: '[3,4]',  label: 'End elements' },
    { id: 5, input: '[[-1,-2,-3,-4,-5],-8]', expected: '[2,4]', label: 'Negatives', hidden: true },
  ],
  'best time to buy and sell stock': [
    { id: 1, input: '[7,1,5,3,6,4]',  expected: '5',  label: 'Standard' },
    { id: 2, input: '[7,6,4,3,1]',    expected: '0',  label: 'Declining' },
    { id: 3, input: '[1,2]',          expected: '1',  label: 'Two elements' },
    { id: 4, input: '[2,4,1]',        expected: '2',  label: 'Short' },
    { id: 5, input: '[3,1,4,1,5,9]',  expected: '8',  label: 'Complex', hidden: true },
  ],
  'contains duplicate': [
    { id: 1, input: '[1,2,3,1]',      expected: 'true',  label: 'Has duplicate' },
    { id: 2, input: '[1,2,3,4]',      expected: 'false', label: 'No duplicate' },
    { id: 3, input: '[1,1,1,3,3,4,3,2,4,2]', expected: 'true', label: 'Many' },
    { id: 4, input: '[1]',            expected: 'false', label: 'Single', hidden: true },
  ],
  'product of array except self': [
    { id: 1, input: '[1,2,3,4]',    expected: '[24,12,8,6]',  label: 'Standard' },
    { id: 2, input: '[-1,1,0,-3,3]', expected: '[0,0,9,0,0]', label: 'With zero' },
    { id: 3, input: '[2,3]',        expected: '[3,2]',         label: 'Two elements' },
  ],
  'maximum subarray': [
    { id: 1, input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6',  label: 'Standard' },
    { id: 2, input: '[1]',                       expected: '1',  label: 'Single' },
    { id: 3, input: '[5,4,-1,7,8]',              expected: '23', label: 'Mostly positive' },
    { id: 4, input: '[-1,-2,-3]',                expected: '-1', label: 'All negative', hidden: true },
  ],
  'merge intervals': [
    { id: 1, input: '[[1,3],[2,6],[8,10],[15,18]]', expected: '[[1,6],[8,10],[15,18]]', label: 'Standard' },
    { id: 2, input: '[[1,4],[4,5]]',                expected: '[[1,5]]',               label: 'Touch' },
    { id: 3, input: '[[1,4],[0,4]]',                expected: '[[0,4]]',               label: 'Overlap start' },
    { id: 4, input: '[[1,4],[2,3]]',                expected: '[[1,4]]',               label: 'Contained', hidden: true },
  ],

  // ── Strings ─────────────────────────────────────────────────
  'valid anagram': [
    { id: 1, input: '["anagram","nagaram"]', expected: 'true',  label: 'Is anagram' },
    { id: 2, input: '["rat","car"]',         expected: 'false', label: 'Not anagram' },
    { id: 3, input: '["a","ab"]',            expected: 'false', label: 'Different length' },
    { id: 4, input: '["",""]',               expected: 'true',  label: 'Empty strings', hidden: true },
  ],
  'valid parentheses': [
    { id: 1, input: '"()"',      expected: 'true',  label: 'Simple' },
    { id: 2, input: '"()[]{}"',  expected: 'true',  label: 'Mixed' },
    { id: 3, input: '"(]"',      expected: 'false', label: 'Mismatch' },
    { id: 4, input: '"([)]"',    expected: 'false', label: 'Wrong order' },
    { id: 5, input: '"{[]}"',    expected: 'true',  label: 'Nested', hidden: true },
  ],
  'longest substring without repeating characters': [
    { id: 1, input: '"abcabcbb"', expected: '3',  label: 'Standard' },
    { id: 2, input: '"bbbbb"',    expected: '1',  label: 'All same' },
    { id: 3, input: '"pwwkew"',   expected: '3',  label: 'Mid window' },
    { id: 4, input: '""',         expected: '0',  label: 'Empty', hidden: true },
  ],
  'reverse string': [
    { id: 1, input: '["h","e","l","l","o"]', expected: '["o","l","l","e","h"]', label: 'Standard' },
    { id: 2, input: '["H","a","n","n","a","h"]', expected: '["h","a","n","n","a","H"]', label: 'Mixed case' },
    { id: 3, input: '["a"]', expected: '["a"]', label: 'Single' },
  ],
  'palindrome number': [
    { id: 1, input: '121',   expected: 'true',  label: 'Palindrome' },
    { id: 2, input: '-121',  expected: 'false', label: 'Negative' },
    { id: 3, input: '10',    expected: 'false', label: 'Trailing zero' },
    { id: 4, input: '0',     expected: 'true',  label: 'Zero', hidden: true },
  ],

  // ── Binary Search ────────────────────────────────────────────
  'binary search': [
    { id: 1, input: '[[-1,0,3,5,9,12],9]',  expected: '4',  label: 'Found' },
    { id: 2, input: '[[-1,0,3,5,9,12],2]',  expected: '-1', label: 'Not found' },
    { id: 3, input: '[[5],5]',              expected: '0',  label: 'Single match' },
    { id: 4, input: '[[1,3,5,7,9,11],11]',  expected: '5',  label: 'Last element', hidden: true },
  ],
  'search insert position': [
    { id: 1, input: '[[1,3,5,6],5]', expected: '2', label: 'Found' },
    { id: 2, input: '[[1,3,5,6],2]', expected: '1', label: 'Insert middle' },
    { id: 3, input: '[[1,3,5,6],7]', expected: '4', label: 'Insert end' },
    { id: 4, input: '[[1,3,5,6],0]', expected: '0', label: 'Insert start' },
  ],

  // ── Two Pointers ─────────────────────────────────────────────
  'valid palindrome': [
    { id: 1, input: '"A man, a plan, a canal: Panama"', expected: 'true',  label: 'Classic' },
    { id: 2, input: '"race a car"',                     expected: 'false', label: 'Not palindrome' },
    { id: 3, input: '" "',                              expected: 'true',  label: 'Space only' },
    { id: 4, input: '"Was it a car or a cat I saw?"',   expected: 'true',  label: 'Complex', hidden: true },
  ],
  'three sum': [
    { id: 1, input: '[-1,0,1,2,-1,-4]', expected: '[[-1,-1,2],[-1,0,1]]', label: 'Standard' },
    { id: 2, input: '[0,1,1]',           expected: '[]',                   label: 'No solution' },
    { id: 3, input: '[0,0,0]',           expected: '[[0,0,0]]',            label: 'All zeros' },
  ],

  // ── Sliding Window ───────────────────────────────────────────
  'maximum average subarray i': [
    { id: 1, input: '[[1,12,-5,-6,50,3],4]', expected: '12.75', label: 'Standard' },
    { id: 2, input: '[[5],1]',               expected: '5.0',   label: 'Single' },
  ],
  'minimum window substring': [
    { id: 1, input: '["ADOBECODEBANC","ABC"]', expected: '"BANC"', label: 'Standard' },
    { id: 2, input: '["a","a"]',              expected: '"a"',    label: 'Same char' },
    { id: 3, input: '["a","aa"]',             expected: '""',     label: 'Impossible' },
  ],

  // ── Stacks ───────────────────────────────────────────────────
  'min stack': [
    { id: 1, input: '"push-3,push-2,push-0,getMin,pop,top,getMin"', expected: '0,2,3', label: 'Sequence' },
  ],
  'daily temperatures': [
    { id: 1, input: '[73,74,75,71,69,72,76,73]', expected: '[1,1,4,2,1,1,0,0]', label: 'Standard' },
    { id: 2, input: '[30,40,50,60]',             expected: '[1,1,1,0]',          label: 'Ascending' },
    { id: 3, input: '[30,60,90]',                expected: '[1,1,0]',            label: 'Simple' },
  ],

  // ── Linked Lists ─────────────────────────────────────────────
  'reverse linked list': [
    { id: 1, input: '[1,2,3,4,5]', expected: '[5,4,3,2,1]', label: 'Standard' },
    { id: 2, input: '[1,2]',       expected: '[2,1]',        label: 'Two nodes' },
    { id: 3, input: '[1]',         expected: '[1]',          label: 'Single' },
    { id: 4, input: '[]',          expected: '[]',           label: 'Empty', hidden: true },
  ],
  'merge two sorted lists': [
    { id: 1, input: '[[1,2,4],[1,3,4]]', expected: '[1,1,2,3,4,4]', label: 'Standard' },
    { id: 2, input: '[[],[]]',           expected: '[]',             label: 'Both empty' },
    { id: 3, input: '[[],[ 0]]',         expected: '[0]',            label: 'One empty' },
  ],

  // ── Trees ────────────────────────────────────────────────────
  'maximum depth of binary tree': [
    { id: 1, input: '[3,9,20,null,null,15,7]', expected: '3', label: 'Standard' },
    { id: 2, input: '[1,null,2]',              expected: '2', label: 'Right skewed' },
    { id: 3, input: '[]',                      expected: '0', label: 'Empty' },
  ],
  'invert binary tree': [
    { id: 1, input: '[4,2,7,1,3,6,9]', expected: '[4,7,2,9,6,3,1]', label: 'Full tree' },
    { id: 2, input: '[2,1,3]',         expected: '[2,3,1]',          label: 'Simple' },
    { id: 3, input: '[]',              expected: '[]',               label: 'Empty' },
  ],
  'symmetric tree': [
    { id: 1, input: '[1,2,2,3,4,4,3]', expected: 'true',  label: 'Symmetric' },
    { id: 2, input: '[1,2,2,null,3,null,3]', expected: 'false', label: 'Asymmetric' },
  ],
  'diameter of binary tree': [
    { id: 1, input: '[1,2,3,4,5]', expected: '3', label: 'Standard' },
    { id: 2, input: '[1,2]',       expected: '1', label: 'Two nodes' },
  ],

  // ── Dynamic Programming ──────────────────────────────────────
  'climbing stairs': [
    { id: 1, input: '2',  expected: '2', label: 'n=2' },
    { id: 2, input: '3',  expected: '3', label: 'n=3' },
    { id: 3, input: '10', expected: '89', label: 'n=10' },
    { id: 4, input: '1',  expected: '1', label: 'n=1', hidden: true },
  ],
  'coin change': [
    { id: 1, input: '[[1,5,11],11]',  expected: '3',  label: 'With 1 and 5 and 11' },
    { id: 2, input: '[[2],3]',        expected: '-1', label: 'Impossible' },
    { id: 3, input: '[[1],0]',        expected: '0',  label: 'Zero amount' },
    { id: 4, input: '[[186,419,83,408],6249]', expected: '20', label: 'Large', hidden: true },
  ],
  'house robber': [
    { id: 1, input: '[1,2,3,1]',     expected: '4',  label: 'Standard' },
    { id: 2, input: '[2,7,9,3,1]',   expected: '12', label: 'Larger' },
    { id: 3, input: '[2,1,1,2]',     expected: '4',  label: 'Symmetric' },
    { id: 4, input: '[1]',           expected: '1',  label: 'Single', hidden: true },
  ],
  'longest common subsequence': [
    { id: 1, input: '["abcde","ace"]',  expected: '3', label: 'Standard' },
    { id: 2, input: '["abc","abc"]',    expected: '3', label: 'Same string' },
    { id: 3, input: '["abc","def"]',    expected: '0', label: 'No common' },
  ],
  'word break': [
    { id: 1, input: '["leetcode",["leet","code"]]',         expected: 'true',  label: 'Standard' },
    { id: 2, input: '["applepenapple",["apple","pen"]]',    expected: 'true',  label: 'Reuse' },
    { id: 3, input: '["catsandog",["cats","dog","sand","and","cat"]]', expected: 'false', label: 'No match' },
  ],

  // ── Graphs ───────────────────────────────────────────────────
  'number of islands': [
    { id: 1, input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expected: '1', label: 'One island' },
    { id: 2, input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expected: '3', label: 'Three islands' },
  ],
  'flood fill': [
    { id: 1, input: '[[[1,1,1],[1,1,0],[1,0,1]],1,1,2]', expected: '[[2,2,2],[2,2,0],[2,0,1]]', label: 'Standard' },
    { id: 2, input: '[[[0,0,0],[0,0,0]],0,0,0]',          expected: '[[0,0,0],[0,0,0]]',         label: 'Same color' },
  ],

  // ── Heaps ────────────────────────────────────────────────────
  'kth largest element in an array': [
    { id: 1, input: '[[3,2,1,5,6,4],2]', expected: '5', label: 'Standard' },
    { id: 2, input: '[[3,2,3,1,2,4,5,5,6],4]', expected: '4', label: 'Duplicates' },
    { id: 3, input: '[[1],1]', expected: '1', label: 'Single' },
  ],

  // ── Hashing ─────────────────────────────────────────────────
  'group anagrams': [
    { id: 1, input: '["eat","tea","tan","ate","nat","bat"]', expected: '[["eat","tea","ate"],["tan","nat"],["bat"]]', label: 'Standard' },
    { id: 2, input: '[""]', expected: '[[""]]', label: 'Empty string' },
    { id: 3, input: '["a"]', expected: '[["a"]]', label: 'Single' },
  ],
  'top k frequent elements': [
    { id: 1, input: '[[1,1,1,2,2,3],2]', expected: '[1,2]', label: 'Standard' },
    { id: 2, input: '[[1],1]',            expected: '[1]',   label: 'Single' },
  ],

  // ── Sorting ─────────────────────────────────────────────────
  'sort colors': [
    { id: 1, input: '[2,0,2,1,1,0]', expected: '[0,0,1,1,2,2]', label: 'Standard' },
    { id: 2, input: '[2,0,1]',        expected: '[0,1,2]',       label: 'One each' },
    { id: 3, input: '[0]',            expected: '[0]',           label: 'Single' },
  ],

  // ── Greedy ───────────────────────────────────────────────────
  'jump game': [
    { id: 1, input: '[2,3,1,1,4]', expected: 'true',  label: 'Reachable' },
    { id: 2, input: '[3,2,1,0,4]', expected: 'false', label: 'Blocked' },
    { id: 3, input: '[0]',         expected: 'true',  label: 'Single' },
  ],
  'gas station': [
    { id: 1, input: '[[1,2,3,4,5],[3,4,5,1,2]]', expected: '3', label: 'Standard' },
    { id: 2, input: '[[2,3,4],[3,4,3]]',          expected: '-1', label: 'Impossible' },
  ],

  // ── Recursion / Backtracking ─────────────────────────────────
  'subsets': [
    { id: 1, input: '[1,2,3]', expected: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]', label: 'Standard' },
    { id: 2, input: '[0]',     expected: '[[],[0]]',                                   label: 'Single' },
  ],
  'permutations': [
    { id: 1, input: '[1,2,3]', expected: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]', label: 'Three elements' },
    { id: 2, input: '[0,1]',   expected: '[[0,1],[1,0]]',                                     label: 'Two elements' },
  ],
  'letter combinations of a phone number': [
    { id: 1, input: '"23"', expected: '["ad","ae","af","bd","be","bf","cd","ce","cf"]', label: 'Two digits' },
    { id: 2, input: '""',   expected: '[]',                                             label: 'Empty' },
    { id: 3, input: '"2"',  expected: '["a","b","c"]',                                  label: 'Single digit' },
  ],
};

// Normalize a problem title to a lookup key
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Look up test cases for a problem by title
// Returns curated cases if found, otherwise null
export function getTestCases(problemTitle) {
  const key = normalizeTitle(problemTitle);
  return LIBRARY[key] ?? null;
}

// All known problem titles (for autocomplete / display)
export const KNOWN_PROBLEMS = Object.keys(LIBRARY).map(k =>
  k.replace(/\b\w/g, c => c.toUpperCase())
);