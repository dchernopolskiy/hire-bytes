import { useState, useCallback } from 'react';
import { Save, X, Plus, Trash2, Code, AlertCircle, Eye, Copy } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { Difficulty, Category, Topics } from '#shared/constants/exercise.mjs';

const InputField = ({ label, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      {...props}
      className={`w-full bg-gray-800 border ${
        error ? 'border-red-500' : 'border-gray-700'
      } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    />
    {error && (
      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

const TextArea = ({ label, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <textarea
      {...props}
      className={`w-full bg-gray-800 border ${
        error ? 'border-red-500' : 'border-gray-700'
      } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]`}
    />
    {error && (
      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

const Select = ({ label, options, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <select
      {...props}
      className={`w-full bg-gray-800 border ${
        error ? 'border-red-500' : 'border-gray-700'
      } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      {options.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
    {error && (
      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

const TestCase = ({ input, output, onUpdate, onRemove, index }) => (
  <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-700">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Input</label>
        <textarea
          value={input}
          onChange={(e) => onUpdate(index, { input: e.target.value, output })}
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 
            font-mono text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Test case input..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Expected Output</label>
        <textarea
          value={output}
          onChange={(e) => onUpdate(index, { input, output: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 
            font-mono text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Expected output..."
        />
      </div>
    </div>
    <div className="mt-2 flex justify-end">
      <button
        onClick={() => onRemove(index)}
        className="flex items-center gap-1 text-red-400 hover:text-red-300 px-2 py-1 rounded"
      >
        <Trash2 className="w-4 h-4" />
        Remove
      </button>
    </div>
  </div>
);

const LanguageTemplate = ({ language, code, onChange, onRemove, onPreview }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="block text-sm font-medium capitalize">{language}</label>
      <div className="flex gap-2">
        <button
          onClick={() => onPreview(language, code)}
          className="p-1 hover:bg-gray-800 rounded-md text-gray-400 
            hover:text-white transition-colors"
          title="Preview template"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRemove(language)}
          className="p-1 hover:bg-gray-800 rounded-md text-red-400 
            hover:text-red-300 transition-colors"
          title={`Remove ${language} template`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div className="h-64 border border-gray-700 rounded-lg overflow-hidden">
      <CodeEditor
        code={code}
        language={language}
        onChange={(newCode) => onChange(language, newCode)}
        fontSize="small"
        theme="dark"
      />
    </div>
  </div>
);

const TopicSelect = ({ selectedTopics, onChange }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const availableTopics = Object.entries(Topics)
    .filter(([key, value]) => 
      !selectedTopics.includes(value) && 
      (key.toLowerCase().includes(input.toLowerCase()) || 
       value.toLowerCase().includes(input.toLowerCase()))
    );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Topics</label>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search topics..."
        />
        {showSuggestions && availableTopics.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 
            rounded-md shadow-lg max-h-60 overflow-auto">
            {availableTopics.map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChange([...selectedTopics, value]);
                  setInput('');
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-700"
              >
                {key.split('_').map(word => 
                  word.charAt(0) + word.slice(1).toLowerCase()
                ).join(' ')}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedTopics.map(topic => (
          <span
            key={topic}
            className="px-2 py-1 bg-gray-700 rounded-md text-sm flex items-center gap-2"
          >
            {topic}
            <button
              type="button"
              onClick={() => onChange(selectedTopics.filter(t => t !== topic))}
              className="hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

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
      javascript: '',
      explanation: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.id?.trim()) newErrors.id = 'ID is required';
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    if (formData.topics.length === 0) newErrors.topics = 'At least one topic is required';
    if (Object.keys(formData.templates).length === 0) {
      newErrors.templates = 'At least one language template is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await onSave(formData);
    }
  };

  const updateFormField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="ID"
          value={formData.id}
          onChange={(e) => updateFormField('id', e.target.value)}
          placeholder="unique-exercise-id"
          error={errors.id}
        />
        <InputField
          label="Title"
          value={formData.title}
          onChange={(e) => updateFormField('title', e.target.value)}
          placeholder="Exercise Title"
          error={errors.title}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Difficulty"
          value={formData.difficulty}
          onChange={(e) => updateFormField('difficulty', e.target.value)}
          options={Object.entries(Difficulty).map(([key, value]) => ({
            value,
            label: key.charAt(0) + key.slice(1).toLowerCase()
          }))}
        />
        <Select
          label="Category"
          value={formData.category}
          onChange={(e) => updateFormField('category', e.target.value)}
          options={Object.entries(Category).map(([key, value]) => ({
            value,
            label: key.split('_').map(word => 
              word.charAt(0) + word.slice(1).toLowerCase()
            ).join(' ')
          }))}
        />
      </div>

      <TopicSelect
        selectedTopics={formData.topics}
        onChange={(topics) => updateFormField('topics', topics)}
      />

      <TextArea
        label="Description"
        value={formData.description}
        onChange={(e) => updateFormField('description', e.target.value)}
        placeholder="Exercise description with requirements..."
        error={errors.description}
      />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium">Test Cases</label>
          <button
            type="button"
            onClick={() => updateFormField('examples', [
              ...formData.examples,
              { input: '', output: '' }
            ])}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
          >
            <Plus className="w-4 h-4" />
            Add Test Case
          </button>
        </div>
        <div className="space-y-4">
          {formData.examples.map((example, index) => (
            <TestCase
              key={index}
              {...example}
              index={index}
              onUpdate={(idx, newValue) => {
                const newExamples = [...formData.examples];
                newExamples[idx] = newValue;
                updateFormField('examples', newExamples);
              }}
              onRemove={(idx) => {
                updateFormField(
                  'examples',
                  formData.examples.filter((_, i) => i !== idx)
                );
              }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium">Language Templates</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                updateFormField('languages', [
                  ...new Set([...formData.languages, e.target.value])
                ]);
                updateFormField('templates', {
                  ...formData.templates,
                  [e.target.value]: formData.templates[e.target.value] || 
                    `// ${e.target.value} solution template\n\n`
                });
                e.target.value = '';
              }
            }}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2"
          >
            <option value="">Add Language</option>
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
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.templates}
          </p>
        )}
        <div className="space-y-4">
          {formData.languages.map(lang => (
            <LanguageTemplate
              key={lang}
              language={lang}
              code={formData.templates[lang] || ''}
              onChange={(language, code) => {
                updateFormField('templates', {
                  ...formData.templates,
                  [language]: code
                });
              }}
              onRemove={(language) => {
                const newTemplates = { ...formData.templates };
                delete newTemplates[language];
                updateFormField('languages', 
                  formData.languages.filter(l => l !== language)
                );
                updateFormField('templates', newTemplates);
              }}
              onPreview={(language, code) => setPreviewTemplate({ language, code })}
            />
          ))}
        </div>
      </div>

      return (
      <TextArea
        label="Solution Explanation"
        value={formData.solution.explanation || ''}
        onChange={(e) => updateFormField('solution', {
          ...formData.solution,
          explanation: e.target.value
        })}
        placeholder="Explain the solution approach and key concepts..."
      />
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

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-3xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium">
                Preview {previewTemplate.language} Template
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(previewTemplate.code);
                    } catch (error) {
                      console.error('Failed to copy:', error);
                    }
                  }}
                  className="p-2 hover:bg-gray-700 rounded-md text-gray-400 
                    hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-gray-700 rounded-md text-gray-400 
                    hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <CodeEditor
                  code={previewTemplate.code}
                  language={previewTemplate.language}
                  onChange={() => {}}
                  readOnly={true}
                  theme="dark"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}