const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();
const path = require("path");
const os = require("os");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// MongoDB connection URI
const mongoURI = "mongodb+srv://zzayir21:rifah5657@cluster21.7c8bhzd.mongodb.net/loginDB?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
  
  
const userSchema = new mongoose.Schema({
  username: String,
  mobileNumber: String,
});

const User = mongoose.model('User', userSchema);

// 📲 Endpoint to trigger SMS with link
app.post('/send-nfc-link', async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.status(404).json({ message: 'User not found' });

  try {
    const msg = await client.messages.create({
      body: 'Click to scan NFC tag: https://yourdomain.com/app.html',
      from: process.env.TWILIO_NUMBER,
      to: user.mobileNumber,
    });

    res.json({ message: 'Link sent to mobile number' });
  } catch (error) {
    res.status(500).json({ message: 'SMS failed', error });
  }
});

// 📥 Receive NFC scan data
app.post('/receive-nfc-data', (req, res) => {
  const { serial, data } = req.body;

  console.log(`Serial Number: ${serial}`);
  console.log(`NFC Data: ${data}`);

  // Proceed with validation or authentication
  res.json({ message: 'NFC data received' });
});

function getLocalIP() {
  try {
    const interfaces = os.networkInterfaces();
    for (let name in interfaces) {
      for (let iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
    return "localhost";
  } catch (err) {
    console.error("Error getting local IP:", err);
    return "localhost";
  }
}

const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, "0.0.0.0", () => {
  const localIP = getLocalIP();
  console.log(`\n✅ Server running at:`);
  console.log(`👉 PC:     http://localhost:${PORT}`);
  console.log(`👉 Mobile: http://${localIP}:${PORT}\n`);
});
