import qs from 'qs';

// Map our language identifiers to CodeX API's language codes
const languageMap = {
  javascript: 'js',
  python: 'py',
  cpp: 'cpp',
  java: 'java',
  csharp: 'cs',
  go: 'go'
};

export class CodeExecutionService {
  constructor(apiUrl = 'https://api.codex.jaagrav.in') {
    this.apiUrl = apiUrl;
  }

  async executeCode(code, language, input = '') {
    try {
      // Map the language to CodeX format
      const codexLanguage = languageMap[language.toLowerCase()] || language;
      
      // Prepare the request data
      const data = qs.stringify({
        code,
        language: codexLanguage,
        input
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: data
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: result.status === 200,
        output: result.output,
        error: result.error,
        info: result.info,
        timeStamp: result.timeStamp
      };
    } catch (error) {
      console.error('Code execution error:', error);
      return {
        success: false,
        error: error.message,
        output: '',
        info: 'Execution failed'
      };
    }
  }

  async getSupportedLanguages() {
    try {
      const response = await fetch(`${this.apiUrl}/list`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.supportedLanguages;
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const codeExecutionService = new CodeExecutionService();