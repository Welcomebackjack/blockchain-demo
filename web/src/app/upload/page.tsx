'use client';

import { useState, useCallback } from 'react';
import { mockTransactions, computeHash } from '@/lib/mockData';
import {
  Upload,
  FileText,
  CheckCircle2,
  Hash,
  Shield,
  Clock,
  User,
  Building2
} from 'lucide-react';
import clsx from 'clsx';

export default function UploadPage() {
  const [selectedTransaction, setSelectedTransaction] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    hash: string;
    blockId: string;
    documentId: string;
  } | null>(null);

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
      setUploadResult(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedTransaction || !documentType) return;

    setUploading(true);

    // Simulate upload process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock hash and block ID
    const fileContent = await file.text();
    const hash = computeHash(fileContent + Date.now());
    const blockId = '0x' + computeHash(hash + Math.random());
    const documentId = 'DOC-' + Date.now();

    setUploadResult({
      success: true,
      hash,
      blockId,
      documentId,
    });

    setUploading(false);
  };

  const resetForm = () => {
    setFile(null);
    setSelectedTransaction('');
    setDocumentType('');
    setUploadResult(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
        <p className="text-gray-500 mt-1">
          Add a document to the blockchain with cryptographic verification
        </p>
      </div>

      {!uploadResult ? (
        <div className="space-y-6">
          {/* Transaction Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Transaction
            </label>
            <select
              value={selectedTransaction}
              onChange={(e) => setSelectedTransaction(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select a transaction --</option>
              {mockTransactions.map((tx) => (
                <option key={tx.id} value={tx.id}>
                  {tx.id} - {tx.propertyAddress}
                </option>
              ))}
            </select>

            {selectedTransaction && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {(() => {
                  const tx = mockTransactions.find((t) => t.id === selectedTransaction);
                  if (!tx) return null;
                  return (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Lender:</span>
                        <span className="ml-2 text-gray-900">{tx.lenderName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Borrower:</span>
                        <span className="ml-2 text-gray-900">{tx.borrowerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Loan Amount:</span>
                        <span className="ml-2 text-gray-900">${tx.loanAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-2 text-gray-900">{tx.status}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Document Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select document type --</option>
              <option value="Promissory Note">Promissory Note</option>
              <option value="Deed of Trust">Deed of Trust</option>
              <option value="Closing Disclosure">Closing Disclosure</option>
              <option value="Title Commitment">Title Commitment</option>
              <option value="Mortgage">Mortgage</option>
              <option value="Assignment">Assignment</option>
              <option value="Guaranty">Guaranty</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document File
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={clsx(
                'drop-zone border-2 border-dashed rounded-xl p-8 text-center transition-all',
                dragOver ? 'drag-over border-indigo-500 bg-indigo-50' : 'border-gray-300',
                file ? 'bg-green-50 border-green-300' : ''
              )}
            >
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="ml-4 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop your document here, or
                  </p>
                  <label className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                    Browse Files
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                    />
                  </label>
                  <p className="text-sm text-gray-400 mt-2">
                    Supported: PDF, DOC, DOCX, TXT
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || !selectedTransaction || !documentType || uploading}
            className={clsx(
              'w-full py-4 rounded-xl font-medium text-white transition-all',
              file && selectedTransaction && documentType && !uploading
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'
                : 'bg-gray-300 cursor-not-allowed'
            )}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading to Blockchain...
              </span>
            ) : (
              'Upload to Blockchain'
            )}
          </button>
        </div>
      ) : (
        /* Success Result */
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 verified-pulse">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Document Uploaded Successfully!
            </h2>
            <p className="text-gray-500">
              Your document has been hashed and recorded on the blockchain
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">Document ID</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {uploadResult.documentId}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Hash className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">SHA-256 Hash</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {uploadResult.hash}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">Block ID</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {uploadResult.blockId}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">Timestamp</p>
                <p className="text-sm text-gray-900">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetForm}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Upload Another Document
            </button>
            <a
              href="/verify"
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center"
            >
              Verify a Document
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
