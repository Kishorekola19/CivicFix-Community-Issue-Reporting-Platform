export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
export const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
  if (err.code === 11000) return res.status(409).json({ message: 'An account with that email already exists' });
  if (err.name === 'CastError') return res.status(404).json({ message: 'Resource not found' });
  if (!err.status || err.status >= 500) console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
};

