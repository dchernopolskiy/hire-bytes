const express = require('express');
const Exercise = require('../models/exercise.js');
const { Category, Difficulty } = require('../models/constants');


const router = express.Router();

// Get exercise list with filters

router.get('/exercise-tree', async (req, res) => {
  try {
    const { language } = req.query;
    console.log('Fetching exercise tree for language:', language);
    
    const exercises = await Exercise.find({ 
      is_active: true,
      languages: language 
    }).select('-solution');

    const tree = Object.values(Category).map(category => ({
      id: category,
      name: category.replace(/_/g, ' ').toLowerCase(),
      children: Object.values(Difficulty).map(difficulty => ({
        id: `${category}-${difficulty}`,
        name: difficulty,
        exercises: exercises.filter(
          ex => ex.category === category && ex.difficulty === difficulty
        ).map(ex => ({
          id: ex.id,
          title: ex.title,
          topics: ex.topics
        }))
      })).filter(child => child.exercises.length > 0)
    })).filter(cat => cat.children.length > 0);

    res.json(tree);
  } catch (error) {
    console.error('Exercise tree error:', error);
    res.status(500).json({ error: 'Failed to fetch exercise tree' });
  }
});

// Get single exercise
router.get('/exercises/:id', async (req, res) => {
  try {
    console.log('Fetching exercise with ID:', req.params.id); // Log the requested ID
    const exercise = await Exercise.findOne({ 
      id: req.params.id,
      is_active: true 
    });
    
    console.log('Found exercise:', exercise); // Log what we found
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Exercise fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get exercise data
router.get('/exercises', async (req, res) => {
    try {
      const exercises = await Exercise.find({ is_active: true });
      res.json(exercises);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

// Admin routes
router.post('/admin/exercises', async (req, res) => {
  try {
    const exercise = new Exercise(req.body);
    await exercise.save();
    res.status(201).json(exercise);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/exercises/:id', async (req, res) => {
  try {
    console.log('Fetching exercise with ID:', req.params.id);
    const exercise = await Exercise.findOne({ 
      id: req.params.id,
      is_active: true 
    });
    
    console.log('Raw exercise from DB:', exercise);
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // If templates are stored as a Map, convert to plain object
    const exerciseObj = exercise.toObject();
    if (exerciseObj.templates instanceof Map) {
      exerciseObj.templates = Object.fromEntries(exerciseObj.templates);
    }

    console.log('Processed exercise to send:', exerciseObj);
    res.json(exerciseObj);
  } catch (error) {
    console.error('Exercise fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/admin/exercises/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findOneAndUpdate(
      { id: req.params.id },
      { is_active: false },
      { new: true }
    );
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    res.json({ message: 'Exercise deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;  