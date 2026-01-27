import { NextRequest, NextResponse } from 'next/server';
import { getRecipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite } from '@/lib/recipes';

export async function GET() {
  const recipes = await getRecipes();
  return NextResponse.json(recipes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const recipe = await addRecipe(body);
  return NextResponse.json(recipe);
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  if (action === 'favorite') {
    const recipe = await toggleFavorite(id);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json(recipe);
  }

  const body = await request.json();
  const recipe = await updateRecipe(id, body);
  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }
  return NextResponse.json(recipe);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const success = await deleteRecipe(id);
  if (!success) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
