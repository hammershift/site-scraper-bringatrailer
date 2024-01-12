const website = 'https://bringatrailer.com/auctions/';
const batchSize = 20;

let currentAuctionData = [];
let auctionURLList = [];

// for the dynamic scrolling of the webpage
const scrapeInfiniteScrollItems = async (page) => {
  while (true) {
    const previousHeight = await page.evaluate('document.body.scrollHeight');
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForTimeout(1000);
    const newHeight = await page.evaluate('document.body.scrollHeight');

    // break and exit the loop if the page height did not change
    if (newHeight === previousHeight) {
      break;
    }
  }
};

const getData = async (url, browser) => {
  const page = await browser.newPage();
  await page.goto(url);
  await scrapeInfiniteScrollItems(page);

  const currentAuction = await page.$$eval('a.listing-card.bg-white-transparent', (auctions) => {
    return auctions.map((auction) => {
      const url = auction.href;
      return { url };
    });
  });

  auctionURLList.push(...currentAuction);

  // process the data in batches
  for (let i = 0; i < auctionURLList.length; i += batchSize) {
    const batch = auctionURLList.slice(i, i + batchSize);
    console.log(`Processing auctions ${i + 1} to ${i + batch.length} out of ${auctionURLList.length}`);

    // iterate through each auction URL and extract data
    for (const auction of batch) {
      await getDataFromPage(auction.url, browser);
    }
  }

  await page.close();
  outputData();
};

const getDataFromPage = async (url, browser) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });

  // TEST IMPLEMENTATION: Detect auction status
  const currentStatus = await page.evaluate(() => {
    const AuctionStatusEnum = {
      Live: 1,
      Completed: 2,
    };

    const availableInfo = document.querySelector('.listing-available-info');
    if (!availableInfo) return null;

    if (availableInfo.innerHTML.includes('Sold for')) {
      return AuctionStatusEnum.Completed;
    }
    return AuctionStatusEnum.Live;
  });

  // extract data from the page
  try {
    const title = await page.$$eval('h1.post-title.listing-post-title', (titleElements) => {
      if (titleElements.length === 0) {
        throw new Error('Title element not found');
      }
      return titleElements[0].textContent.trim();
    });

    const titleArray = title.split(' ');

    let year;
    let make;
    let model;

    const REGEX = /[a-zA-Z]/;
    if (REGEX.test(titleArray[0])) {
      if (REGEX.test(titleArray[1])) {
        if (REGEX.test(titleArray[2])) {
          year = titleArray[3];
          make = titleArray[4];
          model = titleArray.slice(5).join(' ');
        } else {
          year = titleArray[2];
          make = titleArray[3];
          model = titleArray.slice(4).join(' ');
        }
      } else {
        year = titleArray[1];
        make = titleArray[2];
        model = titleArray.slice(3).join(' ');
      }
    } else {
      year = titleArray[0];
      make = titleArray[1];
      model = titleArray.slice(2).join(' ');
    }

    // price
    const price = await page.$eval('strong.info-value', (priceElement) => {
      return Number(priceElement.textContent.replace(/[$,]/g, ''));
    });

    // bids
    const bids = await page.$eval('.listing-stats-value.number-bids-value', (element) => {
      return parseInt(element.textContent);
    });

    // extract auction deadline
    const deadlineTimestamp = await page.$eval('.listing-available-countdown', (element) => element.getAttribute('data-until'));
    const deadline = new Date(deadlineTimestamp * 1000);

    // get the car category
    const categoryArray = await page.$$eval('div.group-item-wrap', (wraps) =>
      wraps.reduce((acc, wrap) => {
        const title = wrap.querySelector('button.group-title');
        if (title && title.textContent.includes('Category')) {
          acc.push(title.textContent.split('Category')[1].trim());
        }
        return acc;
      }, [])
    );

    let category = categoryArray.join(', ');
    if (!category || category.trim() === '') {
      category = 'Others';
    }

    // get the car era
    const eraArray = await page.$$eval('div.group-item-wrap', (wraps) =>
      wraps.reduce((acc, wrap) => {
        const title = wrap.querySelector('button.group-title');
        if (title && title.textContent.includes('Era')) {
          acc.push(title.textContent.split('Era')[1].trim());
        }
        return acc;
      }, [])
    );

    const era = eraArray.join(', ');

    // image
    const imgSelector = 'div.listing-intro-image.column-limited-width-full-mobile > img';
    // this is to wait for the image to load using waitForFunction
    await page.waitForFunction(
      (sel) => {
        const image = document.querySelector(sel);
        return image && image.complete && image.naturalHeight !== 0;
      },
      {},
      imgSelector
    );
    // get the image URL
    const imgUrl = await page.$eval(imgSelector, (img) => img.src);

    // car specifications

    // auctionId
    // const auction_id = await page.$eval('body > main > div > div.listing-intro', (intro) => intro.getAttribute('data-listing-intro-id')).toString();
    const auction_id = (await page.$eval('body > main > div > div.listing-intro', (intro) => intro.getAttribute('data-listing-intro-id'))).toString();

    // lot_num
    const lot_num = await page.$eval('body > main > div > div:nth-child(3) > div.column.column-right.column-right-force > div.essentials', (element) => {
      const lotElement = Array.from(element.querySelectorAll('div.item')).find((item) => item.textContent.includes('Lot #'));
      const match = lotElement ? lotElement.textContent.trim().match(/Lot #(\d+)/) : null;
      return match ? match[1] : '';
    });
    const chassis = await page.$eval(
      'body > main > div > div:nth-child(3) > div.column.column-right.column-right-force > div.essentials > div:nth-child(5) > ul > li:nth-child(1) > a',
      (element) => element?.textContent || ''
    );
    const seller = await page.$eval(
      'body > main > div > div:nth-child(3) > div.column.column-right.column-right-force > div.essentials > div.item.item-seller > strong + a',
      (element) => element.textContent
    );

    // location
    const location = await page.$eval('div.essentials > a[href^="https://www.google.com/maps/place/"]', (element) => element.textContent);

    // state
    const extractState = (location) => {
      const array = location.split(', ');
      const stateWithZipCode = array[array.length - 1];
      const state = stateWithZipCode.replace(/\d+/g, '').trim();
      return state;
    };

    const state = extractState(location);

    // description
    const descriptionText = await page.$$('body > main > div > div:nth-child(3) > div.column.column-left > div > div.post-excerpt > p');
    const description = [];
    const images_list = [];
    let placing = 0;

    for (const element of descriptionText) {
      const excerpt = await page.evaluate((el) => el.textContent.trim(), element);

      if (excerpt !== '' && excerpt !== undefined) {
        description.push(excerpt);
      } else {
        // check if the element contains an image
        const imgElement = await element.$('img');
        if (imgElement) {
          const imgUrl = await page.evaluate((img) => img.getAttribute('src'), imgElement);
          if (imgUrl !== '' && imgUrl !== undefined) {
            placing += 1;
            const imgUrlClean = imgUrl.split('?')[0];
            images_list.push({ placing, src: imgUrlClean });
          }
        }
      }
    }

    // listing type
    const dealer = await page.$eval('body > main > div > div:nth-child(3) > div.column.column-right.column-right-force > div.essentials > div.item.additional', (element) =>
      element.textContent.trim()
    );

    let listing_type;
    if (dealer) {
      listing_type = 'Private Property';
    }

    const list = await page.$$('body > main > div > div:nth-child(3) > div.column.column-right.column-right-force > div.essentials > div:nth-child(5) > ul > li');
    const listing_details = [];

    for (const element of list) {
      const detail = await page.evaluate((el) => el.textContent.trim(), element);
      listing_details.push(detail);
    }

    let attributes = [];

    attributes.push({ key: 'price', value: price });
    attributes.push({ key: 'year', value: year });
    attributes.push({ key: 'make', value: make });
    attributes.push({ key: 'model', value: model });
    attributes.push({ key: 'category', value: category });
    attributes.push({ key: 'era', value: era });
    attributes.push({ key: 'chassis', value: chassis });
    attributes.push({ key: 'seller', value: seller });
    attributes.push({ key: 'location', value: location });
    attributes.push({ key: 'state', value: state });
    attributes.push({ key: 'lot_num', value: lot_num });
    attributes.push({ key: 'listing_type', value: listing_type });
    attributes.push({ key: 'deadline', value: deadline });
    attributes.push({ key: 'bids', value: bids });
    attributes.push({ key: 'status', value: currentStatus });

    const filteredDescription = description.filter((item) => item.trim() !== '');
    const filteredImagesList = images_list.filter((item) => item.src && item.src.trim() !== '');
    const filteredListingDetails = listing_details.filter((item) => item.trim() !== '');

    const extractedData = {
      auction_id,
      website: 'Bring A Trailer',
      image: imgUrl,
      description: filteredDescription,
      images_list: filteredImagesList,
      listing_details: filteredListingDetails,
      page_url: url,
      isActive: true,
      attributes,
      sort: {
        price: price,
        bids: bids,
        deadline: deadline,
      },
    };

    const requiredAttributeKeys = [
      'price',
      'year',
      'make',
      'model',
      'category',
      'era',
      'chassis',
      'seller',
      'location',
      'state',
      'lot_num',
      'listing_type',
      'deadline',
      'bids',
      'status',
    ];

    const hasAllRequiredAttributes = requiredAttributeKeys.every((key) => attributes.some((attr) => attr.key === key));

    // check if all required fields are not null and not undefined
    const hasOtherRequiredFields =
      extractedData.auction_id &&
      extractedData.website &&
      extractedData.description.length > 0 &&
      extractedData.images_list.length > 0 &&
      extractedData.listing_details.length > 0 &&
      extractedData.page_url;
    // final check before adding to currentAuctionData
    if (hasAllRequiredAttributes && hasOtherRequiredFields) {
      currentAuctionData.push(extractedData);
    } else {
      console.error(`Missing required fields for auction at URL: ${url}`);
    }
  } catch (error) {
    console.error(`Error processing auction at URL: ${url}`, error);
  } finally {
    await page.close();
  }
};

const outputData = async () => {
  // save to MongoDB
  for (const item of currentAuctionData) {
    try {
      const existingAuction = await Auction.findOne({ auction_id: item.auction_id });

      if (existingAuction) {
        // update both attributes and sorting fields
        const updatedAttributes = existingAuction.attributes.map((attr) => {
          if (attr.key === 'price') attr.value = item.sort.price;
          if (attr.key === 'bids') attr.value = item.sort.bids;
          if (attr.key === 'deadline') attr.value = item.sort.deadline;
          // add more fields if necessary
          return attr;
        });

        await Auction.updateOne({ auction_id: item.auction_id }, { $set: { attributes: updatedAttributes, sort: item.sort } });
        console.log(`Updated auction with ID ${item.auction_id}`);
      } else {
        await Auction.create(item);
        console.log(`Inserted new auction with ID ${item.auction_id}`);
      }
    } catch (error) {
      console.error(`Error processing auction with ID ${item.auction_id}: ${error}`);
    }
  }
};

export { scrapeInfiniteScrollItems, getData, getDataFromPage, outputData, currentAuctionData, auctionURLList, website, batchSize };
