import { NextRequest, NextResponse } from 'next/server';
import { docuSignService } from '@/lib/docusign';
import { EmbeddedSigningRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: EmbeddedSigningRequest = await request.json();

    // Validate required fields
    if (!body.envelopeId || !body.signerEmail || !body.signerName || !body.returnUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: envelopeId, signerEmail, signerName, returnUrl' },
        { status: 400 }
      );
    }

    // Check if DocuSign is configured
    if (!docuSignService.isConfigured()) {
      return NextResponse.json(
        { success: false, error: 'DocuSign is not configured. Please set the required environment variables.' },
        { status: 503 }
      );
    }

    // Get embedded signing URL
    const result = await docuSignService.getEmbeddedSigningUrl(body);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in embedded-signing API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
