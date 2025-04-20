// This setup file fixes the util.inherits not a function error
// that occurs when using axios with Jest

// Mock the missing util.inherits function if it's not available
if (typeof global.util === 'undefined') {
  global.util = {};
}

if (typeof global.util.inherits !== 'function') {
  global.util.inherits = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  };
}

// Additional setup can be added here as needed 