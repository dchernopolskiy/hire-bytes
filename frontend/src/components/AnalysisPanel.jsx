import { memo, useCallback } from 'react';
import { Brain, X } from 'lucide-react';

export const AnalysisPanel = memo(({
  isAnalyzing,
  handleAnalyzeCode,
  analysis,
  onClose,
}) => {
  // Prevent event propagation to editor
  const preventPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <div 
      className="w-80 border-l border-gray-700 flex flex-col bg-gray-900"
      onMouseDown={preventPropagation}
      onMouseMove={preventPropagation}
      onClick={preventPropagation}
    >
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Code Analysis</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-yellow-400 mt-2">
          ⚠️ Analysis is only visible to you (the interviewer)
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Analysis Section */}
        <div className="space-y-4">
          <button
            onClick={handleAnalyzeCode}
            disabled={isAnalyzing}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50
              text-white px-4 py-2 rounded-md transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:ring-offset-gray-800 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </div>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Analyze Code
              </>
            )}
          </button>

          {analysis && (
            <div className="bg-gray-800 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Analysis Results</h3>
              <div className="text-sm whitespace-pre-wrap">{analysis}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

AnalysisPanel.displayName = 'AnalysisPanel';