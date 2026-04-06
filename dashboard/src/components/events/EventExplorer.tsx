import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEvents } from '../../api/client';

interface EventExplorerProps {
  siteId: string;
  from: string;
  to: string;
}

export function EventExplorer({ siteId, from, to }: EventExplorerProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>();
  const [expandedRow, setExpandedRow] = useState<number>();

  const { data: eventsData } = useQuery({
    queryKey: ['events', siteId, from, to, selectedEvent],
    queryFn: () => getEvents(siteId, from, to, selectedEvent),
  });

  const events = eventsData?.events || [];

  return (
    <div className="space-y-4">
      {/* Event name filter */}
      <div className="flex items-center gap-3">
        <label htmlFor="event-filter" className="text-sm font-mono text-edge-600">
          Filter by event:
        </label>
        <input
          id="event-filter"
          type="text"
          value={selectedEvent || ''}
          onChange={(e) => setSelectedEvent(e.target.value || undefined)}
          placeholder="All events"
          className="bg-edge-950 border border-edge-800 rounded-lg px-3 py-2 text-sm text-edge-400 font-mono placeholder:text-edge-muted focus:outline-none focus:ring-2 focus:ring-edge-700"
        />
      </div>

      {/* Events table */}
      <div className="bg-edge-900/50 border border-edge-800 rounded-xl overflow-hidden">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-edge-800">
              <th
                className="text-left text-xs font-mono text-edge-700 uppercase tracking-wider px-5 py-3"
                scope="col"
              >
                Event Name
              </th>
              <th
                className="text-right text-xs font-mono text-edge-700 uppercase tracking-wider px-5 py-3"
                scope="col"
              >
                Count
              </th>
              <th className="w-10 px-3" scope="col">
                <span className="sr-only">Expand</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => (
              <Fragment key={`${event.event_name}-${i}`}>
                <tr
                  className="border-b border-edge-800/30 hover:bg-edge-900/80 cursor-pointer transition-colors"
                  onClick={() => setExpandedRow(expandedRow === i ? undefined : i)}
                >
                  <td className="px-5 py-3 text-sm font-mono text-edge-500">{event.event_name}</td>
                  <td className="text-right px-5 py-3 text-sm font-mono text-edge-400 tabular-nums">
                    {event.count.toLocaleString()}
                  </td>
                  <td className="px-3 text-edge-700">
                    <span
                      className={`inline-block transition-transform ${expandedRow === i ? 'rotate-90' : ''}`}
                    >
                      &#9654;
                    </span>
                  </td>
                </tr>
                {expandedRow === i && Object.keys(event.properties).length > 0 && (
                  <tr key={`${event.event_name}-${i}-props`}>
                    <td colSpan={3} className="px-5 py-3 bg-edge-950/50">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(event.properties).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-xs font-mono text-edge-700">{key}:</span>
                            <span className="text-xs font-mono text-edge-500">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-sm font-mono text-edge-muted">
                  No custom events for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
