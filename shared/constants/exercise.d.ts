export type DifficultyLevel = 'junior' | 'intermediate' | 'senior';
export type CategoryType = 'algorithms' | 'data_structures' | 'system_design' | 'debugging' | 'optimization' | 'language_specific';
export type ProgrammingLanguage = 'javascript' | 'python' | 'java' | 'cpp' | 'rust' | 'go' | 'typescript';

export interface Exercise {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  category: CategoryType;
  topics: string[];
  languages: ProgrammingLanguage[];
  description: string;
  examples: {
    input: any;
    output: any;
  }[];
  constraints: string[];
  templates: {
    [key in ProgrammingLanguage]?: string;
  };
  tests: {
    input: any;
    output: any;
  }[];
  solution: {
    [key in ProgrammingLanguage]?: string;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    difficulty_rating?: number;
    times_solved: number;
    success_rate: number;
  };
  is_active: boolean;
}

export const Difficulty: {
  JUNIOR: 'junior';
  INTERMEDIATE: 'intermediate';
  SENIOR: 'senior';
};

export const Category: {
  ALGORITHMS: 'algorithms';
  DATA_STRUCTURES: 'data_structures';
  SYSTEM_DESIGN: 'system_design';
  DEBUGGING: 'debugging';
  OPTIMIZATION: 'optimization';
  LANGUAGE_SPECIFIC: 'language_specific';
};

export const Topics: {
  SORTING: 'sorting';
  SEARCHING: 'searching';
  DYNAMIC_PROGRAMMING: 'dynamic_programming';
  RECURSION: 'recursion';
  GRAPH_ALGORITHMS: 'graph_algorithms';
  STRING_MANIPULATION: 'string_manipulation';
  ARRAYS: 'arrays';
  LINKED_LISTS: 'linked_lists';
  TREES: 'trees';
  GRAPHS: 'graphs';
  HASH_TABLES: 'hash_tables';
  STACKS: 'stacks';
  QUEUES: 'queues';
  HEAPS: 'heaps';
  CACHING: 'caching';
  SCALABILITY: 'scalability';
  MICROSERVICES: 'microservices';
  DATABASE_DESIGN: 'database_design';
  API_DESIGN: 'api_design';
  DISTRIBUTED_SYSTEMS: 'distributed_systems';
  ASYNC_PROGRAMMING: 'async_programming';
  FUNCTIONAL_PROGRAMMING: 'functional_programming';
  OOP: 'object_oriented_programming';
  ERROR_HANDLING: 'error_handling';
  MEMORY_MANAGEMENT: 'memory_management';
  CONCURRENCY: 'concurrency';
};

export const ProgrammingLanguages: {
  JAVASCRIPT: 'javascript';
  PYTHON: 'python';
  JAVA: 'java';
  CPP: 'cpp';
  RUST: 'rust';
  GO: 'go';
  TYPESCRIPT: 'typescript';
};

export function isValidDifficulty(difficulty: string): difficulty is DifficultyLevel;
export function isValidCategory(category: string): category is CategoryType;
export function isValidTopic(topic: string): boolean;
export function isValidLanguage(language: string): language is ProgrammingLanguage;