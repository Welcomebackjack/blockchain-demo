'use client';

import { mockTransactions } from '@/lib/mockData';
import {
  FileText,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  OPEN: 'bg-blue-100 text-blue-700',
  CLOSING: 'bg-yellow-100 text-yellow-700',
  RECORDED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
};

const docStatusColors = {
  DRAFT: 'bg-gray-100 text-gray-600',
  APPROVED: 'bg-blue-100 text-blue-600',
  SIGNED: 'bg-purple-100 text-purple-600',
  RECORDED: 'bg-green-100 text-green-600',
};

export default function Dashboard() {
  const totalDocuments = mockTransactions.reduce((acc, tx) => acc + tx.documents.length, 0);
  const totalEvents = mockTransactions.reduce(
    (acc, tx) => acc + tx.documents.reduce((docAcc, doc) => docAcc + doc.events.length, 0),
    0
  );
  const totalValue = mockTransactions.reduce((acc, tx) => acc + tx.loanAmount, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your blockchain-secured loan documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Transactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{mockTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Documents on Chain</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalDocuments}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Blockchain Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalEvents}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Loan Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${(totalValue / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/upload"
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-2">Upload New Document</h3>
          <p className="text-indigo-100 text-sm mb-4">
            Add a document to the blockchain with cryptographic verification
          </p>
          <div className="flex items-center gap-2 text-sm font-medium">
            Get Started <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          href="/verify"
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-2">Verify Document</h3>
          <p className="text-green-100 text-sm mb-4">
            Check if a document is authentic and unmodified
          </p>
          <div className="flex items-center gap-2 text-sm font-medium">
            Verify Now <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {mockTransactions.map((tx) => (
            <div key={tx.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{tx.id}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>
                      {tx.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3">{tx.propertyAddress}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ${tx.loanAmount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {tx.lenderName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(tx.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm text-gray-500">
                    {tx.documents.length} {tx.documents.length === 1 ? 'document' : 'documents'}
                  </span>
                </div>
              </div>

              {/* Documents */}
              {tx.documents.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-gray-100">
                  <div className="space-y-2">
                    {tx.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{doc.name}</span>
                          <span className="text-xs text-gray-400">({doc.type})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${docStatusColors[doc.status]}`}>
                            {doc.status}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {doc.currentHash.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tx.documents.length === 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <AlertCircle className="w-4 h-4" />
                  No documents uploaded yet
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
