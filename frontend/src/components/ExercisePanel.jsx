import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, FolderIcon, FileIcon } from 'lucide-react';
import { getExerciseTree, getExerciseTemplate } from '../services/exercises';

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
        <span>{node.name}</span>
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
  const [searchTerm, setSearchTerm] = useState('');
  const exerciseTree = getExerciseTree(language);

  const handleExerciseSelect = useCallback((exercise) => {
    const template = getExerciseTemplate(exercise.id, language);
    onSelectExercise(exercise, template);
  }, [language, onSelectExercise]);

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