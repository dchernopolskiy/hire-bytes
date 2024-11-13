import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, FolderIcon, FileIcon, Loader2 } from 'lucide-react';

const TreeNode = ({ node, onSelect, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children?.length > 0 || node.exercises?.length > 0;

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded-md cursor-pointer"
      >
        {hasChildren ? (
          isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        ) : (
          <FileIcon className="w-4 h-4" />
        )}
        <span className="capitalize">{node.name}</span>
      </div>
      
      {isOpen && (
        <div className="ml-4">
          {node.children?.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
          {node.exercises?.map(exercise => (
            <div
              key={exercise.id}
              onClick={() => onSelect(exercise)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded-md cursor-pointer"
            >
              <FileIcon className="w-4 h-4" />
              <span>{exercise.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ExercisePanel = ({ language, onSelectExercise }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [exerciseTree, setExerciseTree] = useState([]);

  const handleExerciseSelect = async (exercise) => {
    try {
      console.log('Attempting to select exercise:', exercise);
  
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/exercises/${exercise.id}`;
      console.log('Making API request to:', apiUrl);
  
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error('Failed to fetch exercise details');
      }
      
      const fullExercise = await response.json();
      
      // Create a template that includes the problem description
      const descriptionComment = `/*
  Problem: ${fullExercise.title}
  Difficulty: ${fullExercise.difficulty}
  
  ${fullExercise.description}
  
  Examples:
  ${fullExercise.examples?.map(ex => `Input: ${ex.input}\nOutput: ${ex.output}`).join('\n')}
  
  ${fullExercise.constraints ? `Constraints:\n${fullExercise.constraints.join('\n')}` : ''}
  */\n\n`;
  
      // Get the language-specific template
      let templates = fullExercise.templates;
      if (templates instanceof Map) {
        templates = Object.fromEntries(templates);
      }
  
      const codeTemplate = templates?.[language] || 
                          templates?.['javascript'] || 
                          `// Template for ${exercise.title}\n\n`;
  
      // Combine description and code template
      const fullTemplate = descriptionComment + codeTemplate;
  
      console.log('Selected template:', fullTemplate);
      onSelectExercise(fullExercise, fullTemplate);
    } catch (err) {
      console.error('Exercise selection failed:', err);
    }
  };

  const fetchExerciseTree = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/exercise-tree?language=${language}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch exercise tree');
      
      const data = await response.json();
      setExerciseTree(data);
    } catch (err) {
      console.error('Exercise tree error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchExerciseTree();
  }, [fetchExerciseTree]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400">
        Failed to load exercises: {error}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700/50 rounded-md border border-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {exerciseTree.map(node => (
          <TreeNode 
            key={node.id} 
            node={node} 
            onSelect={handleExerciseSelect}
          />
        ))}
      </div>
    </div>
  );
};