
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import type { IdTokenClient } from 'google-auth-library/build/src/auth/idtokenclient';

const privateApiBaseUrl = process.env.PRIVATE_API_BASE_URL;

if (!privateApiBaseUrl) {
  throw new Error('PRIVATE_API_BASE_URL is not set in environment variables');
}

const auth = new GoogleAuth();
let client: IdTokenClient | null = null;

async function getAuthenticatedClient() {
  if (client) {
    return client;
  }
  try {
    console.log(`Authenticating for audience: ${privateApiBaseUrl}`);
    client = await auth.getIdTokenClient(privateApiBaseUrl);
    console.log('Successfully created authenticated client.');
    return client;
  } catch (error) {
    console.error('Error creating authenticated client:', error);
    throw new Error('Could not create an authenticated client.');
  }
}

async function handler(req: NextRequest) {
  try {
    const authedClient = await getAuthenticatedClient();

    const incomingUrl = new URL(req.nextUrl);
    const requestPath = incomingUrl.pathname.replace('/api/proxy', '');
    const targetUrl = `${privateApiBaseUrl}${requestPath}${incomingUrl.search}`;

    console.log(`Proxying request to: ${targetUrl}`);
    
    // Explicitly get the Authorization header
    const headers = await authedClient.getRequestHeaders(targetUrl);

    // ---- START: Token Inspection Logic ----
    if (headers['Authorization']) {
      try {
        const token = headers['Authorization'].split(' ')[1];
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('Decoded ID Token Payload:', JSON.stringify(payload, null, 2));
      } catch (e: any) {
        console.error('Could not decode or log token payload:', e.message);
      }
    } else {
      console.warn('Authorization header was not present in the generated request headers.');
    }
    // ---- END: Token Inspection Logic ----


    // Copy original headers, but let the auth library override the important ones.
    const requestHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      // Don't copy the original host header.
      if (key.toLowerCase() !== 'host') {
        requestHeaders[key] = value;
      }
    });

    // Add the auth headers. This will include 'Authorization: Bearer ...'
    Object.assign(requestHeaders, headers);

    const bodyBuffer = await req.arrayBuffer();

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: requestHeaders,
      body: bodyBuffer.byteLength > 0 ? Buffer.from(bodyBuffer) : undefined,
    });
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (error: any) {
    console.error(`Error proxying request:`, error.message || error);
    
    return new NextResponse(
      JSON.stringify({ message: 'Error proxying request', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
