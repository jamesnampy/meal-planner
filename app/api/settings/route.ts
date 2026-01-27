import { NextRequest, NextResponse } from 'next/server';
import {
  getSettings,
  addExclusion,
  removeExclusion,
  saveSettings,
  addRecipeWebsite,
  removeRecipeWebsite,
  updateAiContext,
  setPreferredCuisines,
} from '@/lib/settings';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Handle exclusion addition
  if (body.exclusion && typeof body.exclusion === 'string') {
    const settings = await addExclusion(body.exclusion);
    return NextResponse.json(settings);
  }

  // Handle recipe website addition
  if (body.recipeWebsite && typeof body.recipeWebsite === 'string') {
    const settings = await addRecipeWebsite(body.recipeWebsite);
    return NextResponse.json(settings);
  }

  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exclusion = searchParams.get('exclusion');
  const recipeWebsite = searchParams.get('recipeWebsite');

  if (exclusion) {
    const settings = await removeExclusion(exclusion);
    return NextResponse.json(settings);
  }

  if (recipeWebsite) {
    const settings = await removeRecipeWebsite(recipeWebsite);
    return NextResponse.json(settings);
  }

  return NextResponse.json({ error: 'Exclusion or recipeWebsite is required' }, { status: 400 });
}

export async function PUT(request: NextRequest) {
  const settings = await request.json();
  await saveSettings(settings);
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  // Handle AI context update
  if (body.aiContext) {
    const settings = await updateAiContext(body.aiContext);
    return NextResponse.json(settings);
  }

  // Handle preferred cuisines update
  if (body.preferredCuisines) {
    const settings = await setPreferredCuisines(body.preferredCuisines);
    return NextResponse.json(settings);
  }

  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
}
