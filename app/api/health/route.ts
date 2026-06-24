// Health check endpoint for Docker / Vercel / monitoring
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}