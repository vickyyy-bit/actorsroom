const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname))); // Serves index.html
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// MongoDB Configuration
const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'acting_academy';
const PORT = 3000;

MongoClient.connect(MONGO_URL, { useUnifiedTopology: true })
  .then(client => {
    console.log('✅ Connected to MongoDB');
    const db = client.db(DB_NAME);
    const enquiriesCollection = db.collection('enquiries');

    // Submit enquiry
    app.post('/api/enquiry', async (req, res) => {
      try {
        const { name, email, phone, coachingType, message } = req.body;
        if (!name || !email || !phone || !coachingType || !message) {
          return res.status(400).json({ error: 'All fields are required' });
        }

        const newEnquiry = {
          name,
          email,
          phone,
          coachingType,
          message,
          timestamp: new Date(),
          status: 'new'
        };

        const result = await enquiriesCollection.insertOne(newEnquiry);
        res.status(200).json({ message: 'Enquiry submitted', id: result.insertedId });
      } catch (err) {
        console.error('Insert Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Fetch all enquiries
    app.get('/api/enquiry', async (req, res) => {
      try {
        const enquiries = await enquiriesCollection.find().sort({ timestamp: -1 }).toArray();
        res.json(enquiries);
      } catch (err) {
        console.error('Fetch Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err);
  });
