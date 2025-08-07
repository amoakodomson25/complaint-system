const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../config/db');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// POST /api/complaints/submit
router.post('/submit', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      name,
      contact,
      district,
      location,
      complaint_type,
      description
    } = req.body;

    const imageFiles = req.files['images'] || [];
    const audioFile = req.files['audio'] ? req.files['audio'][0] : null;

    const imageUrls = imageFiles.map(file => `/uploads/${file.filename}`);
    const imageUrlsJson = JSON.stringify(imageUrls);
    const audioUrl = audioFile ? `/uploads/${audioFile.filename}` : null;

    const seqResult = await pool.query("SELECT nextval('complaint_id_seq') AS seq");
    const complaintId = `C${seqResult.rows[0].seq.toString().padStart(7, '0')}`;

    await pool.query(`
      INSERT INTO complaints (id, name, contact, district, location, complaint_type, description, image_url, audio_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [complaintId, name, contact, district, location, complaint_type, description, imageUrlsJson, audioUrl, 'pending']);
    
    res.status(200).json({ success: true, complaintId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});


// POST /api/complaints/resolve
router.post('/resolve', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Complaint ID is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE complaints SET status = 'solved' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    res.json({ success: true, complaint: result.rows[0] });
  } catch (err) {
    console.error('Error resolving complaint:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});





// GET /api/complaints/count?district=DistrictName[&status=status]
router.get('/count', async (req, res) => {
  const { district, status } = req.query;

  if (!district) {
    return res.status(400).json({ error: 'District is required' });
  }

  try {
    let queryText = 'SELECT COUNT(*) FROM complaints WHERE district = $1';
    const queryParams = [district];

    if (status) {
      queryText += ' AND status = $2';
      queryParams.push(status);
    }

    const result = await pool.query(queryText, queryParams);
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error getting complaint count:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /api/complaints/all
router.get('/all', async (req, res) => {
  const { district } = req.query;

  try {
    let result;

    if (district) {
      result = await pool.query(
        `SELECT id, name, contact, complaint_type, submitted_at, status, location, description, image_url, audio_url
         FROM complaints
         WHERE district = $1
         ORDER BY id DESC`,
        [district]
      );
    } else {
      result = await pool.query(
        `SELECT id, name, contact, complaint_type, submitted_at, status, location, description, image_url, audio_url
         FROM complaints
         ORDER BY id DESC`
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error('DB error fetching complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});


module.exports = router;
