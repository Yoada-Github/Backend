import express from 'express';
import bookModel from "../models/bookModels.js";


const router = express.Router();

// Route for Save a new Book
router.post('/', async (request, response) => {
  try {
    const data = request.body
    // console.log(request.body)
    if (
      !data.title ||
      !data.author ||
      !data.publishYear
    ) {
      return response.status(400).send({
        message: 'Send all required fields: title, author, publishYear',
      });
    }
    const newBook = {
      title: data.title,
      author: data.author,
      publishYear: data.publishYear,
      user: data.userId,
    };

    const book = await bookModel.create(newBook);

    return response.status(201).send(book);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});


// Fetch all books
router.get('/books/:userId', async (req, res) => {

const {userId} = req.params
  // console.log(userId)
  try {
    const books = await bookModel.find({user: userId});

     console.log(books)
    return res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.get('/books/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {userId} = req.query
    const book = await bookModel.findById(id);
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

// Route for Get One Book from database by id
router.get('/books/details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // const {userId} = req.query;
    const book = await bookModel.findById(id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching the book:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Update a book by ID
router.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { title, author, publishYear } = req.body;
    console.log(req)

    const book = await bookModel.findByIdAndUpdate (
      id, {
        title: title,
        author: author,
        publishYear: publishYear
      });

    // console.log(book)

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('Error updating the book:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Route for Delete a book
router.delete('/books/:id', async (request, response) => {
  try {
    const { id } = request.params;

    const result = await bookModel.findByIdAndDelete(id);

    if (!result) {
      return response.status(404).json({ message: 'Book not found' });
    }

    return response.status(200).send({ message: 'Book deleted successfully' });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

export default router;