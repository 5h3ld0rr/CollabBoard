/**
 * Async handler wrapper to catch unhandled promise rejections
 * and pass them automatically to Express's central error handler.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
