import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Edit, Trash2, Search, Filter } from 'lucide-react';
import ExerciseForm from '../components/ExerciseForm';

const AdminPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [expandedExercises, setExpandedExercises] = useState(new Set());
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [editingExercise, setEditingExercise] = useState(null);
  const navigate = useNavigate();

  // Check auth status on mount and after refresh
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setIsLoggedIn(true);
          fetchExercises();
        } else {
          localStorage.removeItem('adminToken');
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { token } = await response.json();
      localStorage.setItem('adminToken', token);
      setIsLoggedIn(true);
      fetchExercises();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    navigate('/admin');
  };

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
    }
  };

  const toggleExercise = (id) => {
    setExpandedExercises(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleEditClick = (exercise) => {
    setEditingExercise(exercise);
    setShowForm(true);
  };

  const handleSaveExercise = async (exerciseData) => {
    try {
      const url = exerciseData.id ? 
        `${import.meta.env.VITE_API_URL}/api/admin/exercises/${exerciseData.id}` :
        `${import.meta.env.VITE_API_URL}/api/admin/exercises`;

      const response = await fetch(url, {
        method: exerciseData.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(exerciseData)
      });

      if (!response.ok) throw new Error('Failed to save exercise');

      fetchExercises();
      setShowForm(false);
      setEditingExercise(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const filteredExercises = exercises.filter(ex => 
    selectedLanguage === 'all' || ex.languages.includes(selectedLanguage)
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-700 rounded-md px-3 py-2 border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 rounded-md px-3 py-2 border border-gray-600"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Exercise Management</h1>
          <div className="flex gap-4">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2"
            >
              <option value="all">All Languages</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
            <button
              onClick={() => {
                setEditingExercise(null);
                setShowForm(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Add Exercise
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <ExerciseForm
            initialData={editingExercise}
            onSave={handleSaveExercise}
            onCancel={() => {
              setShowForm(false);
              setEditingExercise(null);
            }}
          />
        )}

        <div className="space-y-4">
          {filteredExercises.map(exercise => (
            <div
              key={exercise.id}
              className="bg-gray-800 rounded-lg border border-gray-700"
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => toggleExercise(exercise.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedExercises.has(exercise.id) ? 
                      <ChevronDown className="w-5 h-5" /> : 
                      <ChevronRight className="w-5 h-5" />
                    }
                    <h3 className="text-lg font-semibold">{exercise.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(exercise);
                      }}
                      className="p-2 hover:bg-gray-700 rounded-md text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-sm">
                    {exercise.difficulty}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 text-sm">
                    {exercise.category}
                  </span>
                  {exercise.languages.map(lang => (
                    <span key={lang} className="px-2 py-1 rounded-md bg-gray-700/50 text-sm">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              {expandedExercises.has(exercise.id) && (
                <div className="p-4 border-t border-gray-700 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-300">{exercise.description}</p>
                  </div>

                  {exercise.examples.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Examples</h4>
                      <div className="space-y-2">
                        {exercise.examples.map((example, index) => (
                          <div key={index} className="bg-gray-900/50 p-3 rounded-md">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-gray-400">Input:</span>
                                <pre className="mt-1 text-sm">{example.input}</pre>
                              </div>
                              <div>
                                <span className="text-sm text-gray-400">Output:</span>
                                <pre className="mt-1 text-sm">{example.output}</pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {exercise.constraints?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Constraints</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {exercise.constraints.map((constraint, index) => (
                          <li key={index}>{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;