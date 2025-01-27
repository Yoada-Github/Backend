import express from 'express';
import cors from 'cors'; // Import CORS
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import connectDB from './config.js';
import User from '../backend/models/UserModels.js'
import Book from '../backend/models/bookModels.js'
// Load environment variables
dotenv.config();

// Initialize Express app
connectDB();

const app = express();
const PORT = process.env.PORT ||5001; 

const users = [];

const JWT_SECRET = process.env.JWT_SECRET;

// Use CORS middleware (allow all origins for now, but restrict it in production)
app.use(cors());

app.use(express.json());


// Home route (can be omitted if not needed)
app.get('/', (req, res) => {
  res.send('Welcome to the Book API');
});

// Fetch all books
app.get('/books/:userId', async (req, res) => {

const {userId} = req.params
  
  try {
    const books = await Book.find({user: userId});

     console.log(books)
    return res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Fetch a single book by ID
app.get('/books/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {userId} = req.query
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if(book.user.toString() != userId  ){
      return res.status(404).json({ message: 'Invalid user id' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching the book:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Fetch a single book by ID
app.get('/books/details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {userId} = req.query;
    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching the book:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Create a new book
app.post('/books/', async (req, res) => {
  try {
    const { title, author, publishYear, userId } = req.body;

    // console.log(req)
    console.log(title, author, publishYear, userId)

    // Validation for required fields
    if (!title || !author || !publishYear) {
      return res.status(400).json({
        message: 'Please provide all required fields: title, author, and publishYear.',});
    }

    const book = new  Book({ title, author, publishYear, user: userId });
    await book.save()
    return res.status(201).json(book);
  } catch (error) {
    console.error('Error creating book:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Update a book by ID
app.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { title, author, publishYear } = req.body;
    console.log(req)

    const book = await Book.findByIdAndUpdate (
      id, {
        title: title,
        author: author,
        publishYear: publishYear
      });

    

    console.log(book)

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('Error updating the book:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { username, email, password } = req.body;

  console.log(await User.find())
  console.log(username, email, password)
  if ((!username && !email) || !password) {
    return res.status(400).json({ message: "Username/email and password are required" });
  }

  try {
    // Find user by username or email
    const user = await User.findOne({
     username: username
    });

    console.log(user)

    if (!user) {
      return res.status(400).json({ message: "Invalid username/email or password" });
    }

      // // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      // const isPasswordValid = password === user.password
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid username/email or password" });
      }

    // Generate token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });


    res.json({
      message: "Login successful",
      username: user.username,
      token,
      userId: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Signup Endpoint
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check for existing user
    if (users.some((user) => user.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }


    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    users.push({ username, email, password: hashedPassword });

    const token = jwt.sign({ username, email }, 'secret_key', { expiresIn: '1h' });

    const newUser = new User({username: username, email: email, password: hashedPassword})
    console.log(newUser)
    await newUser.save()

    res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



// Delete a book by ID
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByIdAndDelete(id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting the book:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Connect to the database and start the server
const startServer = async () => {
  try {
    await connectDB(); // Connect to MongoDB
    const PORT = process.env.PORT || 5001;

    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('Environment:', process.env.NODE_ENV || 'development');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start the server:', error.message);
    process.exit(1);
  }
};

startServer();





