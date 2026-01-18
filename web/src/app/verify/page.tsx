'use client';

import { useState, useCallback } from 'react';
import { verifyDocument, computeHash } from '@/lib/mockData';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Hash,
  Shield,
  Clock,
  Building2,
  AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'failed';

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<ReturnType<typeof verifyDocument> | null>(null);
  const [computedHash, setComputedHash] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setStatus('idle');
      setResult(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setResult(null);
    }
  };

  const handleVerify = async () => {
    if (!file) return;

    setStatus('verifying');

    // Simulate verification process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Read file and compute hash
    const fileContent = await file.text();
    const hash = computeHash(fileContent);
    setComputedHash(hash);

    // Check against blockchain
    const verificationResult = verifyDocument(hash);

    setResult(verificationResult);
    setStatus(verificationResult.verified ? 'verified' : 'failed');
  };

  const resetForm = () => {
    setFile(null);
    setStatus('idle');
    setResult(null);
    setComputedHash('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Verify Document</h1>
        <p className="text-gray-500 mt-1">
          Check if a document is authentic and has not been modified
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={clsx(
            'drop-zone border-2 border-dashed rounded-xl p-12 text-center transition-all',
            dragOver ? 'drag-over border-indigo-500 bg-indigo-50' : 'border-gray-300',
            file ? 'bg-blue-50 border-blue-300' : ''
          )}
        >
          {file ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <p className="font-medium text-gray-900 mb-1">{file.name}</p>
              <p className="text-sm text-gray-500 mb-4">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <button
                onClick={() => {
                  setFile(null);
                  setStatus('idle');
                  setResult(null);
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove file
              </button>
            </div>
          ) : (
            <>
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">
                Drop a document to verify its authenticity
              </p>
              <p className="text-gray-400 mb-4">or</p>
              <label className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                Select File
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                />
              </label>
            </>
          )}
        </div>

        {file && status === 'idle' && (
          <button
            onClick={handleVerify}
            className="w-full mt-6 py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg"
          >
            Verify on Blockchain
          </button>
        )}
      </div>

      {/* Verifying State */}
      {status === 'verifying' && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Document...
          </h2>
          <p className="text-gray-500">
            Computing hash and checking against blockchain records
          </p>
        </div>
      )}

      {/* Verified Result */}
      {status === 'verified' && result?.verified && result.document && result.transaction && (
        <div className="bg-white rounded-xl border-2 border-green-200 p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 verified-pulse">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Document Verified!
            </h2>
            <p className="text-gray-600">
              This document is authentic and has not been modified
            </p>
          </div>

          <div className="grid gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <Hash className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Document Hash</span>
              </div>
              <p className="font-mono text-sm text-gray-600 break-all">
                {result.document.currentHash}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Document Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 text-gray-900">{result.document.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 text-gray-900">{result.document.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 text-gray-900">{result.document.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Version:</span>
                  <span className="ml-2 text-gray-900">{result.document.currentVersion}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Transaction Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="ml-2 text-gray-900">{result.transaction.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Property:</span>
                  <span className="ml-2 text-gray-900">{result.transaction.propertyAddress}</span>
                </div>
                <div>
                  <span className="text-gray-500">Lender:</span>
                  <span className="ml-2 text-gray-900">{result.transaction.lenderName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Borrower:</span>
                  <span className="ml-2 text-gray-900">{result.transaction.borrowerName}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-900">Blockchain Events</span>
              </div>
              <div className="space-y-2">
                {result.document.events.map((event, index) => (
                  <div key={event.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-700">{event.type}</span>
                      <span className="text-gray-400">by {event.actorId}</span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {format(event.timestamp, 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Verify Another Document
          </button>
        </div>
      )}

      {/* Failed Result */}
      {status === 'failed' && (
        <div className="bg-white rounded-xl border-2 border-red-200 p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-700 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600">
              This document does not match any record on the blockchain
            </p>
          </div>

          <div className="p-4 bg-red-50 rounded-lg border border-red-100 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-700 mb-1">Possible Reasons:</p>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• The document may have been modified after upload</li>
                  <li>• The document was never uploaded to the blockchain</li>
                  <li>• You may be checking a different version of the document</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Hash className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Computed Hash</span>
            </div>
            <p className="font-mono text-sm text-gray-600 break-all">
              {computedHash}
            </p>
          </div>

          <button
            onClick={resetForm}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Try Another Document
          </button>
        </div>
      )}

      {/* How It Works */}
      {status === 'idle' && !file && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Verification Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3">
                <span className="text-xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Upload Document</h4>
              <p className="text-sm text-gray-500">
                Select the document you want to verify
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3">
                <span className="text-xl font-bold text-indigo-600">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Compute Hash</h4>
              <p className="text-sm text-gray-500">
                We generate a unique SHA-256 fingerprint
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3">
                <span className="text-xl font-bold text-indigo-600">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Check Blockchain</h4>
              <p className="text-sm text-gray-500">
                Compare against immutable blockchain records
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
