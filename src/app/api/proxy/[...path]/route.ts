import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

const privateApiBaseUrl = process.env.PRIVATE_API_BASE_URL;

if (!privateApiBaseUrl) {
  throw new Error('PRIVATE_API_BASE_URL is not set in environment variables');
}

const auth = new GoogleAuth();

async function getAuthenticatedClient() {
  try {
    const client = await auth.getIdTokenClient(privateApiBaseUrl);
    return client;
  } catch (error) {
    console.error('Error getting authenticated client:', error);
    throw new Error('Could not create an authenticated client.');
  }
}

async function handler(req: NextRequest) {
  const client = await getAuthenticatedClient();
  
  const incomingUrl = new URL(req.nextUrl);
  const requestPath = incomingUrl.pathname.replace('/api/proxy', '');
  const targetUrl = `${privateApiBaseUrl}${requestPath}${incomingUrl.search}`;

  try {
    const response = await client.request({
      url: targetUrl,
      method: req.method,
      headers: {
        ...req.headers,
        // The host header must match the target service's host.
        host: new URL(privateApiBaseUrl).host,
      },
      data: req.body,
      responseType: 'stream', 
    });

    return new NextResponse(response.data, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error: any) {
    console.error(`Error proxying request to ${targetUrl}:`, error.response?.data || error.message);
    return new NextResponse(
      error.response?.data || 'An error occurred during proxying.',
      { status: error.response?.status || 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;
