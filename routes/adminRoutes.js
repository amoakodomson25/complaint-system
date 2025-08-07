const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// Admin login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const admin = result.rows[0];
    if (password !== admin.password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Update last login
    await pool.query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);

    res.json({
      success: true,
      message: 'Login successful',
      admin: {
        id: admin.id,
        name: admin.name,
        district: admin.district
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
