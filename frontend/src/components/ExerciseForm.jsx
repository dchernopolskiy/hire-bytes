import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Code, AlertCircle } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { Difficulty, Category, Topics } from '#shared/constants/exercise.mjs';

const TestCaseInput = ({ value, onChange, onRemove, index }) => (
  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900/30 rounded-lg border border-gray-700">
    <div className="space-y-2">
      <label className="block text-sm font-medium">Input</label>
      <textarea
        value={value.input}
        onChange={(e) => onChange(index, { ...value, input: e.target.value })}
        className="w-full h-24 bg-gray-800 border border-gray-700 rounded-md p-2 
          font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter test case input..."
      />
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-medium">Expected Output</label>
      <textarea
        value={value.output}
        onChange={(e) => onChange(index, { ...value, output: e.target.value })}
        className="w-full h-24 bg-gray-800 border border-gray-700 rounded-md p-2 
          font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter expected output..."
      />
    </div>
    <button
      onClick={() => onRemove(index)}
      className="col-span-2 flex items-center justify-center p-2 hover:bg-gray-800 
        rounded-md text-red-400 hover:text-red-300 transition-colors"
      title="Remove test case"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

const LanguageTemplate = ({ language, value, onChange, onRemove }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="block text-sm font-medium capitalize">{language}</label>
      <button
        onClick={() => onRemove(language)}
        className="p-1 hover:bg-gray-800 rounded-md text-red-400 
          hover:text-red-300 transition-colors"
        title={`Remove ${language} template`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
    <div className="h-64 border border-gray-700 rounded-lg overflow-hidden">
      <CodeEditor
        code={value}
        language={language}
        onChange={(newCode) => onChange(language, newCode)}
        fontSize="small"
        theme="dark"
      />
    </div>
  </div>
);


export default function ExerciseForm({ exercise, onSave, onCancel }) {
  const [formData, setFormData] = useState(exercise || {
    id: '',
    title: '',
    difficulty: 'junior',
    category: 'algorithms',
    topics: [],
    languages: [],
    description: '',
    examples: [{ input: '', output: '' }],
    constraints: [''],
    templates: {},
    solution: {
      javascript: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [selectedTopics, setSelectedTopics] = useState(new Set(formData.topics));
  const [topicInput, setTopicInput] = useState('');
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.id?.trim()) {
      newErrors.id = 'ID is required';
    }
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.languages.length === 0) {
      newErrors.languages = 'At least one language must be selected';
    }
    if (formData.topics.length === 0) {
      newErrors.topics = 'At least one topic must be selected';
    }
    if (Object.keys(formData.templates).length === 0) {
      newErrors.templates = 'At least one language template is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopics(prev => {
      const next = new Set(prev);
      next.add(topic);
      return next;
    });
    setFormData(prev => ({
      ...prev,
      topics: [...new Set([...prev.topics, topic])]
    }));
    setTopicInput('');
    setShowTopicSuggestions(false);
  };

  const handleTopicRemove = (topic) => {
    setSelectedTopics(prev => {
      const next = new Set(prev);
      next.delete(topic);
      return next;
    });
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }));
  };

  const filteredTopics = Object.entries(Topics)
    .filter(([key, value]) => 
      !selectedTopics.has(value) && 
      (key.toLowerCase().includes(topicInput.toLowerCase()) || 
       value.toLowerCase().includes(topicInput.toLowerCase()))
    )
    .slice(0, 5);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Section */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">ID</label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className={`w-full bg-gray-800 border ${
              errors.id ? 'border-red-500' : 'border-gray-700'
            } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="unique-exercise-id"
          />
          {errors.id && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.id}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full bg-gray-800 border ${
              errors.title ? 'border-red-500' : 'border-gray-700'
            } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Exercise Title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.title}
            </p>
          )}
        </div>
      </div>

      {/* Difficulty and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(Difficulty).map(([key, value]) => (
              <option key={key} value={value}>
                {key.charAt(0) + key.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(Category).map(([key, value]) => (
              <option key={key} value={value}>
                {key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Topics */}
      <div>
        <label className="block text-sm font-medium mb-1">Topics</label>
        <div className="relative">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => {
              setTopicInput(e.target.value);
              setShowTopicSuggestions(true);
            }}
            className={`w-full bg-gray-800 border ${
              errors.topics ? 'border-red-500' : 'border-gray-700'
            } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Search and select topics..."
          />
          {showTopicSuggestions && filteredTopics.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 
              rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredTopics.map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTopicSelect(value)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 
                    focus:outline-none focus:bg-gray-700"
                >
                  {key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.topics && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.topics}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.topics.map(topic => (
            <span
              key={topic}
              className="px-2 py-1 bg-gray-700 rounded-md text-sm flex items-center gap-2"
            >
              {topic}
              <button
                type="button"
                onClick={() => handleTopicRemove(topic)}
                className="hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          className={`w-full bg-gray-800 border ${
            errors.description ? 'border-red-500' : 'border-gray-700'
          } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.description}
          </p>
        )}
      </div>

      {/* Test Cases */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Test Cases</label>
          <button
            type="button"
            onClick={() => setFormData({
              ...formData,
              tests: [...formData.tests, { input: '', output: '' }]
            })}
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
          >
            <Plus className="w-4 h-4" />
            Add Test Case
          </button>
        </div>
        <div className="space-y-4">
          {formData.tests.map((test, index) => (
            <TestCaseInput
              key={index}
              value={test}
              index={index}
              onChange={(idx, newValue) => {
                const newTests = [...formData.tests];
                newTests[idx] = newValue;
                setFormData({ ...formData, tests: newTests });
              }}
              onRemove={(idx) => {
                setFormData({
                  ...formData,
                  tests: formData.tests.filter((_, i) => i !== idx)
                });
              }}
            />
          ))}
        </div>
      </div>

      {/* Language Templates */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Language Templates</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                setFormData({
                  ...formData,
                  languages: [...new Set([...formData.languages, e.target.value])],
                  templates: {
                    ...formData.templates,
                    [e.target.value]: formData.templates[e.target.value] || 
                      `// ${e.target.value} solution template\n\n`
                  }
                });
                e.target.value = '';
              }
            }}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
<option value="">Add Language Template</option>
            {['javascript', 'python', 'java'].filter(lang => 
              !formData.languages.includes(lang)
            ).map(lang => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        </div>
        {errors.templates && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.templates}
          </p>
        )}
        <div className="space-y-4">
          {formData.languages.map(lang => (
            <LanguageTemplate
              key={lang}
              language={lang}
              value={formData.templates[lang] || ''}
              onChange={(language, code) => {
                setFormData({
                  ...formData,
                  templates: {
                    ...formData.templates,
                    [language]: code
                  }
                });
              }}
              onRemove={(language) => {
                const newTemplates = { ...formData.templates };
                delete newTemplates[language];
                setFormData({
                  ...formData,
                  languages: formData.languages.filter(l => l !== language),
                  templates: newTemplates
                });
              }}
            />
          ))}
        </div>
      </div>

      {/* Solution and Explanation */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Solution Explanation</label>
          <textarea
            value={formData.solution.explanation || ''}
            onChange={(e) => setFormData({
              ...formData,
              solution: {
                ...formData.solution,
                explanation: e.target.value
              }
            })}
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Explain your solution approach..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-gray-300 flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md
            flex items-center gap-2 transition-colors"
        >
          <Save className="w-5 h-5" />
          Save Exercise
        </button>
      </div>
    </form>
  );
}