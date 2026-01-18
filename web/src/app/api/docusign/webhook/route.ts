import { NextRequest, NextResponse } from 'next/server';
import { docuSignService } from '@/lib/docusign';
import { DocuSignWebhookPayload } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature validation
    const rawBody = await request.text();

    // Get HMAC signature from headers
    const signature = request.headers.get('x-docusign-signature-1') || '';

    // Validate webhook signature
    if (!(await docuSignService.validateWebhookSignature(rawBody, signature))) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the payload
    const payload: DocuSignWebhookPayload = JSON.parse(rawBody);

    console.log('DocuSign webhook received:', {
      event: payload.event,
      envelopeId: payload.data?.envelopeId,
      status: payload.data?.envelopeSummary?.status
    });

    // Process the webhook
    const signatureMetadata = await docuSignService.processWebhook(payload);

    if (signatureMetadata) {
      // Signature completed - here you would record to blockchain
      console.log('Signature completed, metadata:', signatureMetadata);

      // TODO: Add blockchain recording here
      // Example:
      // await blockchainService.recordSignatureEvent({
      //   type: EventType.SIGNATURE,
      //   documentId: envelope.documentId,
      //   metadata: signatureMetadata
      // });
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing DocuSign webhook:', error);
    // Return 200 anyway to prevent DocuSign from retrying
    return NextResponse.json({ success: false, error: error.message });
  }
}

// DocuSign may send a GET request to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: 'DocuSign webhook endpoint is active' });
}
