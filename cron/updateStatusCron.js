import cron from 'node-cron';
import puppeteer from 'puppeteer';
import checkAndUpdateAuctionStatus from '../controller/updateStatusController.js';

const startUpdateStatusCronJob = () => {
  cron.schedule('46 18 * * *', async () => {
    console.log('Starting status update job...');
    const browser = await puppeteer.launch({ headless: 'new' });

    try {
      await checkAndUpdateAuctionStatus(browser);
      console.log('Status update job finished');
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      await browser.close();
    }
  });
};

export { startUpdateStatusCronJob };
