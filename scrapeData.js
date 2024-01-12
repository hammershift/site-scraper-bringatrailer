import { getData } from './controllers/scrapeController.js';
import puppeteer from 'puppeteer';

const run = async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    await getData('https://bringatrailer.com/auctions/', browser);
  } finally {
    await browser.close();
  }
};

run();
