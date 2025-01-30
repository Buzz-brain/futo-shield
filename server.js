const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb+srv://chinomsochristian03:ahYZxLh5loYrfgss@cluster0.dmkcl.mongodb.net/futoshield?retryWrites=true&w=majority')
.then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));
const app = express();
app.use(express.json());

app.set('view engine', 'ejs');
app.use(express.static('public'));


// Home Route
app.get('/', (req, res) => {
  res.render('index');
});
// Home Route
app.get('/admin', (req, res) => {
  res.render('admin');
});
// Render Register Page
app.get('/login', (req, res) => {
  res.render('login');
});
app.get('/category', (req, res) => {
  res.render('category');
});
app.get('/categorypage', (req, res) => {
  res.render('categorypage');
});
app.get('/addcases', (req, res) => {
  res.render('addcases');
});
app.get('/cases', (req, res) => {
  res.render('cases');
});
app.get('/assault', (req, res) => {
  res.render('assault');
});






const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
});

const User = mongoose.model('User', userSchema);

app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, role: 'admin' });
    if (!user) {
      return res.status(401).send('Invalid username or password');
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).send('Invalid username or password');
    }
    res.json({ message: 'Admin logged in successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error logging in admin');
  }
});















// Category schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true }
});

const Category = mongoose.model('Category', categorySchema);

// Add category route
app.post('/admin/add-category', async (req, res) => {
  try {
    const { name } = req.body;
    const category = new Category({ name });
    await category.save();
    res.json({ message: 'Category added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding category' });
  }
});

// Get all categories route
app.get('/admin/categories', async (req, res) => {
try {
const categories = await Category.find().select('name _id');
res.json(categories);
} catch (error) {
console.error(error);
res.status(500).json({ message: 'Error fetching categories' });
}
});

// Delete category route
app.delete('/admin/categories/:categoryId', async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      await Category.findByIdAndDelete(categoryId);
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting category' });
    }
  });

  // Edit category route
app.patch('/admin/categories/:categoryId', async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      const categoryName = req.body.name;
      await Category.findByIdAndUpdate(categoryId, { name: categoryName });
      res.json({ message: 'Category updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating category' });
    }
  });
  










  
  const cloudinary = require('cloudinary').v2;
  const multer = require('multer');
  
  // Cloudinary Configuration
  cloudinary.config({
    cloud_name: 'dsa52qglg',
    api_key: '125695734879238',
    api_secret: 'mYMXs3rKWarJHd8_bQ7dWyqyWD8',
  });
  
  // Multer Configuration
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },  
  });
  const upload = multer({ storage: storage });
  
  // Report schema
  const reportSchema = new mongoose.Schema({
    image: { type: String, required: true },
    briefDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    topic: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    createdAt: { type: Date, default: Date.now },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
  });
  const Report = mongoose.model('Report', reportSchema);
  
  // Add report route
  app.post('/admin/reports', upload.single('image'), async (req, res) => {
    try {
      const file = req.file;
      const { briefDescription, fullDescription, topic, category } = req.body;
  
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'reports',
        resource_type: 'image',
      });
  
      // Check if all required fields are present
      if (!briefDescription || !fullDescription || !topic || !category) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const foundCategory = await Category.findById(category);
      if (!foundCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      const report = new Report({
        image: result.secure_url,
        briefDescription,
        fullDescription,
        topic,
        category
      });
      await report.save();
      res.json({ message: 'Report added successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error adding report' });
    }
  });
      













// Get reports by category route
app.get('/admin/reports/by-category/:categoryId', async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      const reports = await Report.find({ category: categoryId });
      res.json(reports);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching reports' });
    }
  });
  
  // Get all reports route
  app.get('/admin/reports', async (req, res) => {
    try {
      const reports = await Report.find();
      res.json(reports);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching reports' });
    }
  });
  

  







// Comment schema
const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
    createdAt: { type: Date, default: Date.now }
    });
    
const Comment = mongoose.model('Comment', commentSchema);


    
// Add comment route
app.post('/reports/:reportId/comments', async (req, res) => {
    try {
    const reportId = req.params.reportId;
    const text = req.body.text;
    const report = await Report.findById(reportId);
    if (!report) {
    return res.status(404).json({ message: 'Report not found' });
    }
    const comment = new Comment({ text, report: reportId });
    await comment.save();
    report.comments.push(comment._id);
    await report.save();
    res.json({ message: 'Comment added successfully' });
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding comment' });
    }
    });
    




// async function seedAdmin() {
//   try {
//     const admin = await User.findOne({ username: 'admin' });
//     if (!admin) {
//       const hashedPassword = await bcrypt.hash('1234', 10);
//       const newAdmin = new User({
//         username: 'admin',
//         password: hashedPassword,
//         email: 'admin@example.com',
//         role: 'admin'
//       });
//       await newAdmin.save();
//       console.log('Admin seeded successfully');
//     } else {
//       console.log('Admin already exists');
//     }
//   } catch (error) {
//     console.error(error);
//   }
// }

// seedAdmin();



const port = 3500;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

