import puppeteer from 'puppeteer';
import Auction from '../model/Auction.js';

const checkAndUpdateAuctionStatus = async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  const liveAuctions = await Auction.find({ attributes: { $elemMatch: { key: 'status', value: 1 } } });
  console.log(`Checking status of ${liveAuctions.length} live auctions`);

  for (const auction of liveAuctions) {
    if (!auction.page_url || typeof auction.page_url !== 'string') {
      console.error(`Invalid URL for auctionID: ${auction.auction_id}`);
      continue;
    }

    console.log(`Checking auction at URL: ${auction.page_url}`);
    const page = await browser.newPage();
    try {
      await page.goto(auction.page_url, { waitUntil: 'networkidle0', timeout: 90000 });

      const currentStatus = await page.evaluate(() => {
        const AuctionStatusEnum = {
          Live: 1,
          Completed: 2,
          Unsuccessful: 3,
        };

        const availableInfo = document.querySelector('.listing-available-info');
        if (!availableInfo) return AuctionStatusEnum.Live;
        if (availableInfo.innerHTML.includes('Sold for')) {
          return AuctionStatusEnum.Completed;
        } else if (availableInfo.innerHTML.includes('Bid to') || availableInfo.innerHTML.includes('Withdrawn on')) {
          return AuctionStatusEnum.Unsuccessful;
        }
        return AuctionStatusEnum.Live;
      });

      // update the auction status if it has changed
      if (currentStatus !== 1) {
        await Auction.updateOne({ _id: auction._id, 'attributes.key': 'status' }, { $set: { 'attributes.$.value': currentStatus } });
        console.log(`Updated status for auctionID: ${auction.auction_id}`);
      }
    } catch (error) {
      console.error(`Error processing auctionID: ${auction.auction_id}`, error);
    } finally {
      await page.close();
    }
  }

  await browser.close();
};

export default checkAndUpdateAuctionStatus;
