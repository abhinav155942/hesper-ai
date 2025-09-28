import { NextResponse } from 'next/server';

export async function DELETE() {
  // Unverified user cleanup disabled: treat unverified users normally
  return NextResponse.json({
    deleted: 0,
    message: 'Unverified user cleanup disabled'
  }, { status: 200 });
}