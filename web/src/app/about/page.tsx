'use client';

import {
  Info,
  Shield,
  FileText,
  PenTool,
  Search,
  ScrollText,
  Upload,
  Link2,
  Database,
  Lock,
  CheckCircle2,
  Users,
  Building2,
  Workflow,
  Github
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Info className="w-8 h-8 text-indigo-600" />
          About This Demo
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Blockchain-Secured Document Verification for Real Estate Transactions
        </p>
      </div>

      {/* Overview Section */}
      <section className="mb-10">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white mb-6">
          <h2 className="text-2xl font-bold mb-4">What is Realist?</h2>
          <p className="text-indigo-100 leading-relaxed">
            Realist is a demonstration of how blockchain technology can revolutionize document
            management in real estate transactions. By combining cryptographic hashing, immutable
            audit trails, and digital signature integration, this system provides unprecedented
            transparency and security for loan documents.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Tamper-Proof Verification</h3>
            <p className="text-gray-600 text-sm">
              Every document is hashed using SHA-256 cryptography. Any modification to the
              document, even a single character, produces a completely different hash - making
              tampering immediately detectable.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Immutable Audit Trail</h3>
            <p className="text-gray-600 text-sm">
              All document events (uploads, views, signatures, approvals) are recorded to a
              blockchain ledger. Once recorded, these entries cannot be altered or deleted,
              providing a complete history.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <PenTool className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">DocuSign Integration</h3>
            <p className="text-gray-600 text-sm">
              Seamlessly request legally-binding electronic signatures through DocuSign.
              Signature events are automatically recorded to the blockchain, creating a
              verifiable chain of custody.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Multi-Party Collaboration</h3>
            <p className="text-gray-600 text-sm">
              Designed for real estate workflows involving multiple parties: borrowers, lenders,
              attorneys, title companies, notaries, and county clerks - each with role-based
              access and accountability.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Workflow className="w-6 h-6 text-indigo-600" />
          Demo Features
        </h2>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Upload Document</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Upload loan documents (PDF, DOC, DOCX, TXT) to the blockchain. Each document
                  is assigned a unique ID, cryptographic hash, and block ID. The upload event
                  is recorded with timestamp and actor information.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">SHA-256 Hashing</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Block Recording</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Request Signatures</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <PenTool className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Sign Document</h3>
                <p className="text-gray-600 text-sm mb-3">
                  View pending signature requests and sign documents using DocuSign's embedded
                  signing experience. In demo mode, signing is simulated. With DocuSign credentials
                  configured, real legally-binding signatures are collected.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Embedded Signing</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Multiple Signers</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Routing Order</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Verify Document</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Verify document authenticity by uploading a file or entering its hash. The
                  system checks if the document exists on the blockchain and displays its
                  complete history including all events and modifications.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Hash Verification</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Tampering Detection</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">History Display</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ScrollText className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Audit Trail</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Browse the complete, immutable audit trail of all document events across all
                  transactions. Filter by event type, actor, or document. Each entry shows
                  timestamp, block ID, and event details.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Immutable Records</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Complete History</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Filterable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Link2 className="w-6 h-6 text-indigo-600" />
          How It Works
        </h2>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Document Upload</h4>
                <p className="text-gray-600 text-sm">
                  When a document is uploaded, the system computes its SHA-256 hash - a unique
                  64-character fingerprint. This hash, along with metadata (uploader, timestamp,
                  document type), is recorded to the blockchain.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Signature Request</h4>
                <p className="text-gray-600 text-sm">
                  After upload, you can request signatures from one or more parties. The system
                  creates a DocuSign envelope containing the document and sends signing invitations
                  to each signer in the specified routing order.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Signing Process</h4>
                <p className="text-gray-600 text-sm">
                  Signers can sign using the embedded DocuSign experience (staying in-app) or
                  via email invitation. Each signature event is captured with timestamp, signer
                  identity, and IP address.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Blockchain Recording</h4>
                <p className="text-gray-600 text-sm">
                  When signing completes, a webhook notification triggers recording of the
                  signature event to the blockchain. The signed document's new hash is computed
                  and stored, maintaining the chain of custody.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                5
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Verification</h4>
                <p className="text-gray-600 text-sm">
                  Anyone can verify a document by uploading it or entering its hash. The system
                  checks the blockchain for matching records and displays the complete event
                  history, proving authenticity and chain of custody.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" />
          Real Estate Use Cases
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Promissory Notes</h4>
            <p className="text-gray-600 text-sm">
              Track the complete lifecycle from origination through assignments, ensuring
              clear ownership and preventing fraud.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Deeds of Trust</h4>
            <p className="text-gray-600 text-sm">
              Maintain immutable records of security instruments with verifiable signatures
              from all parties.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Closing Documents</h4>
            <p className="text-gray-600 text-sm">
              Coordinate multi-party signing ceremonies with full audit trail for regulatory
              compliance.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Title Insurance</h4>
            <p className="text-gray-600 text-sm">
              Create verifiable chain of title with cryptographic proof of each transfer
              and encumbrance.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Stack Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Lock className="w-6 h-6 text-indigo-600" />
          Technology Stack
        </h2>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Frontend</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Next.js 16 (React Framework)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  TypeScript (Type Safety)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Tailwind CSS (Styling)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Lucide React (Icons)
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Backend & Integration</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  DocuSign eSignature API
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  JWT Authentication
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  SHA-256 Cryptographic Hashing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Webhook Event Processing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Mode Notice */}
      <section className="mb-10">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Demo Mode
          </h3>
          <p className="text-yellow-800 text-sm mb-3">
            This demo runs in <strong>mock mode</strong> without real DocuSign credentials.
            Signature requests are simulated, and clicking "Sign Now" will immediately
            complete the signing process for demonstration purposes.
          </p>
          <p className="text-yellow-800 text-sm">
            In a production environment with DocuSign credentials configured, real legally-binding
            electronic signatures would be collected through DocuSign's secure infrastructure.
          </p>
        </div>
      </section>

      {/* GitHub Link */}
      <section>
        <a
          href="https://github.com/Welcomebackjack/blockchain-demo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Github className="w-5 h-5" />
          View Source Code on GitHub
        </a>
      </section>
    </div>
  );
}
