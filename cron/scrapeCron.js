import cron from 'node-cron';
import puppeteer from 'puppeteer';
import { scrapeInfiniteScrollItems, getData, outputData, website } from '../controller/scrapeController.js';

const startScrapeCronJob = () => {
  cron.schedule('32 18 * * *', async () => {
    console.log('Cron job started');

    const browser = await puppeteer.launch({ headless: 'new' });

    try {
      console.log('Starting the scraping job...');
      const page = await browser.newPage();
      await scrapeInfiniteScrollItems(page);
      await getData(website, browser);
      console.log('Scraping job finished');
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      await outputData();
      await browser.close();
      console.log('MongoDB disconnected and browser closed');
    }
  });
};

export { startScrapeCronJob };
