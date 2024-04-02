import connectToMongoDB from '@/lib/mongodb';
import { updateAuctionStatus } from '@/utils/auctionScraper';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await connectToMongoDB();
    console.log('MongoDB connected successfully');

    await updateAuctionStatus();

    return NextResponse.json({ message: 'Update Auction Status function executed successfully' });
  } catch (error) {
    console.error('Error executing updateAuctionStatus:', error);
    return NextResponse.json({ message: 'Error executing updateAuctionStatus', error: error.message }, { status: 500 });
  }
}
