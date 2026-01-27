import { NextRequest, NextResponse } from 'next/server';
import { searchRecipes } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const suggestions = await searchRecipes(query);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Recipe search error:', error);
    return NextResponse.json(
      { error: 'Failed to search for recipes. Make sure ANTHROPIC_API_KEY is set.' },
      { status: 500 }
    );
  }
}
