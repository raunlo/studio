
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import type { IdTokenClient } from 'google-auth-library/build/src/auth/idtokenclient';
import https from 'https';

const privateApiBaseUrl = process.env.PRIVATE_API_BASE_URL;

if (!privateApiBaseUrl) {
  throw new Error('PRIVATE_API_BASE_URL is not set in environment variables');
}

const auth = new GoogleAuth();
let client: IdTokenClient | null = null;

// Create an agent that can be configured to ignore self-signed certs for debugging.
// In a real production environment, you would not want to set rejectUnauthorized to false.
const agent = new https.Agent({
  rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0',
});

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
    
    // We explicitly buffer the body to handle different request types (e.g., streaming)
    const bodyBuffer = await req.text();

    const res = await authedClient.request({
      url: targetUrl,
      method: req.method,
      headers: {
        ...req.headers,
        // The host header must match the target service's URL
        host: new URL(targetUrl).host,
      },
      body: bodyBuffer || undefined,
      httpsAgent: agent, // Use our configured agent
    });
    
    // Type assertion to access properties on the response
    const response = res as any;
    
    return new NextResponse(response.data, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (error: any) {
    console.error(`Error proxying request:`, error.message || error);
    
    const errorData = error.response?.data?.error || error.response?.data || error.message;

    return new NextResponse(
      JSON.stringify({ message: 'Error proxying request', details: errorData }),
      { status: error.response?.status || 500, headers: { 'Content-Type': 'application/json' } }
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
