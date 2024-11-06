import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { php } from '@codemirror/lang-php';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';

export const languageOptions = {
  javascript: {
    name: 'JavaScript',
    extension: javascript({ jsx: true, typescript: true }),
    mime: 'text/javascript',
    defaultTemplate: '// Start coding in JavaScript\n\nfunction solution() {\n  // Your code here\n}\n',
  },
  typescript: {
    name: 'TypeScript',
    extension: javascript({ jsx: true, typescript: true }),
    mime: 'application/typescript',
    defaultTemplate: '// Start coding in TypeScript\n\nfunction solution(): void {\n  // Your code here\n}\n',
  },
  python: {
    name: 'Python',
    extension: python(),
    mime: 'text/x-python',
    defaultTemplate: '# Start coding in Python\n\ndef solution():\n    # Your code here\n    pass\n',
  },
  cpp: {
    name: 'C++',
    extension: cpp(),
    mime: 'text/x-c++src',
    defaultTemplate: '// Start coding in C++\n\n#include <iostream>\n\nusing namespace std;\n\nint solution() {\n    // Your code here\n    return 0;\n}\n',
  },
  java: {
    name: 'Java',
    extension: java(),
    mime: 'text/x-java',
    defaultTemplate: 'public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n',
  },
  php: {
    name: 'PHP',
    extension: php(),
    mime: 'application/x-httpd-php',
    defaultTemplate: '<?php\n\nfunction solution() {\n    // Your code here\n}\n',
  },
  rust: {
    name: 'Rust',
    extension: rust(),
    mime: 'text/x-rustsrc',
    defaultTemplate: '// Start coding in Rust\n\nfn solution() -> () {\n    // Your code here\n}\n',
  },
  sql: {
    name: 'SQL',
    extension: sql(),
    mime: 'text/x-sql',
    defaultTemplate: '-- Start writing SQL\n\nSELECT *\nFROM table_name\nWHERE condition;\n',
  },
  html: {
    name: 'HTML',
    extension: html({ autoCloseTags: true }),
    mime: 'text/html',
    defaultTemplate: '<!DOCTYPE html>\n<html>\n<head>\n    <title>HTML Document</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>',
  },
  css: {
    name: 'CSS',
    extension: css(),
    mime: 'text/css',
    defaultTemplate: '/* Start styling with CSS */\n\n.container {\n    /* Your styles here */\n}\n',
  },
  json: {
    name: 'JSON',
    extension: json(),
    mime: 'application/json',
    defaultTemplate: '{\n    "key": "value"\n}\n',
  },
  markdown: {
    name: 'Markdown',
    extension: markdown(),
    mime: 'text/markdown',
    defaultTemplate: '# Title\n\n## Subtitle\n\nStart writing in Markdown...\n',
  },
  xml: {
    name: 'XML',
    extension: xml(),
    mime: 'application/xml',
    defaultTemplate: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n    <!-- Your XML here -->\n</root>',
  }
};

// Helper function to get language extension by name
export const getLanguageExtension = (languageName) => {
  const language = languageOptions[languageName?.toLowerCase()];
  return language ? language.extension : languageOptions.javascript.extension;
};

// Helper function to get default template by language
export const getDefaultTemplate = (languageName) => {
  const language = languageOptions[languageName?.toLowerCase()];
  return language ? language.defaultTemplate : languageOptions.javascript.defaultTemplate;
};

// Helper function to get language name from extension
export const getLanguageFromFileName = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const extensionMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'cpp': 'cpp',
    'cc': 'cpp',
    'h': 'cpp',
    'hpp': 'cpp',
    'java': 'java',
    'php': 'php',
    'rs': 'rust',
    'sql': 'sql',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'markdown': 'markdown',
    'xml': 'xml',
    'svg': 'xml'
  };
  return extensionMap[extension] || 'javascript';
};

// Helper function to get mime type by language
export const getMimeType = (languageName) => {
  const language = languageOptions[languageName?.toLowerCase()];
  return language ? language.mime : languageOptions.javascript.mime;
};

// Get language names for dropdown
export const getLanguageNames = () => {
  return Object.entries(languageOptions).map(([key, value]) => ({
    value: key,
    label: value.name
  }));
};

// Group languages by category
export const languageCategories = {
  popular: ['javascript', 'python', 'java'],
  web: ['html', 'css', 'javascript', 'typescript', 'php'],
  systems: ['cpp', 'rust'],
  data: ['sql', 'json', 'xml'],
  markup: ['markdown', 'html', 'xml']
};

// Function to get languages by category
export const getLanguagesByCategory = (category) => {
  const categoryLanguages = languageCategories[category] || [];
  return categoryLanguages.map(lang => ({
    value: lang,
    label: languageOptions[lang]?.name || lang
  }));
};

// Export default language
export const defaultLanguage = 'javascript';