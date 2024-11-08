const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['junior', 'intermediate', 'senior']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'algorithms',
      'data_structures',
      'system_design',
      'debugging',
      'optimization',
      'language_specific'
    ]
  },
  topics: [{
    type: String,
    required: true
  }],
  languages: [{
    type: String,
    required: true
  }],
  description: {
    type: String,
    required: true
  },
  examples: [{
    input: mongoose.Schema.Types.Mixed,
    output: mongoose.Schema.Types.Mixed
  }],
  constraints: [String],
  templates: {
    type: Map,
    of: String
  },
  tests: [{
    input: mongoose.Schema.Types.Mixed,
    output: mongoose.Schema.Types.Mixed
  }],
  solution: {
    type: Map,
    of: String
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    difficulty_rating: {
      type: Number,
      min: 1,
      max: 5
    },
    times_solved: {
      type: Number,
      default: 0
    },
    success_rate: {
      type: Number,
      default: 0
    }
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
exerciseSchema.index({ category: 1, difficulty: 1 });
exerciseSchema.index({ topics: 1 });
exerciseSchema.index({ languages: 1 });
exerciseSchema.index({ 'metadata.difficulty_rating': 1 });

// Optional: Add any middleware or instance methods
exerciseSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.updatedAt = new Date();
  }
  next();
});

exerciseSchema.methods.updateSolveStats = async function(solved) {
  this.metadata.times_solved += 1;
  this.metadata.success_rate = (
    (this.metadata.success_rate * (this.metadata.times_solved - 1) + (solved ? 1 : 0)) / 
    this.metadata.times_solved
  );
  return this.save();
};

// Static methods
exerciseSchema.statics.findByCategory = function(category) {
  return this.find({ category, is_active: true });
};

exerciseSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ difficulty, is_active: true });
};

exerciseSchema.statics.findByLanguage = function(language) {
  return this.find({ 
    languages: language, 
    is_active: true 
  });
};

module.exports = mongoose.model('Exercise', exerciseSchema);