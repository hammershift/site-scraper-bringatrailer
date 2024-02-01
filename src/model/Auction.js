import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema(
  {
    attributes: [
      {
        key: String,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    auction_id: { type: String, unique: true },
    website: String,
    image: String,
    page_url: String,
    isActive: { type: Boolean, default: true },
    views: {
      type: Number,
      default: 0,
    },
    watchers: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    description: [String],
    images_list: [Object],
    listing_details: [String],
    sort: {
      price: Number,
      bids: Number,
      deadline: Date,
    },
  },
  { timestamps: true }
);

const Auction = mongoose.models.auctions || mongoose.model('auction', auctionSchema);

export default Auction;
