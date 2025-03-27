import express from "express";
import { configDotenv } from "dotenv";
import mysql from "mysql2/promise";
configDotenv();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

//Database Connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test database connection 
const testConnection = async () => {
  try {
    const connection = await db.getConnection(); 
    console.log("Database connected successfully!");
    connection.release(); // Release the connection when done
  } catch (err) {
    console.error("Error connecting to database:", err.message);
  }
};

// Call the function to test the connection
testConnection();



// Get books API
app.get("/books", async (req, res) => {
  const query = "SELECT * FROM books";
  try {
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching books:", err.message);
    res.status(500).json({ error: "Failed to fetch books data" });
  }
});

// Get a single book API
app.get("/books/:id", async (req, res)=>{
    try{
        const query = 'SELECT * FROM books WHERE bookID = ?'
        const { id } = req.params;
        const [rows] = await db.query(query, id)
        if (rows[0] === undefined) res.json("No Book Found")
        res.json(rows[0]);

    }catch(err){
        console.error("Error fetching book:", err.message);
        res.status(500).json({ error: "Failed to fetch book data" });
    }
})

// Add a new book API
app.post("/books/", async (req, res)=>{
    try{
        const {Title, AuthorID, GenreID, Pages, PublishedDate} = req.body;
        const query = 'INSERT INTO books(Title, AuthorID, GenreID, Pages, PublishedDate) VALUES(?,?,?,?,?)';
        const [result] = await db.query(query,[Title, AuthorID, GenreID, Pages, PublishedDate]);
        res.json({ message: "Book added successfully", bookID: result.insertId });

    }catch(err){
        console.error("Error adding book:", err.message);
        res.status(500).json({ error: "Failed to add book" });
    }
}) 

// Update book API
app.put("/books/:id", async (req, res) => {
    const { id } = req.params;
    const { Title, AuthorID, GenreID, Pages, PublishedDate } = req.body;

    try {
        // First, check if the book exists
        const checkQuery = 'SELECT * FROM books WHERE bookID = ?';
        const [checkResult] = await db.query(checkQuery, [id]);

        if (checkResult.length === 0) {
            // If no book is found, return a "Book not found" response
            return res.status(404).json({ error: "Book not found" });
        }

        // If the book is found, proceed to update it
        const updateQuery = 'UPDATE books SET Title = ?, AuthorID = ?, GenreID = ?, Pages = ?, PublishedDate = ? WHERE bookID = ?';
        await db.query(updateQuery, [Title, AuthorID, GenreID, Pages, PublishedDate, id]);

        // Send success response
        res.json({ message: "Book updated successfully", bookID: id });

    } catch (err) {
        console.error("Error updating book:", err.message);
        res.status(500).json({ error: "Failed to update book" });
    }
});

//delete book API

app.delete("/books/:id", async (req, res)=>{
    const {id} = req.params;
    
    try{
      // First, check if the book exists
      const checkQuery = 'SELECT * FROM books WHERE bookID = ?';
      const [checkResult] = await db.query(checkQuery, [id]);
      
      if (checkResult.length === 0) {
        // If no book is found, return a "Book not found" response
        return res.status(404).json({ error: `Book not found with id: ${id}` });
      }

        // if book found then execute delete query 
        const deleteQuery = 'DELETE FROM books WHERE bookID = ?'
        await db.query(deleteQuery,[id])
        res.json({ message: "Book deleted successfully", bookID: id});
    }catch(err){
        console.error("Error deleting book:", err.message);
        res.status(500).json({ error: "Failed to delete book" });
    }

})

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});