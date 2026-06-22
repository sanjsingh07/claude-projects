import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`- SerpApi Key: ${process.env.SERPAPI_KEY ? 'LOADED' : 'MISSING'}`);
  console.log(`- Google Vision Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
});
