import express from 'express';
import Exercise from '../models/exercise';
const Exercise = require('./exercise.js');


const router = express.Router();

// Get exercise list with filters

router.get('/exercises', async (req, res) => {
  try {
    const {
      category,
      difficulty,
      language,
      topic,
      page = 1,
      limit = 20
    } = req.query;

    const query = { is_active: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (language) query.languages = language;
    if (topic) query.topics = topic;

    const exercises = await Exercise.find(query)
      .select('-solution') // Don't send solutions by default
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ 'metadata.times_solved': -1 });

    const total = await Exercise.countDocuments(query);

    res.json({
      exercises,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single exercise
router.get('/exercises/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findOne({ 
      id: req.params.id,
      is_active: true 
    });
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
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

router.put('/admin/exercises/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, 'metadata.updatedAt': new Date() },
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

export default router;