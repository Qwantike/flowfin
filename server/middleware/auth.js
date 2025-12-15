import jwt from 'jsonwebtoken';

export default function (req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1]; // Expect "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé, pas de token' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Token invalide' });
  }
};
