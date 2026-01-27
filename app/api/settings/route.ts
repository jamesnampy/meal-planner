import { NextRequest, NextResponse } from 'next/server';
import { getSettings, addExclusion, removeExclusion, saveSettings } from '@/lib/settings';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const { exclusion } = await request.json();

  if (!exclusion || typeof exclusion !== 'string') {
    return NextResponse.json({ error: 'Exclusion is required' }, { status: 400 });
  }

  const settings = await addExclusion(exclusion);
  return NextResponse.json(settings);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exclusion = searchParams.get('exclusion');

  if (!exclusion) {
    return NextResponse.json({ error: 'Exclusion is required' }, { status: 400 });
  }

  const settings = await removeExclusion(exclusion);
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const settings = await request.json();
  await saveSettings(settings);
  return NextResponse.json(settings);
}
