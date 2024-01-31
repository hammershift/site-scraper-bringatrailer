import connectToMongoDB from '../../../lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  try {
    await connectToMongoDB();
    console.log('MongoDB connected successfully');
    return NextResponse.json({ message: 'MongoDB connected successfully' });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({ message: 'Failed to connect to MongoDB', error: error.message }, { status: 500 });
  }
}
