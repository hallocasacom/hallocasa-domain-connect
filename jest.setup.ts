// This file contains type definitions for Jest testing
import { jest } from '@jest/globals';

// Make Jest available globally
global.jest = jest;

// Declare jest as a global namespace for TypeScript
declare global {
  namespace NodeJS {
    interface Global {
      jest: typeof jest;
    }
  }
} 