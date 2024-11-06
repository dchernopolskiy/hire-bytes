const fetch = require('node-fetch');
const AbortController = require('abort-controller');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 5000; // 5 seconds timeout for each test
let isRunning = false; // Guard against recursive calls

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, TEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function runTest(name, testFn) {
  console.log(`\nRunning test: ${name}`);
  try {
    const result = await testFn();
    console.log(`✅ ${name} succeeded:`, result);
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
    return false;
  }
}

async function testRoutes() {
  // Guard against multiple runs
  if (isRunning) {
    console.log('Tests already running, skipping...');
    return;
  }
  
  isRunning = true;
  console.log('\nStarting API tests...');
  console.log('Base URL:', BASE_URL);

  try {
    let successCount = 0;
    const totalTests = 3;

    // Test 1: Basic connection
    if (await runTest('Basic connection', async () => {
      const response = await fetchWithTimeout(`${BASE_URL}/keepalive`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    })) successCount++;

    // Test 2: Feedback email
    if (await runTest('Feedback email', async () => {
      const response = await fetchWithTimeout(`${BASE_URL}/api/feedback/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error('Email test failed');
      return data;
    })) successCount++;

    // Test 3: Feedback submission
    if (await runTest('Feedback submission', async () => {
      const response = await fetchWithTimeout(`${BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'test-user',
          username: 'Test User',
          rating: 5,
          feedback: 'Test feedback'
        })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error('Feedback submission failed');
      return data;
    })) successCount++;

    // Summary
    console.log('\nTest Summary:');
    console.log(`Passed: ${successCount}/${totalTests} tests`);
    
    if (successCount !== totalTests) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  } finally {
    isRunning = false;
  }
}

// Run tests if this file is being run directly
if (require.main === module) {
  testRoutes()
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    })
    .finally(() => {
      // Ensure the process exits
      setTimeout(() => process.exit(), 1000);
    });
}

module.exports = testRoutes;