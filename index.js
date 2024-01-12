import mongoose from 'mongoose';
import express from 'express';
import * as dotenv from 'dotenv';
import { startScrapeCronJob } from './cron/scrapeCron.js';
import { startUpdateStatusCronJob } from './cron/updateStatusCron.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3060;

mongoose.connect(process.env.DB_URI);
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection has been established');

  // startScrapeCronJob();
  // startUpdateStatusCronJob();
});

app.use(express.json());

app.listen(PORT, () => console.log(`Server is up and running on Port: ${PORT}`));
