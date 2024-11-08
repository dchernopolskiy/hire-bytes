const Difficulty = {
    JUNIOR: 'junior',
    INTERMEDIATE: 'intermediate',
    SENIOR: 'senior'
};
  
const Category = {
    ALGORITHMS: 'algorithms',
    DATA_STRUCTURES: 'data_structures',
    SYSTEM_DESIGN: 'system_design',
    DEBUGGING: 'debugging',
    OPTIMIZATION: 'optimization',
    LANGUAGE_SPECIFIC: 'language_specific'
};
  
const Topics = {
    // Algorithms
    SORTING: 'sorting',
    SEARCHING: 'searching',
    DYNAMIC_PROGRAMMING: 'dynamic_programming',
    RECURSION: 'recursion',
    GRAPH_ALGORITHMS: 'graph_algorithms',
    STRING_MANIPULATION: 'string_manipulation',
    
    // Data Structures
    ARRAYS: 'arrays',
    LINKED_LISTS: 'linked_lists',
    TREES: 'trees',
    GRAPHS: 'graphs',
    HASH_TABLES: 'hash_tables',
    STACKS: 'stacks',
    QUEUES: 'queues',
    HEAPS: 'heaps',
    
    // System Design
    CACHING: 'caching',
    SCALABILITY: 'scalability',
    MICROSERVICES: 'microservices',
    DATABASE_DESIGN: 'database_design',
    API_DESIGN: 'api_design',
    DISTRIBUTED_SYSTEMS: 'distributed_systems',
    
    // Language Specific
    ASYNC_PROGRAMMING: 'async_programming',
    FUNCTIONAL_PROGRAMMING: 'functional_programming',
    OOP: 'object_oriented_programming',
    ERROR_HANDLING: 'error_handling',
    MEMORY_MANAGEMENT: 'memory_management',
    CONCURRENCY: 'concurrency'
};
  
const ProgrammingLanguages = {
    JAVASCRIPT: 'javascript',
    PYTHON: 'python',
    JAVA: 'java',
    CPP: 'cpp',
    RUST: 'rust',
    GO: 'go',
    TYPESCRIPT: 'typescript'
};
  
// Validation helpers
const isValidDifficulty = (difficulty) => 
    Object.values(Difficulty).includes(difficulty);
  
const isValidCategory = (category) => 
    Object.values(Category).includes(category);
  
const isValidTopic = (topic) => 
    Object.values(Topics).includes(topic);
  
const isValidLanguage = (language) => 
    Object.values(ProgrammingLanguages).includes(language);
  
module.exports = {
    Difficulty,
    Category,
    Topics,
    ProgrammingLanguages,
    isValidDifficulty,
    isValidCategory,
    isValidTopic,
    isValidLanguage
};