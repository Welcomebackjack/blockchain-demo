'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PenTool,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Mail,
  User
} from 'lucide-react';
import clsx from 'clsx';

interface Signer {
  email: string;
  name: string;
  recipientId: string;
  status?: string;
  signedAt?: number;
}

interface Envelope {
  envelopeId: string;
  status: string;
  documentId: string;
  transactionId: string;
  signers: Signer[];
  createdAt: number;
  completedAt?: number;
  documentName: string;
}

function SignPageContent() {
  const searchParams = useSearchParams();
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingInProgress, setSigningInProgress] = useState<string | null>(null);
  const [returnStatus, setReturnStatus] = useState<{ type: 'success' | 'error' | 'cancel'; message: string } | null>(null);

  // Check for return from DocuSign
  useEffect(() => {
    const event = searchParams.get('event');
    const envelopeId = searchParams.get('envelopeId');

    if (event) {
      switch (event) {
        case 'signing_complete':
          setReturnStatus({
            type: 'success',
            message: 'Document signed successfully! The signature has been recorded.'
          });
          break;
        case 'decline':
          setReturnStatus({
            type: 'error',
            message: 'Signature was declined.'
          });
          break;
        case 'cancel':
          setReturnStatus({
            type: 'cancel',
            message: 'Signing was cancelled. You can resume at any time.'
          });
          break;
        case 'exception':
          setReturnStatus({
            type: 'error',
            message: 'An error occurred during signing. Please try again.'
          });
          break;
        default:
          break;
      }

      // Refresh envelope status if we have an ID
      if (envelopeId) {
        refreshEnvelopeStatus(envelopeId);
      }
    }
  }, [searchParams]);

  // Load envelopes (in production, fetch from API)
  useEffect(() => {
    loadEnvelopes();
  }, []);

  const loadEnvelopes = async () => {
    setLoading(true);
    try {
      // For demo purposes, we'll show mock data if no real envelopes exist
      // In production, fetch from your backend/database
      const mockEnvelopes: Envelope[] = [
        {
          envelopeId: 'demo-envelope-1',
          status: 'sent',
          documentId: 'DOC-2024-001',
          transactionId: 'TXN-2024-001',
          signers: [
            { email: 'borrower@example.com', name: 'John Borrower', recipientId: '1', status: 'sent' }
          ],
          createdAt: Date.now() - 3600000,
          documentName: 'Loan Agreement.pdf'
        }
      ];
      setEnvelopes(mockEnvelopes);
    } catch (error) {
      console.error('Error loading envelopes:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshEnvelopeStatus = async (envelopeId: string) => {
    try {
      const response = await fetch(`/api/docusign/status/${envelopeId}`);
      const data = await response.json();
      if (data.success && data.envelope) {
        setEnvelopes(prev =>
          prev.map(env =>
            env.envelopeId === envelopeId ? data.envelope : env
          )
        );
      }
    } catch (error) {
      console.error('Error refreshing envelope status:', error);
    }
  };

  const startSigning = async (envelope: Envelope, signer: Signer) => {
    setSigningInProgress(envelope.envelopeId);
    try {
      const returnUrl = `${window.location.origin}/sign?event=signing_complete&envelopeId=${envelope.envelopeId}`;

      const response = await fetch('/api/docusign/embedded-signing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          envelopeId: envelope.envelopeId,
          signerEmail: signer.email,
          signerName: signer.name,
          returnUrl
        })
      });

      const data = await response.json();

      if (data.success && data.signingUrl) {
        // Redirect to DocuSign
        window.location.href = data.signingUrl;
      } else {
        alert(data.error || 'Failed to get signing URL');
      }
    } catch (error) {
      console.error('Error starting signing:', error);
      alert('Failed to start signing process');
    } finally {
      setSigningInProgress(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'declined':
      case 'voided':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'sent':
      case 'delivered':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'declined':
      case 'voided':
        return 'bg-red-100 text-red-800';
      case 'sent':
      case 'delivered':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <PenTool className="w-8 h-8 text-indigo-600" />
          Sign Documents
        </h1>
        <p className="text-gray-600 mt-1">
          View and sign documents that require your signature
        </p>
      </div>

      {/* Return Status Alert */}
      {returnStatus && (
        <div
          className={clsx(
            'mb-6 p-4 rounded-lg flex items-center gap-3',
            returnStatus.type === 'success' && 'bg-green-50 border border-green-200',
            returnStatus.type === 'error' && 'bg-red-50 border border-red-200',
            returnStatus.type === 'cancel' && 'bg-yellow-50 border border-yellow-200'
          )}
        >
          {returnStatus.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {returnStatus.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
          {returnStatus.type === 'cancel' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
          <span
            className={clsx(
              'font-medium',
              returnStatus.type === 'success' && 'text-green-800',
              returnStatus.type === 'error' && 'text-red-800',
              returnStatus.type === 'cancel' && 'text-yellow-800'
            )}
          >
            {returnStatus.message}
          </span>
          <button
            onClick={() => setReturnStatus(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading signature requests...</span>
        </div>
      ) : envelopes.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending signatures</h3>
          <p className="text-gray-600">
            Documents requiring your signature will appear here
          </p>
        </div>
      ) : (
        /* Envelope List */
        <div className="space-y-4">
          {envelopes.map((envelope) => (
            <div
              key={envelope.envelopeId}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Envelope Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{envelope.documentName}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Transaction: {envelope.transactionId}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Sent: {formatDate(envelope.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        'px-3 py-1 rounded-full text-xs font-medium capitalize flex items-center gap-1',
                        getStatusColor(envelope.status)
                      )}
                    >
                      {getStatusIcon(envelope.status)}
                      {envelope.status}
                    </span>
                    <button
                      onClick={() => refreshEnvelopeStatus(envelope.envelopeId)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Refresh status"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Signers */}
              <div className="p-6 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Signers</h4>
                <div className="space-y-3">
                  {envelope.signers.map((signer) => (
                    <div
                      key={signer.recipientId}
                      className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{signer.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {signer.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {signer.status && (
                          <span
                            className={clsx(
                              'px-2 py-1 rounded text-xs font-medium capitalize',
                              getStatusColor(signer.status)
                            )}
                          >
                            {signer.status}
                          </span>
                        )}
                        {(!signer.status || signer.status === 'sent' || signer.status === 'delivered') && (
                          <button
                            onClick={() => startSigning(envelope, signer)}
                            disabled={signingInProgress === envelope.envelopeId}
                            className={clsx(
                              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                              signingInProgress === envelope.envelopeId
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            )}
                          >
                            {signingInProgress === envelope.envelopeId ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4" />
                                Sign Now
                              </>
                            )}
                          </button>
                        )}
                        {signer.signedAt && (
                          <span className="text-xs text-gray-500">
                            Signed: {formatDate(signer.signedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">About DocuSign Integration</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>Clicking "Sign Now" will redirect you to DocuSign's secure signing environment</li>
          <li>After signing, you'll be returned here automatically</li>
          <li>All signatures are recorded to the blockchain audit trail</li>
          <li>You can also sign via email if you received a signing request</li>
        </ul>
      </div>
    </div>
  );
}

// Loading fallback for the sign page
function SignPageLoading() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <PenTool className="w-8 h-8 text-indigo-600" />
          Sign Documents
        </h1>
        <p className="text-gray-600 mt-1">
          Loading signature requests...
        </p>
      </div>
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function SignPage() {
  return (
    <Suspense fallback={<SignPageLoading />}>
      <SignPageContent />
    </Suspense>
  );
}
