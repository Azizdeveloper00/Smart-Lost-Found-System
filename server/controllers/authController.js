const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createToken = (userId) => jwt.sign(
  { id: userId },
  process.env.JWT_SECRET,
  { expiresIn: '7d' },
);

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
});
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  if (!emailPattern.test(email)) return res.status(400).json({ message: 'Please provide a valid email address.' });

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const user = await User.create({ name, email, password });
    return res.status(201).json({ user: publicUser(user), token: createToken(user._id.toString()) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please provide valid account details.' });
    }
    return res.status(500).json({ message: 'Registration failed.' });
  }
};

const login = async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  if (!emailPattern.test(email)) return res.status(400).json({ message: 'Please provide a valid email address.' });

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.json({ user: publicUser(user), token: createToken(user._id.toString()) });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.' });
  }
};

const getMe = (req, res) => res.json({ user: publicUser(req.user) });

module.exports = { register, login, getMe };