import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const file = searchParams.get('file');

  if (!file) {
    return new Response('Missing file parameter', { status: 400 });
  }

  // Security: only allow files inside data/crawl_cache/
  const projectRoot = process.cwd();
  const crawlCacheDir = path.resolve(projectRoot, 'data', 'crawl_cache');
  const requestedPath = path.resolve(projectRoot, file);

  if (!requestedPath.startsWith(crawlCacheDir)) {
    return new Response('Access denied', { status: 403 });
  }

  if (!fs.existsSync(requestedPath)) {
    return new Response('File not found', { status: 404 });
  }

  const content = fs.readFileSync(requestedPath, 'utf-8');
  return new Response(content, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
