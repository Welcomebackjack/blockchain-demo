import { NextRequest, NextResponse } from 'next/server';
import { docuSignService } from '@/lib/docusign';
import { CreateEnvelopeRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: CreateEnvelopeRequest = await request.json();

    // Validate required fields
    if (!body.documentId || !body.transactionId || !body.documentName || !body.documentBase64) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: documentId, transactionId, documentName, documentBase64' },
        { status: 400 }
      );
    }

    if (!body.signers || body.signers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one signer is required' },
        { status: 400 }
      );
    }

    // Validate signers
    for (const signer of body.signers) {
      if (!signer.email || !signer.name) {
        return NextResponse.json(
          { success: false, error: 'Each signer must have email and name' },
          { status: 400 }
        );
      }
    }

    // Check if DocuSign is configured
    if (!docuSignService.isConfigured()) {
      return NextResponse.json(
        { success: false, error: 'DocuSign is not configured. Please set the required environment variables.' },
        { status: 503 }
      );
    }

    // Create the envelope
    const result = await docuSignService.createEnvelope(body);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in create-envelope API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
