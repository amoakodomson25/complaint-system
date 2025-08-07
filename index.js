const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());


// Serve static frontend folders
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
app.use('/user', express.static(path.join(__dirname, 'public', 'user')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('uploads'));

// Routes
const adminRoutes = require('./routes/adminRoutes');
const complaintRoutes = require('./routes/complaintRoutes');



app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintRoutes);


app.use(express.static(path.join(__dirname, 'public')));

// Serve login page at root and /admin-login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});
app.get('/admin/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});




// Start server
app.listen(3000, () => {
  console.log('✅ Server running on http://localhost:3000');
});
