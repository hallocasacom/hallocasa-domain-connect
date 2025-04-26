// Mock Node.js util module
jest.mock('util', () => {
  // Store a reference to the original function if it exists
  const originalInherits = jest.requireActual('util').inherits || function() {};
  
  return {
    // We need to keep the original if possible, or provide a mock
    inherits: jest.fn(originalInherits),
    // Simple promisify implementation
    promisify: jest.fn(fn => fn)
  };
});