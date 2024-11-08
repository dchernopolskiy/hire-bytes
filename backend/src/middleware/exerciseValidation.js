const { body, validationResult } = require('express-validator');
const { Difficulty, Category, Topics } = require('../models/constants');

const validateExercise = [
  body('id')
    .trim()
    .isLength({ min: 3 })
    .withMessage('ID must be at least 3 characters long')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('ID can only contain lowercase letters, numbers, and hyphens'),
  
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('difficulty')
    .isIn(Object.values(Difficulty))
    .withMessage('Invalid difficulty level'),
  
  body('category')
    .isIn(Object.values(Category))
    .withMessage('Invalid category'),
  
  body('topics')
    .isArray()
    .withMessage('Topics must be an array')
    .custom(topics => topics.every(topic => Object.values(Topics).includes(topic)))
    .withMessage('Invalid topic(s)'),
  
  body('languages')
    .isArray()
    .withMessage('Languages must be an array')
    .custom(languages => languages.every(lang => ['javascript', 'python', 'java'].includes(lang)))
    .withMessage('Invalid language(s)'),
  
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  
  body('examples')
    .isArray()
    .withMessage('Examples must be an array')
    .custom(examples => examples.every(ex => 'input' in ex && 'output' in ex))
    .withMessage('Each example must have input and output'),
  
  body('templates')
    .custom((templates, { req }) => {
      const langs = req.body.languages || [];
      return langs.every(lang => templates[lang])
    })
    .withMessage('Template must be provided for each supported language'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateExercise };