const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(express.json());

mongoose.connect('mongodb+srv://chinomsochristian03:ahYZxLh5loYrfgss@cluster0.dmkcl.mongodb.net/crimelog?retryWrites=true&w=majority');

const db = mongoose.connection;

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
});

const User = mongoose.model('User', userSchema);

cloudinary.config({
  cloud_name: 'df2q6gyuq',
  api_key: '259936754944698',
  api_secret: 'bTfV4_taJPd1zxxk1KJADTL8JdU',
});


db.on('error', (err) => {
  console.error(err);
});

db.once('open', async () => {
  console.log('Connected to MongoDB');

  // const admin = new User({
  //   username: 'administrator',
  //   password: await bcrypt.hash('password', 10), // hash the password
  //   role: 'admin'
  // });

  // async function seedAdmin() {
  //   try {
  //     const existingAdmin = await User.findOne({ username: 'administrator' });
  //     if (existingAdmin) {
  //       console.log('Admin user already exists');
  //     } else {
  //       await admin.save();
  //       console.log('Admin user seeded successfully');
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
  // await seedAdmin();
});

app.set('view engine', 'ejs');
app.use(express.static('public'));


// Render Home Page
app.get('/', (req, res) => {
  res.render('index');
});
// Render View Report Page
app.get('/report', (req, res) => {
  res.render('report');
});
// Render Login Page
app.get('/adminLogin', (req, res) => {
  res.render('adminlogin');
});
// Render View Admin Report Page
app.get('/admin', (req, res) => {
  res.render('admin');
});
// Render View Report Detail Page
app.get('/detail', (req, res) => {
  res.render('detail');
});
// Render Upload Report Page for Student
app.get('/form', (req, res) => {
  res.render('form');
});
// Render Upload Report Page for Admin
app.get('/adminform', (req, res) => {
  res.render('adminform');
});


const incidentSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  category: String,
  content: String,
  status: String,
  studentStatus: String,
  reportedBy: String
});

const Incident = mongoose.model('Incident', incidentSchema);

const authenticate = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, "futoshield");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send({ message: 'Invalid token.' });
  }
};



// STUDENT ROUTES
app.post('/student/report-incident', async (req, res) => {
  const { title, description, image, category, content } = req.body;
  if (!title || !description || !content || !image || !category) {
    return res.json({ message: "Please, all fields are required" });
  }
  const incident = new Incident({
    title,
    description,
    image,
    category,
    content,
    status: 'Pending',
    studentStatus: '',
    reportedBy: 'Anonymous'
  });
  try {
    await incident.save();
    return res.send({ message: 'Incident reported successfully' });
  } catch (err) {
    return res.status(500).send({ message: 'Error reporting incident' });
  }
});

app.get('/student/incidents', async (req, res) => {
  try {
    const incidents = await Incident.find({ studentStatus: { $in: ['Unverified', 'Verified'] } });
    res.send(incidents);
  } catch (err) {
    res.status(500).send({ message: 'Error fetching incidents' });
  }
});

app.get('/student/incident/:id', async (req, res) => {
  const incidentId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(incidentId)) {
    return res.status(400).send({ message: 'Invalid incident ID' });
  }
  try {
    const incident = await Incident.findById(incidentId);
    if (!incident) {
      return res.status(404).send({ message: 'Incident not found' });
    }
    return res.send(incident);
  } catch (err) {
    return res.status(500).send({ message: 'Error fetching incident' });
  }
});




// ADMIN ROUTES

// Create a login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send({ message: 'Invalid username or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).send({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username,  role: user.role }, "futoshield", { expiresIn: '1h' });
    res.send({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error logging in' });
  }
});

app.post('/admin/report-incident', authenticate, async (req, res) => {
  const { title, description, image, category, content } = req.body;
  if (!title || !description || !content || !image || !category) {
    return res.json({ message: "Please, all fields are required" });
  }

  const incident = new Incident({
    title,
    description,
    image,
    category,
    content,
    status: 'Verified',
    studentStatus: 'Verified',
    reportedBy: req.user.username
  });
  try {
    await incident.save();
    return res.send({ message: 'Incident reported and verified successfully' });
  } catch (err) {
    return res.status(500).send({ message: 'Error reporting incident' });
  }
});

app.get('/admin/incidents', authenticate, async (req, res) => {
  try {
    const incidents = await Incident.find();
    res.send(incidents);
  } catch (err) {
    res.status(500).send({ message: 'Error fetching incidents' });
  }
});

app.post('/admin/approve-incident', authenticate, async (req, res) => {
  const { incidentId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(incidentId)) {
    return res.status(400).send({ message: 'Invalid incident ID' });
  }
  try {
    const incident = await Incident.findByIdAndUpdate(incidentId, { status: 'Unverified', studentStatus: 'Unverified' }, { new: true });
    if (!incident) {
      return res.status(404).send({ message: 'Incident not found' });
    }
    return res.send({ message: 'Incident approved successfully', incident });
  } catch (err) {
    return res.status(500).send({ message: 'Error approving incident' });
  }
});

app.post('/admin/verify-incident', authenticate, async (req, res) => {
  const { incidentId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(incidentId)) {
    return res.status(400).send({ message: 'Invalid incident ID' });
  }
  try {
    const incident = await Incident.findByIdAndUpdate(incidentId, { status: 'Verified', studentStatus: 'Verified' }, { new: true });
    if (!incident) {
      return res.status(404).send({ message: 'Incident not found' });
    }
    return res.send({ message: 'Incident verified successfully', incident });
  } catch (err) {
    return res.status(500).send({ message: 'Error verifying incident' });
  }
});

app.post('/admin/unapprove-incident', authenticate, async (req, res) => {
  const { incidentId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(incidentId)) {
    return res.status(400).send({ message: 'Invalid incident ID' });
  }
  try {
    const incident = await Incident.findByIdAndUpdate(incidentId, { status: 'Pending', studentStatus: '' }, { new: true });
    if (!incident) {
      return res.status(404).send({ message: 'Incident not found' });
    }
    return res.send({ message: 'Incident unapproved successfully', incident });
  } catch (err) {
    return res.status(500).send({ message: 'Error unapproving incident' });
  }
});

app.post('/admin/unverify-incident', authenticate, async (req, res) => {
  const { incidentId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(incidentId)) {
    return res.status(400).send({ message: 'Invalid incident ID' });
  }
  try {
    const incident = await Incident.findByIdAndUpdate(incidentId, { status: 'Unverified', studentStatus: 'Unverified' }, { new: true });
    if (!incident) {
      return res.status(404).send({ message: 'Incident not found' });
    }
    return res.send({ message: 'Incident unverified successfully', incident });
  } catch (err) {
    return res.status(500).send({ message: 'Error unverifying incident' });
  }
});

app.post('/admin/delete-incident', authenticate, async (req, res) => {
  const { incidentId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(incidentId)) {
    return res.status(400).send({ message: 'Invalid incident ID' });
  }
  try {
    await Incident.findByIdAndDelete(incidentId);
    return res.send({ message: 'Incident deleted successfully' });
  } catch (err) {
    return res.status(500).send({ message: 'Error deleting incident' });
  }
});

app.get('/admin/incident/:id', authenticate, async (req, res) => {
  const incidentId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(incidentId)) {
    return res.status(400).send({ message: 'Invalid incident ID' });
  }
  try {
    const incident = await Incident.findById(incidentId);
    if (!incident) {
      return res.status(404).send({ message: 'Incident not found' });
    }
    return res.send(incident);
  } catch (err) {
    return res.status(500).send({ message: 'Error fetching incident' });
  }
});



const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

