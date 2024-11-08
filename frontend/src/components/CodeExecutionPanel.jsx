import { useState } from 'react';
import { Play, XCircle } from 'lucide-react';
import { codeExecutionService } from '../services/codeExecutionService';

const CodeExecutionPanel = ({ code, language }) => {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [input, setInput] = useState('');

  const handleExecute = async () => {
    setIsExecuting(true);
    setOutput('');
    setError('');

    try {
      const result = await codeExecutionService.executeCode(code, language, input);
      
      if (result.success) {
        setOutput(result.output);
        if (result.error) {
          setError(result.error);
        }
      } else {
        setError(result.error || 'Execution failed');
      }
    } catch (err) {
      setError('Failed to execute code: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="border-t border-gray-700 bg-gray-800/50 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Code Execution</h3>
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 
              rounded-md hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isExecuting ? 'Executing...' : 'Run Code'}</span>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Program Input (optional)</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter program input here..."
            className="w-full h-20 bg-gray-900/50 border border-gray-700 rounded-md p-2 
              text-sm font-mono resize-none"
          />
        </div>

        {(output || error) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Output</h4>
              <button
                onClick={() => {
                  setOutput('');
                  setError('');
                }}
                className="p-1 hover:bg-gray-700/50 rounded-md text-gray-400"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-700 rounded-md p-3 font-mono text-sm">
              {error && (
                <div className="text-red-400 whitespace-pre-wrap mb-2">{error}</div>
              )}
              {output && (
                <div className="text-green-400 whitespace-pre-wrap">{output}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeExecutionPanel;