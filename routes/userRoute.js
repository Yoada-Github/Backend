import express from 'express';
import User from '../models/UserModels.js'
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Function to generate a JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
      service: 'Gmail', 
      auth: {
          user: process.env.EMAIL, // Add this to your .env
          pass: process.env.EMAIL_PASSWORD, // Add this to your .env
      },
  });
  

  const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Verify your email',
      html: `<p>Click <a href="http://localhost:${process.env.PORT}/api/verify?token=${token}">here</a> to verify your email.</p>`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent successfully:", info.response);};

// Login Endpoint
router.post('/login', async (req, res) => {
  console.log('Login request received:', req.body); // Debugging
  console.log('Login request received:', req.body); // Debugging

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

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email to login' });
  }

      // // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid username/email or password" });
      }

    // Generate token
    const token = generateToken(user._id);


    res.json({
      message: "Login successful",
      username: user.username,
      token,
      email: user.email,
      userId: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Signup Endpoint
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);



    const  token = jwt.sign({ username, email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const newUser = new User({
      username, 
      email, 
      password: hashedPassword, 
      verificationToken:token,
      isEmailVerified: false,
    })
    console.log(newUser)
    await newUser.save()

    console.log("Sending verification email to:", email, "with token:", token);
    await sendVerificationEmail(email,token);

    res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// **Email Verification Endpoint**

router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Mark the user as verified
    user.isEmailVerified = true;
    user.verificationToken = null; // Remove token after verification
    await user.save();

    res.status(200).json({ message: 'Email successfully verified!' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;