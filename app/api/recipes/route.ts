import { NextRequest, NextResponse } from 'next/server';
import { getFavorites, addToFavorites, removeFromFavorites, updateFavorite } from '@/lib/recipes';

export async function GET() {
  const favorites = await getFavorites();
  return NextResponse.json(favorites);
}

export async function POST(request: NextRequest) {
  const recipe = await request.json();
  const saved = await addToFavorites(recipe);
  return NextResponse.json(saved);
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const body = await request.json();
  const recipe = await updateFavorite(id, body);
  if (!recipe) {
    return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
  }
  return NextResponse.json(recipe);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const success = await removeFromFavorites(id);
  if (!success) {
    return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
