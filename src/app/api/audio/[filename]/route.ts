import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filePath = path.join(process.cwd(), 'src', 'assets', 'audio', filename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileStream = fs.createReadStream(filePath);

  return new NextResponse(fileStream as any, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': stat.size.toString(),
      'Accept-Ranges': 'bytes',
    },
  });
}
