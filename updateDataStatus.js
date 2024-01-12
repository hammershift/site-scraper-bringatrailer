import puppeteer from 'puppeteer';
import checkAndUpdateAuctionStatus from './controller/updateStatusController.js';

const run = async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    await checkAndUpdateAuctionStatus(browser);
  } catch (error) {
    await browser.close();
  }
};
