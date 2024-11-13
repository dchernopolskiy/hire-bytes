import { memo, useState } from 'react';
import { Brain, Book, MessageSquare, Code2, X, FileText, Copy, Check } from 'lucide-react';
import { ExercisePanel } from './ExercisePanel';

const AnalysisIndicator = () => (
  <div className="flex items-center justify-center space-x-2 py-2">
    <Brain className="w-5 h-5 text-blue-400 animate-pulse" />
    <div className="flex items-center space-x-1">
      <span className="text-blue-400">Analyzing code</span>
      <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const CodeTemplate = ({ title, code, onApply }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-gray-800/50 rounded-lg border border-gray-700 p-4 mb-4 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onApply(code)}
            className="p-1.5 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            title="Insert into editor"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>
      <pre className="text-sm bg-gray-900/50 rounded-md p-3 overflow-x-auto">
        <code className="text-gray-300">{code}</code>
      </pre>
    </div>
  );
};

const codeSnippets = {
  javascript: {
    'Promise Handler': `try {
  const result = await somePromise();
  // Handle success
} catch (error) {
  console.error('Error:', error);
  // Handle error
}`,
    'Array Methods': `const filtered = array.filter(item => /* condition */);
const mapped = array.map(item => /* transform */);
const reduced = array.reduce((acc, item) => /* accumulate */, initial);`,
    'Event Handler': `const handleEvent = (event) => {
  event.preventDefault();
  // Handle event
};`,
    'Async Function': `async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}`
  },
  python: {
    'Exception Handler': `try:
    result = some_function()
    # Handle success
except Exception as e:
    print(f"Error: {e}")
    # Handle error`,
    'List Comprehension': `# Filter
filtered = [x for x in items if condition]

# Map
mapped = [transform(x) for x in items]

# Both
result = [transform(x) for x in items if condition]`
  }
  // Add more languages as needed
};

const RightPanel = memo(({ 
  isCreator,
  analysis,
  isAnalyzing,
  handleAnalyzeCode,
  onClose,
  language,
  onCodeChange
}) => {
  const [activeTab, setActiveTab] = useState(isCreator ? 'analysis' : 'notes');
  const [notes, setNotes] = useState('');
  const [copiedNote, setCopiedNote] = useState(false);

  const tabs = [
    { id: 'analysis', label: 'AI Analysis', icon: Brain, creatorOnly: true },
    // { id: 'templates', label: 'Templates', icon: FileText, creatorOnly: false },
    { id: 'exercises', label: 'Exercises', icon: Code2, creatorOnly: true },
    { id: 'notes', label: 'Notes', icon: MessageSquare, creatorOnly: false }
  ].filter(tab => !tab.creatorOnly || isCreator);

  const copyNotesToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    } catch (err) {
      console.error('Failed to copy notes:', err);
    }
  };

  const handleExerciseSelect = (exercise, template) => {
    if (onCodeChange && template) {
      onCodeChange(template);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analysis':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <button
              onClick={handleAnalyzeCode}
              disabled={isAnalyzing}
              className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50
                text-white px-4 py-3 rounded-lg transition-colors duration-200
                border border-gray-700 shadow-lg backdrop-blur-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                disabled:cursor-not-allowed flex items-center justify-center gap-2 h-12"
            >
              {isAnalyzing ? (
                <AnalysisIndicator />
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span className="text-md">Analyze Code</span>
                </>
              )}
            </button>

            {analysis && (
              <div className="mt-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Analysis Results</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {analysis.split('\n').map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap">{line}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'templates':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            {codeSnippets[language]
              ? Object.entries(codeSnippets[language]).map(([title, code]) => (
                  <CodeTemplate
                    key={title}
                    title={title}
                    code={code}
                    onApply={onCodeChange}
                  />
                ))
              : (
                <div className="text-center text-gray-400 py-8">
                  No templates available for {language}
                </div>
              )}
          </div>
        );

      case 'exercises':
        return (
          <ExercisePanel 
            language={language} 
            onSelectExercise={handleExerciseSelect}
          />
        );

      case 'notes':
        return (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take notes for your reference..."
              className="w-full h-64 bg-gray-800/50 border border-gray-700 rounded-lg p-3 
                text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 
                focus:ring-blue-500 resize-none"
            />
            <button
              onClick={copyNotesToClipboard}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 
                rounded-lg transition-colors border border-gray-700 h-10 flex items-center 
                justify-center gap-2"
            >
              {copiedNote ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Notes
                </>
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 border-l border-gray-700 flex flex-col bg-gray-900">
      <div className="border-b border-gray-700 p-4 flex justify-end items-center">
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded-md text-gray-400 
            transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-gray-700 bg-gray-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3
              ${activeTab === tab.id 
                ? 'bg-gray-800 text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:bg-gray-800/50'
              } transition-colors whitespace-nowrap`}
          >
            <tab.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden bg-gray-900">
        {renderTabContent()}
      </div>
    </div>
  );
});

RightPanel.displayName = 'RightPanel';

export default RightPanel;