import { NextRequest, NextResponse } from 'next/server';
import { docuSignService } from '@/lib/docusign';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ envelopeId: string }> }
) {
  try {
    const { envelopeId } = await params;

    if (!envelopeId) {
      return NextResponse.json(
        { success: false, error: 'Envelope ID is required' },
        { status: 400 }
      );
    }

    // Check if DocuSign is configured
    if (!docuSignService.isConfigured()) {
      // If not configured, try to get from local cache only
      const cachedEnvelope = docuSignService.getEnvelope(envelopeId);
      if (cachedEnvelope) {
        return NextResponse.json({ success: true, envelope: cachedEnvelope });
      }
      return NextResponse.json(
        { success: false, error: 'DocuSign is not configured and envelope not found in cache' },
        { status: 503 }
      );
    }

    // Get envelope status from DocuSign
    const envelope = await docuSignService.getEnvelopeStatus(envelopeId);

    if (envelope) {
      return NextResponse.json({ success: true, envelope });
    } else {
      return NextResponse.json(
        { success: false, error: 'Envelope not found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error getting envelope status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
