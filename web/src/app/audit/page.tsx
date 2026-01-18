'use client';

import { getAllEvents } from '@/lib/mockData';
import {
  Upload,
  Eye,
  CheckCircle,
  PenTool,
  Stamp,
  FileCheck,
  RefreshCw,
  Filter,
  Clock,
  User,
  FileText,
  Hash,
  Shield
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import clsx from 'clsx';

const eventIcons: Record<string, React.ElementType> = {
  UPLOAD: Upload,
  VIEW: Eye,
  APPROVAL: CheckCircle,
  SIGNATURE: PenTool,
  NOTARIZATION: Stamp,
  RECORDED: FileCheck,
  REVISION: RefreshCw,
};

const eventColors: Record<string, string> = {
  UPLOAD: 'bg-blue-100 text-blue-600',
  VIEW: 'bg-gray-100 text-gray-600',
  APPROVAL: 'bg-green-100 text-green-600',
  SIGNATURE: 'bg-purple-100 text-purple-600',
  NOTARIZATION: 'bg-yellow-100 text-yellow-600',
  RECORDED: 'bg-emerald-100 text-emerald-600',
  REVISION: 'bg-orange-100 text-orange-600',
};

const roleColors: Record<string, string> = {
  ATTORNEY: 'bg-indigo-100 text-indigo-700',
  LENDER: 'bg-blue-100 text-blue-700',
  BORROWER: 'bg-green-100 text-green-700',
  NOTARY: 'bg-yellow-100 text-yellow-700',
  COUNTY_CLERK: 'bg-purple-100 text-purple-700',
  TITLE_COMPANY: 'bg-pink-100 text-pink-700',
};

export default function AuditPage() {
  const allEvents = getAllEvents();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<typeof allEvents[0] | null>(null);

  const eventTypes = ['ALL', ...new Set(allEvents.map((e) => e.type))];

  const filteredEvents = filterType === 'ALL'
    ? allEvents
    : allEvents.filter((e) => e.type === filterType);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-500 mt-1">
          Complete blockchain event history for all documents
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total Events</p>
          <p className="text-2xl font-bold text-gray-900">{allEvents.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Uploads</p>
          <p className="text-2xl font-bold text-blue-600">
            {allEvents.filter((e) => e.type === 'UPLOAD').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Signatures</p>
          <p className="text-2xl font-bold text-purple-600">
            {allEvents.filter((e) => e.type === 'SIGNATURE').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Recorded</p>
          <p className="text-2xl font-bold text-green-600">
            {allEvents.filter((e) => e.type === 'RECORDED').length}
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Event List */}
        <div className="flex-1">
          {/* Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Filter by type:</span>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={clsx(
                      'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                      filterType === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Event Timeline ({filteredEvents.length} events)
              </h2>
            </div>

            <div className="divide-y divide-gray-50">
              {filteredEvents.map((event, index) => {
                const Icon = eventIcons[event.type] || FileCheck;
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={clsx(
                      'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                      selectedEvent?.id === event.id && 'bg-indigo-50'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center">
                        <div className={clsx(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          eventColors[event.type]
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {index < filteredEvents.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                      </div>

                      {/* Event content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{event.type}</span>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className={clsx(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            roleColors[event.actorRole] || 'bg-gray-100 text-gray-600'
                          )}>
                            {event.actorRole}
                          </span>
                          <span className="text-sm text-gray-600">{event.actorId}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {event.documentName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {event.transactionId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event Details Panel */}
        <div className="w-96 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 sticky top-8">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Event Details</h2>
            </div>

            {selectedEvent ? (
              <div className="p-4 space-y-4">
                {/* Event Type Badge */}
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    eventColors[selectedEvent.type]
                  )}>
                    {(() => {
                      const Icon = eventIcons[selectedEvent.type] || FileCheck;
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedEvent.type}</p>
                    <p className="text-sm text-gray-500">
                      {format(selectedEvent.timestamp, 'MMM d, yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <User className="w-4 h-4" />
                      Actor
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedEvent.actorId}</p>
                    <span className={clsx(
                      'inline-block px-2 py-0.5 rounded text-xs font-medium mt-1',
                      roleColors[selectedEvent.actorRole] || 'bg-gray-100 text-gray-600'
                    )}>
                      {selectedEvent.actorRole}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <FileText className="w-4 h-4" />
                      Document
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedEvent.documentName}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedEvent.transactionId}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Hash className="w-4 h-4" />
                      Document Hash
                    </div>
                    <p className="text-xs font-mono text-gray-600 break-all">
                      {selectedEvent.docHash}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Shield className="w-4 h-4" />
                      Block ID
                    </div>
                    <p className="text-xs font-mono text-gray-600 break-all">
                      {selectedEvent.blockId}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Clock className="w-4 h-4" />
                      Timestamp
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(selectedEvent.timestamp, 'MMMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(selectedEvent.timestamp, 'HH:mm:ss.SSS')} UTC
                    </p>
                  </div>

                  {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <div className="text-sm text-indigo-600 font-medium mb-2">
                        Metadata
                      </div>
                      <pre className="text-xs text-gray-600 overflow-auto">
                        {JSON.stringify(selectedEvent.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select an event to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
