const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'photographer_secret_key');
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
