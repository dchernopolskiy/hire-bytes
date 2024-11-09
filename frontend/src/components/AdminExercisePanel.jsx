import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Search, Filter, SortAsc, SortDesc, Eye } from 'lucide-react';
import { Difficulty, Category, Topics } from '#shared/constants/exercise.mjs';

const ExercisePreview = ({ exercise, onClose }) => {
  if (!exercise) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Exercise Preview</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{exercise.title}</h1>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-sm">
                {exercise.difficulty}
              </span>
              <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 text-sm">
                {exercise.category}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Description</h3>
            <div className="bg-gray-900/50 rounded-lg p-4 prose prose-invert max-w-none">
              {exercise.description}
            </div>
          </div>

          {exercise.examples.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Examples</h3>
              <div className="space-y-4">
                {exercise.examples.map((example, index) => (
                  <div key={index} className="bg-gray-900/50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-400 mb-2">Input:</div>
                        <pre className="text-sm">{JSON.stringify(example.input, null, 2)}</pre>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-400 mb-2">Output:</div>
                        <pre className="text-sm">{JSON.stringify(example.output, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exercise.constraints?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Constraints</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {exercise.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Supported Languages</h3>
            <div className="flex flex-wrap gap-2">
              {exercise.languages.map(lang => (
                <span 
                  key={lang}
                  className="px-2 py-1 rounded-md bg-gray-700/50 text-sm"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminExercisePanel() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    difficulty: '',
    category: '',
    language: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'title',
    direction: 'asc'
  });
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [previewExercise, setPreviewExercise] = useState(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/exercises`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch exercises');
      
      const data = await response.json();
      setExercises(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const DownloadButton = () => {
    const handleDownload = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/exercises/export`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        );
  
        if (!response.ok) throw new Error('Failed to fetch exercises');
  
        const exercises = await response.json();
        
        // Create downloadable file
        const blob = new Blob(
          [JSON.stringify(exercises, null, 2)], 
          { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `exercises-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        // Handle error appropriately
      }
    };
  
    return (
      <button
        onClick={handleDownload}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg
          flex items-center gap-2 transition-colors"
      >
        <Download className="w-5 h-5" />
        Export Exercises
      </button>
    );
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedExercises = exercises
    .filter(exercise => {
      const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = !filters.difficulty || exercise.difficulty === filters.difficulty;
      const matchesCategory = !filters.category || exercise.category === filters.category;
      const matchesLanguage = !filters.language || exercise.languages.includes(filters.language);
      
      return matchesSearch && matchesDifficulty && matchesCategory && matchesLanguage;
    })
    .sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      if (a[sortConfig.key] < b[sortConfig.key]) return -1 * direction;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * direction;
      return 0;
    });

  const handleSave = async (exercise) => {
    try {
      const url = exercise.id ? 
        `${import.meta.env.VITE_API_URL}/api/admin/exercises/${exercise.id}` :
        `${import.meta.env.VITE_API_URL}/api/admin/exercises`;
      
      const response = await fetch(url, {
        method: exercise.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(exercise)
      });

      if (!response.ok) throw new Error('Failed to save exercise');

      await fetchExercises();
      setShowForm(false);
      setEditingExercise(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/exercises/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete exercise');

      await fetchExercises();
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exercise Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg
            flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Exercise</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
    <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exercise Management</h1>
        <div className="flex gap-4">
            <DownloadButton />
            <button onClick={() => setShowForm(true)}>
            Add Exercise
            </button>
        </div>
    </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search exercises..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulties</option>
            {Object.values(Difficulty).map(diff => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {Object.values(Category).map(cat => (
              <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-4">
        {filteredAndSortedExercises.map(exercise => (
          <div
            key={exercise.id}
            className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{exercise.title}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-sm">
                    {exercise.difficulty}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 text-sm">
                    {exercise.category.replace(/_/g, ' ')}
                  </span>
                  {exercise.topics.slice(0, 3).map(topic => (
                    <span key={topic} className="px-2 py-1 rounded-md bg-gray-700/50 text-sm">
                      {topic}
                    </span>
                  ))}
                  {exercise.topics.length > 3 && (
                    <span className="px-2 py-1 rounded-md bg-gray-700/50 text-sm">
                      +{exercise.topics.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewExercise(exercise)}
                  className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-colors"
                  title="Preview"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setEditingExercise(exercise);
                    setShowForm(true);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-md text-blue-400 hover:text-blue-300 transition-colors"
                  title="Edit"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(exercise.id)}
                  className="p-2 hover:bg-gray-700 rounded-md text-red-400 hover:text-red-300 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredAndSortedExercises.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No exercises found matching your criteria
          </div>
        )}
      </div>

      {previewExercise && (
        <ExercisePreview 
          exercise={previewExercise} 
          onClose={() => setPreviewExercise(null)} 
        />
      )}

    {showForm && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg w-full max-w-4xl">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
            {editingExercise ? 'Edit Exercise' : 'Add Exercise'}
            </h2>
            <button
            onClick={() => {
                setShowForm(false);
                setEditingExercise(null);
            }}
            className="p-2 hover:bg-gray-700 rounded-md"
            >
            <X className="w-5 h-5" />
            </button>
        </div>
        <div className="p-6">
            <ExerciseForm
            exercise={editingExercise}
            onSave={handleSave}
            onCancel={() => {
                setShowForm(false);
                setEditingExercise(null);
            }}
            />
        </div>
        </div>
    </div>
    )}
        </div>
    );
    }