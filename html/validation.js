// Only diagnostics created here may cross the CLI's otherwise generic error boundary.
// Paths are assembled from fixed contract keys and bounded array indices, never input text.
const diagnostics = new WeakMap();

export function invalid(ErrorType, message, path) {
  const error = new ErrorType(message);
  Object.defineProperties(error, {
    code: {value: 'ERR_TESSERAE_VALIDATION', enumerable: true},
    path: {value: path, enumerable: true}
  });
  diagnostics.set(error, `${path}: ${message}`);
  throw error;
}

export function validationDiagnostic(error) {
  return diagnostics.get(error);
}
