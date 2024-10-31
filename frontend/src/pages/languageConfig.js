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
    defaultTemplate: '// Start coding in JavaScript\n\n',
  },
  typescript: {
    name: 'TypeScript',
    extension: javascript({ jsx: true, typescript: true }),
    mime: 'application/typescript',
    defaultTemplate: '// Start coding in TypeScript\n\n',
  },
  python: {
    name: 'Python',
    extension: python(),
    mime: 'text/x-python',
    defaultTemplate: '# Start coding in Python\n\n',
  },
  cpp: {
    name: 'C++',
    extension: cpp(),
    mime: 'text/x-c++src',
    defaultTemplate: '// Start coding in C++\n\n',
  },
  java: {
    name: 'Java',
    extension: java(),
    mime: 'text/x-java',
    defaultTemplate: 'public class Main {\n    public static void main(String[] args) {\n        // Start coding in Java\n    }\n}\n',
  },
  php: {
    name: 'PHP',
    extension: php(),
    mime: 'application/x-httpd-php',
    defaultTemplate: '<?php\n// Start coding in PHP\n\n',
  },
  rust: {
    name: 'Rust',
    extension: rust(),
    mime: 'text/x-rustsrc',
    defaultTemplate: '// Start coding in Rust\n\n',
  },
  sql: {
    name: 'SQL',
    extension: sql(),
    mime: 'text/x-sql',
    defaultTemplate: '-- Start writing SQL\n\n',
  },
  html: {
    name: 'HTML',
    extension: html({ autoCloseTags: true }),
    mime: 'text/html',
    defaultTemplate: '<!DOCTYPE html>\n<html>\n<head>\n    <title>HTML Document</title>\n</head>\n<body>\n    \n</body>\n</html>',
  },
  css: {
    name: 'CSS',
    extension: css(),
    mime: 'text/css',
    defaultTemplate: '/* Start styling with CSS */\n\n',
  },
  json: {
    name: 'JSON',
    extension: json(),
    mime: 'application/json',
    defaultTemplate: '{\n    \n}\n',
  },
  markdown: {
    name: 'Markdown',
    extension: markdown(),
    mime: 'text/markdown',
    defaultTemplate: '# Start writing in Markdown\n\n',
  },
  xml: {
    name: 'XML',
    extension: xml(),
    mime: 'application/xml',
    defaultTemplate: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n    \n</root>',
  }
};

// Helper function to get language extension by name
export const getLanguageExtension = (languageName) => {
  const language = languageOptions[languageName.toLowerCase()];
  return language ? language.extension : languageOptions.javascript.extension;
};

// Helper function to get default template by language
export const getDefaultTemplate = (languageName) => {
  const language = languageOptions[languageName.toLowerCase()];
  return language ? language.defaultTemplate : languageOptions.javascript.defaultTemplate;
};

// Helper function to get language name from extension
export const getLanguageFromFileName = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const extensionMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'cpp': 'cpp',
    'java': 'java',
    'php': 'php',
    'rs': 'rust',
    'sql': 'sql',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'xml': 'xml',
  };
  return extensionMap[extension] || 'javascript';
};