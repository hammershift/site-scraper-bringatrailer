import connectToMongoDB from '../../../lib/mongodb';
import scrapeAuctions from '../../../utils/auctionScraper';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req) {
    try {
      await connectToMongoDB();
      console.log('MongoDB connected successfully');
  
      await scrapeAuctions();
  
      return NextResponse.json({ message: 'Cron job triggered and scrapeAuctions function executed successfully' });
    } catch (error) {
      console.error('Error triggering cron job:', error);
      return NextResponse.json({ message: 'Error triggering cron job', error: error.message }, { status: 500 });
    }
  }
