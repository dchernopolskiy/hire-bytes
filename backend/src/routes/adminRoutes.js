const express = require('express');
const Exercise = require('../models/exercise');
const { adminAuth } = require('../middleware/adminAuth');
const { validateExercise } = require('../middleware/exerciseValidation');

const router = express.Router();

// Protect all routes
router.use(adminAuth);

// Get all exercises (including inactive)
router.get('/exercises', async (req, res) => {
  try {
    const exercises = await Exercise.find({})
      .sort({ 'metadata.createdAt': -1 });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create exercise
router.post('/exercises', validateExercise, async (req, res) => {
  try {
    const exercise = new Exercise(req.body);
    await exercise.save();
    res.status(201).json(exercise);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Exercise ID already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Update exercise
router.put('/exercises/:id', validateExercise, async (req, res) => {
  try {
    const exercise = await Exercise.findOneAndUpdate(
      { id: req.params.id },
      { 
        ...req.body,
        'metadata.updatedAt': new Date()
      },
      { new: true }
    );
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    res.json(exercise);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete exercise
router.delete('/exercises/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findOneAndUpdate(
      { id: req.params.id },
      { is_active: false },
      { new: true }
    );
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    res.json({ message: 'Exercise deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;