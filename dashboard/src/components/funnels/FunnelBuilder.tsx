import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunnels, createFunnel, type FunnelStep, type FunnelData } from '../../api/client';

interface FunnelBuilderProps {
  siteId: string;
}

export function FunnelBuilder({ siteId }: FunnelBuilderProps) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<FunnelStep[]>([
    { name: 'Step 1', type: 'url', value: '' },
    { name: 'Step 2', type: 'url', value: '' },
  ]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ['funnels', siteId],
    queryFn: () => getFunnels(siteId),
  });

  const mutation = useMutation({
    mutationFn: () => createFunnel(siteId, name, steps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels', siteId] });
      setIsCreating(false);
      setName('');
      setSteps([
        { name: 'Step 1', type: 'url', value: '' },
        { name: 'Step 2', type: 'url', value: '' },
      ]);
    },
  });

  const funnels = data?.funnels || [];

  const addStep = () => {
    setSteps([...steps, { name: `Step ${steps.length + 1}`, type: 'url', value: '' }]);
  };

  const removeStep = (idx: number) => {
    if (steps.length <= 2) return;
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, updates: Partial<FunnelStep>) => {
    setSteps(steps.map((s, i) => (i === idx ? { ...s, ...updates } : s)));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newSteps = [...steps];
    const [removed] = newSteps.splice(dragIdx, 1);
    newSteps.splice(idx, 0, removed);
    setSteps(newSteps);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className="space-y-6">
      {/* Existing funnels */}
      {funnels.map((funnel: FunnelData) => (
        <div key={funnel.id} className="bg-edge-900/50 border border-edge-800 rounded-xl p-5">
          <h3 className="text-sm font-mono font-semibold text-edge-400 mb-4">{funnel.name}</h3>
          <div className="flex items-center gap-2">
            {funnel.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="bg-edge-950 border border-edge-800 rounded-lg px-3 py-2">
                  <span className="text-xs font-mono text-edge-700 block">{step.type}</span>
                  <span className="text-sm font-mono text-edge-500">{step.value || step.name}</span>
                </div>
                {i < funnel.steps.length - 1 && (
                  <span className="text-edge-700" aria-hidden="true">
                    &#8594;
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Create funnel */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full border-2 border-dashed border-edge-800 rounded-xl p-6 text-edge-700 hover:text-edge-600 hover:border-edge-800 font-mono text-sm transition-colors"
        >
          + Create Funnel
        </button>
      ) : (
        <div className="bg-edge-900/50 border border-edge-800 rounded-xl p-5 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Funnel name"
            className="w-full bg-edge-950 border border-edge-800 rounded-lg px-3 py-2.5 text-sm text-edge-400 font-mono placeholder:text-edge-muted focus:outline-none focus:ring-2 focus:ring-edge-700"
            aria-label="Funnel name"
          />

          {/* Draggable steps */}
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 bg-edge-950 border rounded-lg p-3 ${
                  dragIdx === idx ? 'border-edge-700 opacity-50' : 'border-edge-800'
                } cursor-grab active:cursor-grabbing`}
              >
                <span className="text-edge-muted text-sm cursor-grab" aria-hidden="true">
                  &#9776;
                </span>
                <span className="text-xs font-mono text-edge-700 w-6">{idx + 1}.</span>
                <select
                  value={step.type}
                  onChange={(e) => updateStep(idx, { type: e.target.value as 'url' | 'event' })}
                  className="bg-edge-900 border border-edge-800 rounded px-2 py-1 text-xs font-mono text-edge-500 focus:outline-none focus:ring-1 focus:ring-edge-700"
                  aria-label={`Step ${idx + 1} type`}
                >
                  <option value="url">URL</option>
                  <option value="event">Event</option>
                </select>
                <input
                  type="text"
                  value={step.value}
                  onChange={(e) => updateStep(idx, { value: e.target.value })}
                  placeholder={step.type === 'url' ? '/checkout' : 'purchase'}
                  className="flex-1 bg-transparent text-sm text-edge-400 font-mono placeholder:text-edge-muted focus:outline-none"
                  aria-label={`Step ${idx + 1} value`}
                />
                {steps.length > 2 && (
                  <button
                    onClick={() => removeStep(idx)}
                    className="text-edge-muted hover:text-red-400 text-sm"
                    aria-label={`Remove step ${idx + 1}`}
                  >
                    &#10005;
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={addStep}
              className="text-edge-700 hover:text-edge-600 font-mono text-sm"
            >
              + Add Step
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setIsCreating(false)}
              className="text-edge-700 hover:text-edge-600 font-mono text-sm px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!name || steps.some((s) => !s.value)}
              className="bg-edge-700 hover:bg-edge-600 disabled:opacity-50 disabled:cursor-not-allowed text-edge-400 font-mono text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Save Funnel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
