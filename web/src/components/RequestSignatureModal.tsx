'use client';

import { useState } from 'react';
import {
  X,
  PenTool,
  UserPlus,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import clsx from 'clsx';

interface Signer {
  email: string;
  name: string;
  routingOrder: number;
}

interface RequestSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  transactionId: string;
  documentName: string;
  documentBase64: string;
}

export default function RequestSignatureModal({
  isOpen,
  onClose,
  documentId,
  transactionId,
  documentName,
  documentBase64
}: RequestSignatureModalProps) {
  const [signers, setSigners] = useState<Signer[]>([
    { email: '', name: '', routingOrder: 1 }
  ]);
  const [emailSubject, setEmailSubject] = useState(`Please sign: ${documentName}`);
  const [emailBlurb, setEmailBlurb] = useState('Please review and sign the attached document for the loan transaction.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [envelopeId, setEnvelopeId] = useState<string | null>(null);

  const addSigner = () => {
    setSigners([
      ...signers,
      { email: '', name: '', routingOrder: signers.length + 1 }
    ]);
  };

  const removeSigner = (index: number) => {
    if (signers.length > 1) {
      const newSigners = signers.filter((_, i) => i !== index);
      // Update routing orders
      newSigners.forEach((signer, i) => {
        signer.routingOrder = i + 1;
      });
      setSigners(newSigners);
    }
  };

  const updateSigner = (index: number, field: keyof Signer, value: string | number) => {
    const newSigners = [...signers];
    newSigners[index] = { ...newSigners[index], [field]: value };
    setSigners(newSigners);
  };

  const validateSigners = (): boolean => {
    for (const signer of signers) {
      if (!signer.email || !signer.name) {
        setError('All signers must have an email and name');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signer.email)) {
        setError(`Invalid email address: ${signer.email}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!validateSigners()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/docusign/create-envelope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          transactionId,
          documentName,
          documentBase64,
          signers: signers.map(s => ({
            email: s.email,
            name: s.name,
            routingOrder: s.routingOrder
          })),
          emailSubject,
          emailBlurb
        })
      });

      const data = await response.json();

      if (data.success && data.envelopeId) {
        setEnvelopeId(data.envelopeId);
        setSuccess(`Signature request sent successfully! Envelope ID: ${data.envelopeId}`);
      } else {
        setError(data.error || 'Failed to create signature request');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setSigners([{ email: '', name: '', routingOrder: 1 }]);
    setError(null);
    setSuccess(null);
    setEnvelopeId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <PenTool className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Request Signatures</h2>
              <p className="text-sm text-gray-500">{documentName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {success ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Signature Request Sent!</h3>
              <p className="text-gray-600 mb-4">{success}</p>
              <p className="text-sm text-gray-500 mb-6">
                Signers will receive an email with instructions to sign the document.
                You can track the signature status on the Sign Documents page.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

              {/* Signers Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Signers</h3>
                  <button
                    onClick={addSigner}
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Signer
                  </button>
                </div>

                <div className="space-y-4">
                  {signers.map((signer, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Signer {index + 1}
                        </span>
                        {signers.length > 1 && (
                          <button
                            onClick={() => removeSigner(index)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={signer.name}
                            onChange={(e) => updateSigner(index, 'name', e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Email Address</label>
                          <input
                            type="email"
                            value={signer.email}
                            onChange={(e) => updateSigner(index, 'email', e.target.value)}
                            placeholder="john@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Customization */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Email Message</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Message</label>
                    <textarea
                      value={emailBlurb}
                      onChange={(e) => setEmailBlurb(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Signers will receive an email invitation to sign the document via DocuSign.
                  They can also sign using the embedded signing experience from the Sign Documents page.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={clsx(
                'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send for Signature
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
