// Auto-generated exercise data - 2024-11-09T02:14:38.227Z
const exercises = [
  {
    "id": "merge-intervals",
    "title": "Merge Overlapping Intervals",
    "difficulty": "intermediate",
    "category": "algorithms",
    "topics": [
      "arrays",
      "sorting"
    ],
    "languages": [
      "javascript",
      "python",
      "java"
    ],
    "description": "Given an array of intervals where intervals[i] = [starti, endi], \n                   merge all overlapping intervals and return the non-overlapping intervals.",
    "examples": [
      {
        "input": "[[1,3],[2,6],[8,10],[15,18]]",
        "output": "[[1,6],[8,10],[15,18]]",
        "_id": "672ec585bc630d91f5232588"
      }
    ],
    "constraints": [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= starti <= endi <= 10^4"
    ],
    "templates": {
      "javascript": "function mergeIntervals(intervals) {\n    // Your code here\n  }"
    },
    "solution": {
      "javascript": "function mergeIntervals(intervals) {\n    if (intervals.length <= 1) return intervals;\n    \n    // Sort by start time\n    intervals.sort((a, b) => a[0] - b[0]);\n    \n    const result = [intervals[0]];\n    \n    for (let i = 1; i < intervals.length; i++) {\n      const current = intervals[i];\n      const lastMerged = result[result.length - 1];\n      \n      if (current[0] <= lastMerged[1]) {\n        // Overlap found, merge intervals\n        lastMerged[1] = Math.max(lastMerged[1], current[1]);\n      } else {\n        // No overlap, add new interval\n        result.push(current);\n      }\n    }\n    \n    return result;\n  }"
    }
  },
  {
    "id": "implement-trie",
    "title": "Implement a Trie (Prefix Tree)",
    "difficulty": "intermediate",
    "category": "data_structures",
    "topics": [
      "trees",
      "strings"
    ],
    "languages": [
      "javascript",
      "python",
      "java"
    ],
    "description": "Implement a trie data structure with insert, search, and startsWith methods. \n                   The trie should efficiently store and search strings, supporting prefix matching.",
    "examples": [
      {
        "input": "trie.insert(\"apple\");\n  trie.search(\"apple\");   // returns true\n  trie.search(\"app\");     // returns false\n  trie.startsWith(\"app\"); // returns true",
        "output": "Operations completed successfully",
        "_id": "672ec585bc630d91f5232584"
      }
    ],
    "constraints": [
      "All inputs are lowercase letters a-z",
      "Methods should run in O(m) time where m is key length",
      "Space complexity should be O(ALPHABET_SIZE * m * n) for n keys"
    ],
    "templates": {
      "javascript": "class TrieNode {\n    constructor() {\n      // Your code here\n    }\n  }\n  \n  class Trie {\n    constructor() {\n      // Your code here\n    }\n  \n    insert(word) {\n      // Your code here\n    }\n  \n    search(word) {\n      // Your code here\n    }\n  \n    startsWith(prefix) {\n      // Your code here\n    }\n  }"
    },
    "solution": {
      "javascript": "class TrieNode {\n    constructor() {\n      this.children = new Map();\n      this.isEndOfWord = false;\n    }\n  }\n  \n  class Trie {\n    constructor() {\n      this.root = new TrieNode();\n    }\n  \n    insert(word) {\n      let current = this.root;\n      for (const char of word) {\n        if (!current.children.has(char)) {\n          current.children.set(char, new TrieNode());\n        }\n        current = current.children.get(char);\n      }\n      current.isEndOfWord = true;\n    }\n  \n    search(word) {\n      const node = this._traverse(word);\n      return node !== null && node.isEndOfWord;\n    }\n  \n    startsWith(prefix) {\n      return this._traverse(prefix) !== null;\n    }\n  \n    _traverse(str) {\n      let current = this.root;\n      for (const char of str) {\n        if (!current.children.has(char)) {\n          return null;\n        }\n        current = current.children.get(char);\n      }\n      return current;\n    }\n  }"
    }
  },
  {
    "id": "js-compose-functions",
    "title": "Function Composition",
    "difficulty": "intermediate",
    "category": "language_specific",
    "topics": [
      "functional_programming",
      "closures"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Implement a compose function that takes multiple functions and returns a new function that composes them from right to left.\n      For example, compose(f, g, h)(x) should return f(g(h(x))).",
    "examples": [
      {
        "input": "compose(\n    x => x + 1,\n    x => x * 2,\n    x => x - 3\n  )(4)",
        "output": "5",
        "_id": "672dc3c30a9ecec687a4bc1c"
      }
    ],
    "constraints": [
      "Handle any number of functions",
      "Handle edge cases (no functions, one function)",
      "Each function takes exactly one argument"
    ],
    "templates": {
      "javascript": "function compose(...fns) {\n    // Your code here\n  }"
    },
    "solution": {
      "javascript": "function compose(...fns) {\n    return x => fns.reduceRight((acc, fn) => fn(acc), x);\n  }"
    }
  },
  {
    "id": "js-promise-timeout",
    "title": "Promise Timeout Wrapper",
    "difficulty": "intermediate",
    "category": "language_specific",
    "topics": [
      "async_programming",
      "promises"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Create a function that wraps a promise with a timeout. \n      If the promise doesn't resolve within the specified timeout, it should reject with a timeout error.",
    "examples": [
      {
        "input": "withTimeout(\n    fetch('https://api.example.com/data'),\n    5000\n  )",
        "output": "Promise that rejects after 5 seconds if fetch hasn't completed",
        "_id": "672dc3c30a9ecec687a4bc21"
      }
    ],
    "constraints": [
      "Handle both resolving and rejecting promises",
      "Timeout should be in milliseconds",
      "Return a new promise"
    ],
    "templates": {
      "javascript": "function withTimeout(promise, timeout) {\n    // Your code here\n  }"
    },
    "solution": {
      "javascript": "function withTimeout(promise, timeout) {\n    const timeoutPromise = new Promise((_, reject) => {\n      setTimeout(() => reject(new Error('TimeoutError')), timeout);\n    });\n    return Promise.race([promise, timeoutPromise]);\n  }"
    }
  },
  {
    "id": "promise-all-impl",
    "title": "Implement Promise.all",
    "difficulty": "intermediate",
    "category": "language_specific",
    "topics": [
      "async_programming",
      "promises"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Implement your own version of Promise.all() that takes an array of promises and returns a promise that resolves when all promises are resolved or rejects when any promise rejects.",
    "examples": [
      {
        "input": "myPromiseAll([Promise.resolve(1), Promise.resolve(2)])",
        "output": "[1, 2]",
        "_id": "672ec24613c50a01cca1052d"
      }
    ],
    "constraints": [
      "Handle both synchronous and asynchronous values",
      "Maintain promise order in results",
      "Early rejection on first error"
    ],
    "templates": {
      "javascript": "function myPromiseAll(promises) {\n    // Your code here\n  }"
    },
    "solution": {
      "javascript": "function myPromiseAll(promises) {\n    return new Promise((resolve, reject) => {\n      const results = new Array(promises.length);\n      let completed = 0;\n      \n      if (promises.length === 0) {\n        resolve(results);\n        return;\n      }\n      \n      promises.forEach((promise, index) => {\n        Promise.resolve(promise)\n          .then(value => {\n            results[index] = value;\n            completed++;\n            if (completed === promises.length) {\n              resolve(results);\n            }\n          })\n          .catch(reject);\n      });\n    });\n  }"
    }
  },
  {
    "id": "throttle-impl",
    "title": "Implement Throttle",
    "difficulty": "intermediate",
    "category": "language_specific",
    "topics": [
      "functional_programming",
      "timing"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Implement a throttle function that ensures a function is called at most once in a specified time period, no matter how many times it is invoked.",
    "examples": [
      {
        "input": "const throttled = throttle(fn, 1000);\n  throttled(); // called immediately\n  throttled(); // ignored\n  // after 1000ms\n  throttled(); // called",
        "output": "Function throttled correctly",
        "_id": "672ec24613c50a01cca10531"
      }
    ],
    "constraints": [
      "Maintain correct this context",
      "Handle function arguments properly",
      "Support leading and trailing options"
    ],
    "templates": {
      "javascript": "function throttle(func, wait) {\n    // Your code here\n  }"
    },
    "solution": {
      "javascript": "function throttle(func, wait) {\n    let isThrottled = false;\n    let lastArgs = null;\n    let lastThis = null;\n  \n    function wrapper(...args) {\n      if (isThrottled) {\n        lastArgs = args;\n        lastThis = this;\n        return;\n      }\n  \n      func.apply(this, args);\n      isThrottled = true;\n  \n      setTimeout(() => {\n        isThrottled = false;\n        if (lastArgs) {\n          wrapper.apply(lastThis, lastArgs);\n          lastArgs = null;\n          lastThis = null;\n        }\n      }, wait);\n    }\n  \n    return wrapper;\n  }"
    }
  },
  {
    "id": "infinite-scroll",
    "title": "Implement Infinite Scroll",
    "difficulty": "intermediate",
    "category": "language_specific",
    "topics": [
      "dom_manipulation",
      "async_programming"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Implement an infinite scroll mechanism that fetches and displays new content when the user scrolls near the bottom of the page. \n                   Handle loading states, error cases, and prevent multiple simultaneous requests.",
    "examples": [
      {
        "input": "scrollToBottom()",
        "output": "New content loaded and appended",
        "_id": "672ec585bc630d91f5232580"
      }
    ],
    "constraints": [
      "Must maintain smooth scrolling experience",
      "Handle loading and error states",
      "Implement request throttling",
      "Clean up event listeners properly"
    ],
    "templates": {
      "javascript": "class InfiniteScroll {\n    constructor(containerElement, loadMoreFn) {\n      // Your code here\n    }\n  \n    init() {\n      // Your code here\n    }\n  \n    destroy() {\n      // Your code here\n    }\n  }"
    },
    "solution": {
      "javascript": "class InfiniteScroll {\n    constructor(containerElement, loadMoreFn) {\n      this.container = containerElement;\n      this.loadMore = loadMoreFn;\n      this.isLoading = false;\n      this.hasMore = true;\n      this.handleScroll = this.handleScroll.bind(this);\n    }\n  \n    init() {\n      window.addEventListener('scroll', this.handleScroll);\n      this.handleScroll(); // Check initial state\n    }\n  \n    destroy() {\n      window.removeEventListener('scroll', this.handleScroll);\n    }\n  \n    async handleScroll() {\n      if (this.isLoading || !this.hasMore) return;\n  \n      const threshold = 200;\n      const bottom = this.container.getBoundingClientRect().bottom;\n      const windowHeight = window.innerHeight;\n  \n      if (bottom - windowHeight < threshold) {\n        this.isLoading = true;\n        try {\n          const newItems = await this.loadMore();\n          this.hasMore = newItems.length > 0;\n          this.isLoading = false;\n        } catch (error) {\n          console.error('Failed to load more items:', error);\n          this.isLoading = false;\n        }\n      }\n    }\n  }"
    }
  },
  {
    "id": "js-array-sum",
    "title": "Array Sum Calculator",
    "difficulty": "junior",
    "category": "algorithms",
    "topics": [
      "arrays",
      "reduce"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Implement a function that calculates the sum of all numbers in an array. Handle empty arrays and non-numeric values appropriately.",
    "examples": [
      {
        "input": "[1, 2, 3, 4]",
        "output": "10",
        "_id": "672dc3c30a9ecec687a4bc0c"
      },
      {
        "input": "[]",
        "output": "0",
        "_id": "672dc3c30a9ecec687a4bc0d"
      },
      {
        "input": "[1, \"2\", 3, \"four\", 5]",
        "output": "9",
        "_id": "672dc3c30a9ecec687a4bc0e"
      }
    ],
    "constraints": [
      "Array can contain mixed types",
      "Return 0 for empty arrays",
      "Ignore non-numeric values"
    ],
    "templates": {
      "javascript": "function arraySum(numbers) {\n    // Your code here\n  }"
    },
    "solution": {
      "javascript": "function arraySum(numbers) {\n    return numbers.reduce((sum, num) => \n      sum + (typeof num === 'number' ? num : 0), 0);\n  }"
    }
  },
  {
    "id": "js-string-reverse",
    "title": "String Reverser",
    "difficulty": "junior",
    "category": "algorithms",
    "topics": [
      "strings",
      "arrays"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Create a function that reverses a string while maintaining the position of special characters and spaces.",
    "examples": [
      {
        "input": "\"hello world\"",
        "output": "\"dlrow olleh\"",
        "_id": "672dc3c30a9ecec687a4bc15"
      },
      {
        "input": "\"h@llo w#rld!\"",
        "output": "\"d@lro w#llh!\"",
        "_id": "672dc3c30a9ecec687a4bc16"
      }
    ],
    "constraints": [
      "Maintain special characters in their original positions",
      "Preserve spaces",
      "Handle empty strings"
    ],
    "templates": {
      "javascript": "function reverseString(str) {\n    // Your code here\n  }"
    },
    "solution": {
      "javascript": "function reverseString(str) {\n    const chars = str.split('');\n    const alphanumeric = chars.filter(c => /[a-zA-Z0-9]/.test(c));\n    let reversed = alphanumeric.reverse();\n    \n    return chars.map(c => \n      /[a-zA-Z0-9]/.test(c) ? reversed.shift() : c\n    ).join('');\n  }"
    }
  },
  {
    "id": "fizzbuzz-classic",
    "title": "FizzBuzz Implementation",
    "difficulty": "junior",
    "category": "algorithms",
    "topics": [
      "loops",
      "conditionals"
    ],
    "languages": [
      "javascript",
      "python",
      "java"
    ],
    "description": "Write a function that returns \"Fizz\" for multiples of 3, \"Buzz\" for multiples of 5, and \"FizzBuzz\" for multiples of both. For other numbers, return the number as a string.",
    "examples": [
      {
        "input": "3",
        "output": "\"Fizz\"",
        "_id": "672ec24613c50a01cca10522"
      },
      {
        "input": "5",
        "output": "\"Buzz\"",
        "_id": "672ec24613c50a01cca10523"
      },
      {
        "input": "15",
        "output": "\"FizzBuzz\"",
        "_id": "672ec24613c50a01cca10524"
      }
    ],
    "constraints": [
      "1 <= n <= 100",
      "Return results as strings"
    ],
    "templates": {
      "javascript": "function fizzBuzz(n) {\n    // Your code here\n  }",
      "python": "def fizz_buzz(n):\n      # Your code here\n      pass",
      "java": "public class Solution {\n      public String fizzBuzz(int n) {\n          // Your code here\n      }\n  }"
    },
    "solution": {
      "javascript": "function fizzBuzz(n) {\n    if (n % 3 === 0 && n % 5 === 0) return \"FizzBuzz\";\n    if (n % 3 === 0) return \"Fizz\";\n    if (n % 5 === 0) return \"Buzz\";\n    return String(n);\n  }"
    }
  },
  {
    "id": "palindrome-check",
    "title": "Palindrome Checker",
    "difficulty": "junior",
    "category": "algorithms",
    "topics": [
      "strings",
      "two-pointers"
    ],
    "languages": [
      "javascript",
      "python",
      "java"
    ],
    "description": "Write a function that checks if a given string is a palindrome, considering only alphanumeric characters and ignoring case.",
    "examples": [
      {
        "input": "\"A man, a plan, a canal: Panama\"",
        "output": "true",
        "_id": "672ec24613c50a01cca10528"
      },
      {
        "input": "\"race a car\"",
        "output": "false",
        "_id": "672ec24613c50a01cca10529"
      }
    ],
    "constraints": [
      "Input string can contain spaces and punctuation",
      "Empty string is considered a palindrome"
    ],
    "templates": {
      "javascript": "function isPalindrome(str) {\n    // Your code here\n  }",
      "python": "def is_palindrome(str):\n      # Your code here\n      pass",
      "java": "public class Solution {\n      public boolean isPalindrome(String str) {\n          // Your code here\n      }\n  }"
    },
    "solution": {
      "javascript": "function isPalindrome(str) {\n    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');\n    return cleaned === cleaned.split('').reverse().join('');\n  }"
    }
  },
  {
    "id": "query-builder",
    "title": "SQL Query Builder Implementation",
    "difficulty": "senior",
    "category": "language_specific",
    "topics": [
      "databases",
      "design_patterns"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Implement a fluent SQL query builder that supports:\n                   1. SELECT, WHERE, JOIN, GROUP BY, HAVING, ORDER BY clauses\n                   2. Parameterized queries for security\n                   3. Nested conditions\n                   4. Query composition",
    "examples": [
      {
        "input": "queryBuilder\n    .select('users.name', 'orders.total')\n    .from('users')\n    .leftJoin('orders', 'users.id', '=', 'orders.user_id')\n    .where('orders.total', '>', 100)\n    .orderBy('orders.total', 'DESC')\n    .toString()",
        "output": "SELECT users.name, orders.total \n  FROM users \n  LEFT JOIN orders ON users.id = orders.user_id \n  WHERE orders.total > ? \n  ORDER BY orders.total DESC",
        "_id": "672ec585bc630d91f5232590"
      }
    ],
    "constraints": [
      "Must prevent SQL injection",
      "Support query composition",
      "Maintain proper clause ordering"
    ],
    "templates": {
      "javascript": "class QueryBuilder {\n    constructor() {\n      // Your code here\n    }\n  \n    select(...fields) {\n      // Your code here\n      return this;\n    }\n  \n    from(table) {\n      // Your code here\n      return this;\n    }\n  \n    where(field, operator, value) {\n      // Your code here\n      return this;\n    }\n  \n    toString() {\n      // Your code here\n    }\n  }"
    },
    "solution": {
      "javascript": "class QueryBuilder {\n    constructor() {\n      this.query = {\n        type: 'SELECT',\n        fields: [],\n        from: null,\n        joins: [],\n        where: [],\n        groupBy: [],\n        having: [],\n        orderBy: [],\n        params: []\n      };\n    }\n  \n    select(...fields) {\n      this.query.fields = fields;\n      return this;\n    }\n  \n    from(table) {\n      this.query.from = table;\n      return this;\n    }\n  \n    where(field, operator, value) {\n      this.query.where.push({ field, operator, value });\n      this.query.params.push(value);\n      return this;\n    }\n  \n    join(type, table, field1, operator, field2) {\n      this.query.joins.push({ type, table, field1, operator, field2 });\n      return this;\n    }\n  \n    orderBy(field, direction = 'ASC') {\n      this.query.orderBy.push({ field, direction });\n      return this;\n    }\n  \n    toString() {\n      const parts = [];\n      \n      // SELECT\n      parts.push(`SELECT ${this.query.fields.join(', ') || '*'}`);\n      \n      // FROM\n      if (this.query.from) {\n        parts.push(`FROM ${this.query.from}`);\n      }\n      \n      // JOINS\n      this.query.joins.forEach(join => {\n        parts.push(\n          `${join.type} JOIN ${join.table} ON ${join.field1} ${join.operator} ${join.field2}`\n        );\n      });\n      \n      // WHERE\n      if (this.query.where.length) {\n        const conditions = this.query.where.map(\n          w => `${w.field} ${w.operator} ?`\n        );\n        parts.push(`WHERE ${conditions.join(' AND ')}`);\n      }\n      \n      // ORDER BY\n      if (this.query.orderBy.length) {\n        const ordering = this.query.orderBy.map(\n          o => `${o.field} ${o.direction}`\n        );\n        parts.push(`ORDER BY ${ordering.join(', ')}`);\n      }\n      \n      return parts.join(' ');\n    }\n  \n    getParams() {\n      return this.query.params;\n    }\n  }"
    }
  },
  {
    "id": "js-memoize-advanced",
    "title": "Advanced Memoization",
    "difficulty": "senior",
    "category": "optimization",
    "topics": [
      "caching",
      "closures"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Implement an advanced memoization function that caches results based on arguments.\n      It should support:\n      1. Custom cache key generation\n      2. Maximum cache size\n      3. Time-based cache invalidation\n      4. Custom cache storage",
    "examples": [
      {
        "input": "const memoizedFn = memoize(expensiveFn, {\n    maxSize: 100,\n    ttl: 60000,\n    keyGenerator: (...args) => JSON.stringify(args)\n  });",
        "output": "Function with caching capabilities",
        "_id": "672dc3c40a9ecec687a4bc2c"
      }
    ],
    "constraints": [
      "Handle complex argument types",
      "Implement LRU cache eviction",
      "Support async functions",
      "Handle edge cases (undefined, circular references)"
    ],
    "templates": {
      "javascript": "function memoize(fn, options = {}) {\n    // Your code here\n  }"
    },
    "solution": {
      "javascript": "function memoize(fn, options = {}) {\n    const {\n      maxSize = Infinity,\n      ttl = Infinity,\n      keyGenerator = (...args) => JSON.stringify(args)\n    } = options;\n  \n    const cache = new Map();\n    const timestamps = new Map();\n    \n    const cleanup = () => {\n      const now = Date.now();\n      for (const [key, timestamp] of timestamps) {\n        if (now - timestamp > ttl) {\n          cache.delete(key);\n          timestamps.delete(key);\n        }\n      }\n      \n      if (cache.size > maxSize) {\n        const oldestKey = timestamps.entries().next().value[0];\n        cache.delete(oldestKey);\n        timestamps.delete(oldestKey);\n      }\n    };\n  \n    return async (...args) => {\n      cleanup();\n      const key = keyGenerator(...args);\n      \n      if (cache.has(key)) {\n        timestamps.set(key, Date.now());\n        return cache.get(key);\n      }\n  \n      const result = await fn(...args);\n      cache.set(key, result);\n      timestamps.set(key, Date.now());\n      return result;\n    };\n  }"
    }
  },
  {
    "id": "js-observable",
    "title": "Observable Implementation",
    "difficulty": "senior",
    "category": "system_design",
    "topics": [
      "design_patterns",
      "async_programming"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Implement a simple Observable class that follows the Observer pattern.\n      It should support subscribing observers, unsubscribing them, and notifying all observers of state changes.",
    "examples": [
      {
        "input": "const observable = new Observable();\n  observable.subscribe(console.log);\n  observable.notify('Hello!');",
        "output": "Logs: \"Hello!\"",
        "_id": "672dc3c40a9ecec687a4bc27"
      }
    ],
    "constraints": [
      "Support multiple observers",
      "Allow unsubscribing specific observers",
      "Handle invalid inputs gracefully"
    ],
    "templates": {
      "javascript": "class Observable {\n    constructor() {\n      // Your code here\n    }\n    \n    subscribe(observer) {\n      // Your code here\n    }\n    \n    unsubscribe(observer) {\n      // Your code here\n    }\n    \n    notify(data) {\n      // Your code here\n    }\n  }"
    },
    "solution": {
      "javascript": "class Observable {\n    constructor() {\n      this.observers = new Set();\n    }\n    \n    subscribe(observer) {\n      if (typeof observer !== 'function') {\n        throw new Error('Observer must be a function');\n      }\n      this.observers.add(observer);\n      return () => this.unsubscribe(observer);\n    }\n    \n    unsubscribe(observer) {\n      this.observers.delete(observer);\n    }\n    \n    notify(data) {\n      this.observers.forEach(observer => {\n        try {\n          observer(data);\n        } catch (e) {\n          console.error('Observer error:', e);\n        }\n      });\n    }\n  }"
    }
  },
  {
    "id": "lru-cache",
    "title": "LRU Cache Implementation",
    "difficulty": "senior",
    "category": "system_design",
    "topics": [
      "caching",
      "data_structures"
    ],
    "languages": [
      "javascript",
      "python",
      "java"
    ],
    "description": "Implement a Least Recently Used (LRU) cache with get and put operations in O(1) time complexity.",
    "examples": [
      {
        "input": "const cache = new LRUCache(2);\n  cache.put(1, 1);\n  cache.put(2, 2);\n  cache.get(1);       // returns 1\n  cache.put(3, 3);    // evicts key 2\n  cache.get(2);       // returns -1 (not found)",
        "output": "Cache operations working correctly",
        "_id": "672ec24613c50a01cca10535"
      }
    ],
    "constraints": [
      "All operations should be O(1)",
      "Handle capacity constraints",
      "Implement proper eviction policy"
    ],
    "templates": {
      "javascript": "class LRUCache {\n    constructor(capacity) {\n      // Your code here\n    }\n    \n    get(key) {\n      // Your code here\n    }\n    \n    put(key, value) {\n      // Your code here\n    }\n  }"
    },
    "solution": {
      "javascript": "class LRUCache {\n    constructor(capacity) {\n      this.capacity = capacity;\n      this.cache = new Map();\n      this.head = { next: null, prev: null };\n      this.tail = { next: null, prev: null };\n      this.head.next = this.tail;\n      this.tail.prev = this.head;\n    }\n  \n    get(key) {\n      if (!this.cache.has(key)) return -1;\n      const node = this.cache.get(key);\n      this.removeNode(node);\n      this.addToFront(node);\n      return node.value;\n    }\n  \n    put(key, value) {\n      if (this.cache.has(key)) {\n        const node = this.cache.get(key);\n        node.value = value;\n        this.removeNode(node);\n        this.addToFront(node);\n      } else {\n        if (this.cache.size >= this.capacity) {\n          const lastNode = this.tail.prev;\n          this.removeNode(lastNode);\n          this.cache.delete(lastNode.key);\n        }\n        const newNode = { key, value, next: null, prev: null };\n        this.cache.set(key, newNode);\n        this.addToFront(newNode);\n      }\n    }\n  \n    removeNode(node) {\n      node.prev.next = node.next;\n      node.next.prev = node.prev;\n    }\n  \n    addToFront(node) {\n      node.next = this.head.next;\n      node.prev = this.head;\n      this.head.next.prev = node;\n      this.head.next = node;\n    }\n  }"
    }
  },
  {
    "id": "rate-limiter",
    "title": "Implement Rate Limiter",
    "difficulty": "senior",
    "category": "system_design",
    "topics": [
      "rate_limiting",
      "algorithms"
    ],
    "languages": [
      "javascript"
    ],
    "description": "Implement a rate limiter using the token bucket algorithm. The rate limiter should:\n                   1. Allow bursts up to a maximum bucket size\n                   2. Replenish tokens at a fixed rate\n                   3. Be thread-safe\n                   4. Handle concurrent requests efficiently",
    "examples": [
      {
        "input": "const limiter = new RateLimiter(10, 1); // 10 tokens/second\n  limiter.tryAcquire(); // true\n  // Many rapid calls...\n  limiter.tryAcquire(); // false (rate limit exceeded)",
        "output": "Rate limiting applied correctly",
        "_id": "672ec585bc630d91f523258c"
      }
    ],
    "constraints": [
      "Handle high concurrency",
      "Accurate token replenishment",
      "Memory efficient implementation"
    ],
    "templates": {
      "javascript": "class RateLimiter {\n    constructor(tokensPerSecond, maxBurst) {\n      // Your code here\n    }\n  \n    tryAcquire(tokens = 1) {\n      // Your code here\n    }\n  }"
    },
    "solution": {
      "javascript": "class RateLimiter {\n    constructor(tokensPerSecond, maxBurst) {\n      this.tokensPerSecond = tokensPerSecond;\n      this.maxBurst = maxBurst;\n      this.currentTokens = maxBurst;\n      this.lastRefillTime = Date.now();\n    }\n  \n    tryAcquire(tokens = 1) {\n      this.refillTokens();\n      \n      if (this.currentTokens >= tokens) {\n        this.currentTokens -= tokens;\n        return true;\n      }\n      \n      return false;\n    }\n  \n    refillTokens() {\n      const now = Date.now();\n      const timePassed = (now - this.lastRefillTime) / 1000;\n      const newTokens = timePassed * this.tokensPerSecond;\n      \n      this.currentTokens = Math.min(\n        this.maxBurst,\n        this.currentTokens + newTokens\n      );\n      \n      this.lastRefillTime = now;\n    }\n  }"
    }
  }
];

module.exports = exercises;