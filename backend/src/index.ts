import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import recipeRoutes from './routes/recipeRoutes'; // ✅ Make sure the path is correct

const app = express();
const PORT = 3000;
const MONGO_URI = 'mongodb://localhost:27017/sveltecrud'; // or use your actual connection string

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/recipes', recipeRoutes); // ✅ This enables /recipes endpoint

// Mongo connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});