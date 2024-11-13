import { memo, useState } from 'react';
import { Brain, Book, MessageSquare, Code2, X } from 'lucide-react';
import { ExercisePanel } from './ExercisePanel';

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

  const tabs = [
    { id: 'analysis', label: 'AI Analysis', icon: Brain, creatorOnly: true },
    { id: 'exercises', label: 'Exercises', icon: Code2, creatorOnly: true },
    { id: 'notes', label: 'Notes', icon: MessageSquare, creatorOnly: false }
  ].filter(tab => !tab.creatorOnly || isCreator);

  const copyNotesToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(notes);
    } catch (err) {
      console.error('Failed to copy notes:', err);
    }
  };

  const handleExerciseSelect = (exercise, template) => {
    console.log('RightPanel received template:', template); // Log what we received
    if (onCodeChange && template) {
      onCodeChange(template);
    } else {
      console.log('No template or onCodeChange not available'); // Log if something's missing
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analysis':
        if (!isCreator) return null;
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
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-lg">Analyzing...</span>
                </div>
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

      case 'exercises':
        if (!isCreator) return null;
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
                rounded-lg transition-colors border border-gray-700 h-10"
            >
              Copy Notes
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