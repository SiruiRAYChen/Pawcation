import cors from 'cors';
import express from 'express';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin by importing config (must be first)
import './config/firebase';

// Import the secret definition
import { geminiApiKeySecret } from './services/geminiService';

// Now import routes (they'll use the initialized admin SDK)
import { memoryRoutes } from './routes/memories';
import { petRoutes } from './routes/pets';
import { placesRoutes } from './routes/places';
import { planRoutes } from './routes/plans';
import { userRoutes } from './routes/users';

const app = express();

// Middleware
app.use(cors({ origin: true }));

// Skip JSON parsing for file upload endpoints
app.use((req, res, next) => {
  if (req.path.includes('/analyze-image')) {
    // Skip body parsing for multipart/form-data
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Pawcation API 🐾' });
});

app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/places', placesRoutes);

// Export the API as a Cloud Function with secrets
export const api = functions
  .runWith({
    secrets: [geminiApiKeySecret],
    memory: '1GB',
    timeoutSeconds: 60,
  })
  .https.onRequest(app);

// Export Firestore triggers
export * from './triggers/userTriggers';
