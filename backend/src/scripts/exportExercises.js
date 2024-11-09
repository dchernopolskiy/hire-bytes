// exportExercises.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs/promises');

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function exportExercises() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Exercise = require('../models/exercise');

    // Fetch all exercises and sort them by difficulty and category
    const exercises = await Exercise.find({})
      .sort({ difficulty: 1, category: 1 })
      .lean();

    // Transform the data to match our import format
    const formattedExercises = exercises.map(({
      id,
      title,
      difficulty,
      category,
      topics,
      languages,
      description,
      examples,
      constraints,
      templates,
      solution,
      metadata,
      ...rest
    }) => ({
      id,
      title,
      difficulty,
      category,
      topics,
      languages,
      description,
      examples,
      constraints,
      templates,
      solution
    }));

    // Create an output directory if it doesn't exist
    const outputDir = path.resolve(__dirname, '../data');
    await fs.mkdir(outputDir, { recursive: true });

    // Write to both JSON and JS files
    const jsonPath = path.join(outputDir, 'exercises.json');
    const jsPath = path.join(outputDir, 'exercises.js');

    await fs.writeFile(
      jsonPath, 
      JSON.stringify(formattedExercises, null, 2)
    );

    await fs.writeFile(
      jsPath,
      `// Auto-generated exercise data - ${new Date().toISOString()}
const exercises = ${JSON.stringify(formattedExercises, null, 2)};

module.exports = exercises;`
    );

    console.log(`Export complete! Files written to:
- ${jsonPath}
- ${jsPath}
Total exercises: ${exercises.length}`);

    // Print a summary of exercises by difficulty and category
    const summary = exercises.reduce((acc, ex) => {
      acc.difficulties[ex.difficulty] = (acc.difficulties[ex.difficulty] || 0) + 1;
      acc.categories[ex.category] = (acc.categories[ex.category] || 0) + 1;
      return acc;
    }, { difficulties: {}, categories: {} });

    console.log('\nExercise Summary:');
    console.log('\nBy Difficulty:');
    Object.entries(summary.difficulties).forEach(([diff, count]) => {
      console.log(`- ${diff}: ${count}`);
    });

    console.log('\nBy Category:');
    Object.entries(summary.categories).forEach(([cat, count]) => {
      console.log(`- ${cat}: ${count}`);
    });

  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  exportExercises();
}

module.exports = exportExercises;