import { Difficulty, Category, Topics } from './exerciseTypes.js';

export const exercises = [
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    difficulty: Difficulty.JUNIOR,
    category: Category.ALGORITHMS,
    topics: [Topics.ARRAYS],
    languages: ['javascript', 'python', 'java'],
    description: `
      Write a function that reverses a string. The input is given as an array of characters.
      Do this by modifying the input array in-place with O(1) extra memory.
    `,
    examples: [
      {
        input: '"hello"',
        output: '"olleh"'
      }
    ],
    constraints: [
      '1 <= s.length <= 100,000',
      's[i] is a printable ascii character'
    ],
    templates: {
      javascript: `function reverseString(str) {
  // Your code here
}`,
      python: `def reverse_string(str):
    # Your code here
    pass`,
      java: `public class Solution {
    public String reverseString(String str) {
        // Your code here
    }
}`
    },
    tests: [
      {
        input: 'hello',
        output: 'olleh'
      },
      {
        input: 'world',
        output: 'dlrow'
      }
    ],
    solution: {
      javascript: `function reverseString(str) {
  return str.split('').reverse().join('');
}`,
      explanation: 'This solution splits the string into an array, reverses it, and joins it back.'
    }
  },
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: Difficulty.JUNIOR,
    category: Category.ALGORITHMS,
    topics: [Topics.ARRAYS, Topics.HASH_TABLES],
    languages: ['javascript', 'python', 'java'],
    description: `
      Given an array of integers nums and an integer target, return indices of two numbers that add up to target.
      You may assume each input has exactly one solution, and you cannot use the same element twice.
    `,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      'Only one valid answer exists'
    ],
    templates: {
      javascript: `function twoSum(nums, target) {
  // Your code here
}`,
      python: `def two_sum(nums, target):
    # Your code here
    pass`,
      java: `public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
    }
}`
    },
    tests: [
      {
        input: {
          nums: [2,7,11,15],
          target: 9
        },
        output: [0,1]
      },
      {
        input: {
          nums: [3,2,4],
          target: 6
        },
        output: [1,2]
      }
    ],
    solution: {
      javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      explanation: 'Uses a hash map to store previously seen numbers and their indices. For each number, we check if its complement exists in the map.'
    }
  },
  {
    id: 'async-data-fetch',
    title: 'Async Data Fetching',
    difficulty: Difficulty.INTERMEDIATE,
    category: Category.LANGUAGE_SPECIFIC,
    topics: [Topics.ASYNC_PROGRAMMING, Topics.ERROR_HANDLING],
    languages: ['javascript'],
    description: `
      Implement a function that fetches data from multiple APIs concurrently and combines the results.
      Handle potential errors and timeouts appropriately.
      The function should timeout if any request takes longer than 5 seconds.
    `,
    examples: [
      {
        input: 'urls = ["https://api.example.com/users", "https://api.example.com/posts"]',
        output: '{ users: [...], posts: [...] }'
      }
    ],
    constraints: [
      'All URLs must be valid REST API endpoints',
      'Each request should timeout after 5 seconds',
      'Handle network errors gracefully'
    ],
    templates: {
      javascript: `async function fetchMultipleAPIs(urls) {
  // Your code here
}`
    },
    tests: [
      {
        input: {
          urls: [
            'https://jsonplaceholder.typicode.com/users/1',
            'https://jsonplaceholder.typicode.com/posts/1'
          ]
        },
        output: {
          success: true,
          data: {
            user: { id: 1 },
            post: { id: 1 }
          }
        }
      }
    ],
    solution: {
      javascript: `async function fetchMultipleAPIs(urls) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const responses = await Promise.all(
      urls.map(url => 
        fetch(url, { signal: controller.signal })
          .then(res => res.json())
      )
    );
    
    clearTimeout(timeoutId);
    return {
      success: true,
      data: responses
    };
  } catch (error) {
    return {
      success: false,
      error: error.name === 'AbortError' ? 'Request timeout' : error.message
    };
  }
}`,
      explanation: 'Uses Promise.all for concurrent requests and AbortController for timeouts.'
    }
  },
  {
    id: 'binary-tree-traversal',
    title: 'Binary Tree Traversal',
    difficulty: Difficulty.INTERMEDIATE,
    category: Category.DATA_STRUCTURES,
    topics: [Topics.TREES, Topics.RECURSION],
    languages: ['javascript', 'python', 'java'],
    description: `
      Implement inorder, preorder, and postorder traversal of a binary tree.
      Return the traversal results as arrays.
    `,
    examples: [
      {
        input: 'tree = [1,null,2,3]',
        output: `
inorder = [1,3,2]
preorder = [1,2,3]
postorder = [3,2,1]`
      }
    ],
    constraints: [
      'The number of nodes in the tree is in the range [0, 100]',
      '-100 <= Node.val <= 100'
    ],
    templates: {
      javascript: `class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

function inorderTraversal(root) {
  // Your code here
}

function preorderTraversal(root) {
  // Your code here
}

function postorderTraversal(root) {
  // Your code here
}`
    },
    tests: [
      {
        input: [1,null,2,3],
        output: {
          inorder: [1,3,2],
          preorder: [1,2,3],
          postorder: [3,2,1]
        }
      }
    ],
    solution: {
      javascript: `function inorderTraversal(root) {
  const result = [];
  
  function traverse(node) {
    if (!node) return;
    traverse(node.left);
    result.push(node.val);
    traverse(node.right);
  }
  
  traverse(root);
  return result;
}

function preorderTraversal(root) {
  const result = [];
  
  function traverse(node) {
    if (!node) return;
    result.push(node.val);
    traverse(node.left);
    traverse(node.right);
  }
  
  traverse(root);
  return result;
}

function postorderTraversal(root) {
  const result = [];
  
  function traverse(node) {
    if (!node) return;
    traverse(node.left);
    traverse(node.right);
    result.push(node.val);
  }
  
  traverse(root);
  return result;
}`,
      explanation: 'Uses recursive depth-first search for each traversal type.'
    }
  },
  {
    id: 'debounce-function',
    title: 'Implement Debounce',
    difficulty: Difficulty.INTERMEDIATE,
    category: Category.LANGUAGE_SPECIFIC,
    topics: [Topics.FUNCTIONAL_PROGRAMMING],
    languages: ['javascript'],
    description: `
      Implement a debounce function that delays invoking a function until after wait milliseconds have elapsed since the last time it was invoked.
      The debounced function should have a cancel method to cancel delayed invocations.
    `,
    examples: [
      {
        input: `
const debounced = debounce(() => console.log('hello'), 1000);
debounced(); // called immediately
debounced(); // called after 1000ms`,
        output: 'Function called once after 1000ms'
      }
    ],
    constraints: [
      'wait >= 0',
      'Function should maintain the correct this context',
      'Should support immediate execution option'
    ],
    templates: {
      javascript: `function debounce(func, wait, immediate = false) {
  // Your code here
}`
    },
    tests: [
      {
        input: {
          calls: [[0], [200], [500]],
          wait: 500
        },
        output: 1
      }
    ],
    solution: {
      javascript: `function debounce(func, wait, immediate = false) {
  let timeout;

  function debounced(...args) {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  }

  debounced.cancel = function() {
    clearTimeout(timeout);
    timeout = null;
  };

  return debounced;
}`,
      explanation: 'Creates a closure to track the timeout and provides a cancel method.'
    }
  },
  {
    id: 'connection-pool',
    title: 'Database Connection Pool',
    difficulty: Difficulty.SENIOR,
    category: Category.SYSTEM_DESIGN,
    topics: [Topics.MICROSERVICES, Topics.ERROR_HANDLING],
    languages: ['javascript'],
    description: `
      Implement a database connection pool that manages a set of connections.
      The pool should support getting/releasing connections and handle connection timeouts.
      Implement proper error handling and connection lifecycle management.
    `,
    examples: [
      {
        input: `
const pool = new ConnectionPool({ max: 5 });
const conn = await pool.acquire();
await conn.query('SELECT * FROM users');
await pool.release(conn);`,
        output: 'Connection managed successfully'
      }
    ],
    constraints: [
      'Maximum pool size > 0',
      'Handle connection timeouts',
      'Implement connection queuing'
    ],
    templates: {
      javascript: `class ConnectionPool {
  constructor(config) {
    // Your code here
  }

  async acquire() {
    // Your code here
  }

  async release(connection) {
    // Your code here
  }
}`
    },
    tests: [
      {
        input: {
          operations: ['acquire', 'acquire', 'release', 'acquire'],
          poolSize: 2
        },
        output: ['success', 'success', 'success', 'success']
      }
    ],
    solution: {
      javascript: `class ConnectionPool {
  constructor({ max = 10, timeout = 5000 }) {
    this.max = max;
    this.timeout = timeout;
    this.connections = new Set();
    this.waiting = [];
    this.available = [];
  }

  async acquire() {
    if (this.available.length > 0) {
      const conn = this.available.pop();
      this.connections.add(conn);
      return conn;
    }

    if (this.connections.size < this.max) {
      const conn = await this.createConnection();
      this.connections.add(conn);
      return conn;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.waiting = this.waiting.filter(w => w !== waiter);
        reject(new Error('Connection timeout'));
      }, this.timeout);

      const waiter = { resolve, timeout };
      this.waiting.push(waiter);
    });
  }

  async release(connection) {
    this.connections.delete(connection);

    if (this.waiting.length > 0) {
      const { resolve, timeout } = this.waiting.shift();
      clearTimeout(timeout);
      const newConn = await this.createConnection();
      this.connections.add(newConn);
      resolve(newConn);
    } else {
      this.available.push(connection);
    }
  }

  async createConnection() {
    // Simulated connection creation
    return {
      query: async (sql) => Promise.resolve([]),
      close: async () => Promise.resolve()
    };
  }
}`,
      explanation: 'Implements a connection pool with connection reuse, queuing, and timeout handling.'
    }
  }
];

// Helper functions to organize exercises
export const getExercisesByLanguage = (language) => {
  return exercises.filter(ex => ex.languages.includes(language));
};

export const getExercisesByDifficulty = (difficulty) => {
  return exercises.filter(ex => ex.difficulty === difficulty);
};

export const getExercisesByCategory = (category) => {
  return exercises.filter(ex => ex.category === category);
};

export const getExerciseTemplate = (exerciseId, language) => {
  const exercise = exercises.find(ex => ex.id === exerciseId);
  return exercise?.templates[language] || '';
};

// Get exercise tree structure
export const getExerciseTree = (language) => {
  const relevantExercises = getExercisesByLanguage(language);
  
  return Object.values(Category).map(category => ({
    id: category,
    name: category.replace(/_/g, ' ').toLowerCase(),
    children: Object.values(Difficulty).map(difficulty => ({
      id: `${category}-${difficulty}`,
      name: difficulty,
      exercises: relevantExercises.filter(
        ex => ex.category === category && ex.difficulty === difficulty
      )
    }))
  }));
};