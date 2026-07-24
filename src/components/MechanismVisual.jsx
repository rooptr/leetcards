import { useEffect, useMemo, useReducer } from 'react';
import { createSimulationState, simulationReducer } from '../data/simulation.js';

const isMatrix = (values) => Array.isArray(values?.[0]);

const displayValue = (value) => (
  value && typeof value === 'object' ? value.label ?? value.value ?? value.id : value
);

const identityFor = (value, index) => (
  value && typeof value === 'object' ? value.id ?? index : `${String(value)}-${index}`
);

const isActive = (frame, value, index, rowIndex = null) => {
  const shown = displayValue(value);
  const candidates = [shown, value?.id, index, String(index)];
  if (rowIndex !== null) candidates.push(`${rowIndex}:${index}`);
  return candidates.some((candidate) => frame.active?.includes(candidate));
};

function ValueCell({ value, active, discarded, className = '' }) {
  const classes = [
    'visual-cell',
    active ? 'is-active' : '',
    discarded ? 'is-discarded' : '',
    className,
  ].filter(Boolean).join(' ');
  return <span className={classes}>{String(displayValue(value))}</span>;
}

function ArrayVisual({ frame, kind }) {
  const pointerEntries = Object.entries(frame.pointers ?? {});
  const window = frame.window ?? (kind === 'window' ? frame.bounds : null);
  const windowStart = window?.[0];
  const windowEnd = window?.[1];

  return (
    <div
      className={`array-stage ${window ? 'has-window' : ''}`}
      style={{ '--cell-count': frame.values.length }}
    >
      {window && (
        <div
          className="window-span"
          style={{
            '--window-start': Number(windowStart),
            '--window-width': Number(windowEnd) - Number(windowStart) + 1,
            '--cell-count': frame.values.length,
          }}
        >
          current window [{windowStart}, {windowEnd}]
        </div>
      )}
      {pointerEntries.length > 0 && (
        <div className="pointer-lane" aria-label="Pointer positions">
          {pointerEntries.map(([name, position]) => (
            <span
              className="array-pointer"
              key={name}
              style={{ '--pointer-index': Number(position), '--cell-count': frame.values.length }}
            >
              {name} ↓
            </span>
          ))}
        </div>
      )}
      <div className="visual-array">
        {frame.values.map((value, index) => {
          const inWindow = window && index >= window[0] && index <= window[1];
          return (
            <span
              className={`array-position ${inWindow ? 'is-in-window' : ''}`}
              key={identityFor(value, index)}
            >
              <small>{index}</small>
              <ValueCell
                value={value}
                active={isActive(frame, value, index)}
                discarded={frame.discarded?.includes(index)}
                className={frame.entering === index ? 'is-entering' : frame.leaving === index ? 'is-leaving' : ''}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function addressFor(value) {
  if (value && typeof value === 'object' && value.address) return value.address;
  const identity = String(displayValue(value)).match(/[A-Za-z0-9]+/)?.[0] ?? String(displayValue(value));
  const ordinal = /^[A-Z]$/.test(identity) ? identity.charCodeAt(0) - 65 : identity.length;
  return `@0x${(0x20 + ordinal * 0x10).toString(16)}`;
}

function LinkedListVisual({ frame }) {
  const explicitLinks = frame.links ?? [];
  const nodes = frame.nodes ?? frame.values.map((value, index) => ({
    id: identityFor(value, index),
    label: displayValue(value),
    address: addressFor(value),
  }));

  return (
    <div className="visual-linked-list">
      {nodes.map((node, index) => {
        const next = explicitLinks.find((link) => link.from === node.id)?.to
          ?? (index < nodes.length - 1 ? nodes[index + 1].id : null);
        return (
          <span className="linked-item" key={node.id}>
            <span className="linked-node-wrap">
              <ValueCell
                value={node.label}
                active={frame.active?.includes(node.id) || isActive(frame, node.label, index)}
                className="linked-node"
              />
              <small>{node.address ?? addressFor(node.label)}</small>
            </span>
            {next && <span className="linked-arrow" aria-label={`points to ${next}`}>→</span>}
          </span>
        );
      })}
    </div>
  );
}

function TreeVisual({ frame, recursive = false }) {
  const values = frame.tree?.nodes
    ? frame.tree.nodes.map((node) => node.label)
    : frame.values;
  const positions = values.map((value, index) => {
    const depth = Math.floor(Math.log2(index + 1));
    const offset = index - (2 ** depth - 1);
    return {
      value,
      index,
      x: ((offset + 1) * 320) / (2 ** depth + 1),
      y: 28 + depth * 58,
      active: isActive(frame, value, index),
    };
  });
  const height = Math.max(100, 60 + Math.floor(Math.log2(Math.max(values.length, 1))) * 58);

  return (
    <svg
      className={`visual-tree ${recursive ? 'is-recursive' : ''}`}
      viewBox={`0 0 320 ${height}`}
      role="img"
      aria-label={recursive ? 'Recursive state tree with active path' : 'Tree with active path'}
    >
      {positions.slice(1).filter((node) => node.value !== null).map((node) => {
        const parent = positions[Math.floor((node.index - 1) / 2)];
        if (!parent || parent.value === null) return null;
        return (
          <line
            className={node.active && parent.active ? 'tree-edge is-active' : 'tree-edge'}
            key={`edge-${node.index}`}
            x1={parent.x}
            y1={parent.y}
            x2={node.x}
            y2={node.y}
          />
        );
      })}
      {positions.filter((node) => node.value !== null).map((node) => (
        <g className={node.active ? 'tree-node is-active' : 'tree-node'} key={`${node.value}-${node.index}`}>
          <circle cx={node.x} cy={node.y} r="18" />
          <text x={node.x} y={node.y} dominantBaseline="middle" textAnchor="middle">{String(node.value)}</text>
        </g>
      ))}
    </svg>
  );
}

function GridVisual({ frame, dependency = false }) {
  const rows = frame.matrix ?? (isMatrix(frame.values) ? frame.values : [frame.values]);
  const dependencies = new Set(frame.dependencies ?? []);
  return (
    <div className="visual-grid">
      {rows.map((row, rowIndex) => (
        <div className="visual-row" key={rowIndex}>
          {row.map((value, index) => (
            <ValueCell
              key={`${rowIndex}-${index}`}
              value={value}
              active={isActive(frame, value, index, rowIndex)}
              className={dependency && dependencies.has(`${rowIndex}:${index}`) ? 'is-dependency' : ''}
            />
          ))}
        </div>
      ))}
      {dependency && frame.dependencies?.length > 0 && (
        <span className="dependency-note">Highlighted cells feed the current transition.</span>
      )}
    </div>
  );
}

function StackQueueVisual({ frame, kind }) {
  const queueFrame = kind === 'queue' || /queue|head|tail/i.test(`${frame.caption} ${frame.markers?.join(' ')}`);
  const values = frame.stack ?? frame.queue ?? frame.values;

  if (!queueFrame) {
    return (
      <div className="visual-stack" aria-label="Stack with one push and pop end">
        <span className="stack-end">top: push / pop</span>
        {[...values].reverse().map((value, index) => (
          <ValueCell key={identityFor(value, index)} value={value} active={isActive(frame, value, values.length - index - 1)} />
        ))}
        <span className="stack-bottom">bottom</span>
      </div>
    );
  }

  return (
    <div className="visual-queue" aria-label="Queue with independent enqueue and dequeue ends">
      <span className="flow-label">dequeue ←</span>
      <div className="stack-lane">
        {values.map((value, index) => (
          <ValueCell key={identityFor(value, index)} value={value} active={isActive(frame, value, index)} />
        ))}
      </div>
      <span className="flow-label">← enqueue</span>
    </div>
  );
}

function CircularBufferVisual({ frame }) {
  const capacity = frame.capacity ?? frame.values.length;
  const values = [...frame.values, ...Array(Math.max(0, capacity - frame.values.length)).fill('·')].slice(0, capacity);
  return (
    <div className="circular-buffer" aria-label={`Circular buffer with ${capacity} slots`}>
      {values.map((value, index) => (
        <span
          className={`ring-slot ${index === frame.head ? 'is-head' : ''} ${index === frame.tail ? 'is-tail' : ''}`}
          key={`${index}-${value}`}
          style={{ '--slot': index, '--capacity': capacity }}
        >
          <ValueCell value={value} active={isActive(frame, value, index)} />
          <small>{index === frame.head ? 'head' : index === frame.tail ? 'tail' : index}</small>
        </span>
      ))}
      <span className="ring-state">{frame.full ? 'full' : frame.empty ? 'empty' : `${values.filter((value) => value !== '·').length}/${capacity}`}</span>
    </div>
  );
}

function BucketVisual({ frame }) {
  const rows = frame.buckets ?? frame.values;
  return (
    <div className="visual-buckets">
      {rows.map((entry, index) => {
        const text = typeof entry === 'object'
          ? `${entry.index}:${(entry.items ?? []).join('→')}`
          : String(entry);
        const [bucket, ...contents] = text.split(':');
        return (
          <div className={isActive(frame, entry, index) ? 'bucket-row is-active' : 'bucket-row'} key={`${bucket}-${index}`}>
            <code className="bucket-index">{bucket}</code>
            <span className="bucket-slot">{contents.join(':') || '·'}</span>
          </div>
        );
      })}
    </div>
  );
}

function TimelineVisual({ frame }) {
  return (
    <div className="visual-timeline">
      <span className="timeline-rail" aria-hidden="true" />
      {frame.values.map((value, index) => (
        <span className="timeline-event" key={identityFor(value, index)}>
          <span className={`timeline-dot ${isActive(frame, value, index) ? 'is-active' : ''}`} />
          <code>{String(displayValue(value))}</code>
        </span>
      ))}
    </div>
  );
}

function SignalLaneVisual({ frame }) {
  return (
    <div className="signal-lanes" role="img" aria-label="Protocol signal lanes">
      {frame.values.map((value, index) => {
        const [label, ...signal] = String(value).split(':');
        return (
          <div className={isActive(frame, value, index) ? 'signal-lane is-active' : 'signal-lane'} key={`${label}-${index}`}>
            <span>{label}</span>
            <code>{signal.join(':').trim() || String(value)}</code>
          </div>
        );
      })}
    </div>
  );
}

function FrameState({ frame, kind }) {
  if (kind === 'linked-list') return <LinkedListVisual frame={frame} />;
  if (kind === 'tree') return <TreeVisual frame={frame} />;
  if (kind === 'recursion-tree') return <TreeVisual frame={frame} recursive />;
  if (kind === 'grid' || kind === 'dp-grid') return <GridVisual frame={frame} dependency={kind === 'dp-grid'} />;
  if (kind === 'circular-buffer' || frame.capacity) return <CircularBufferVisual frame={frame} />;
  if (kind === 'stack-queue' || kind === 'queue' || kind === 'stack') return <StackQueueVisual frame={frame} kind={kind} />;
  if (kind === 'buckets') return <BucketVisual frame={frame} />;
  if (kind === 'signals') return <SignalLaneVisual frame={frame} />;
  if (kind === 'timeline') return <TimelineVisual frame={frame} />;
  return <ArrayVisual frame={frame} kind={kind} />;
}

export default function MechanismVisual({ block }) {
  const frames = block.frames?.length ? block.frames : [{ caption: 'No simulation data.', values: [] }];
  const initial = useMemo(() => createSimulationState(frames.length), [frames.length]);
  const [state, dispatch] = useReducer(simulationReducer, initial);
  const currentFrame = frames[state.step];
  const nextFrame = frames[state.step + 1];
  const hasWindow = Boolean(currentFrame.window ?? currentFrame.bounds);
  const legendItems = [
    currentFrame.active?.length > 0 && ['is-active', 'active decision'],
    hasWindow && ['is-window', 'candidate window'],
    currentFrame.entering !== undefined && ['is-entering', 'entering'],
    currentFrame.leaving !== undefined && ['is-leaving', 'leaving'],
    currentFrame.discarded?.length > 0 && ['is-discarded', 'proven irrelevant'],
  ].filter(Boolean);

  useEffect(() => {
    dispatch({ type: 'reset' });
  }, [block, frames.length]);

  useEffect(() => {
    if (!state.playing) return undefined;
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), 950);
    return () => window.clearInterval(timer);
  }, [state.playing]);

  return (
    <figure className="mechanism-visual" data-kind={block.kind}>
      <div className="simulator-stage">
        <div className="simulator-header">
          <span>State trace</span>
          <output aria-live="polite">Step {state.step + 1} / {frames.length}</output>
        </div>
        <div className="visual-frame">
          <FrameState frame={currentFrame} kind={block.kind} />
          {currentFrame.markers?.length > 0 && (
            <div className="visual-markers">
              {currentFrame.markers.map((marker) => <code key={marker}>{marker}</code>)}
            </div>
          )}
          {legendItems.length > 0 && (
            <div className="visual-legend" aria-label="Visual state legend">
              {legendItems.map(([className, label]) => (
                <span key={label}><i className={className} />{label}</span>
              ))}
            </div>
          )}
        </div>
        <div className="simulator-reasoning">
          <div>
            <span>What changed</span>
            <p aria-live="polite">{currentFrame.caption}</p>
          </div>
          {block.invariant && (
            <div>
              <span>Rule being preserved</span>
              <p>{block.invariant}</p>
            </div>
          )}
          <div>
            <span>{nextFrame ? 'Next move' : 'Result'}</span>
            <p>{nextFrame?.caption ?? 'The trace is complete. Recheck the invariant against the final state.'}</p>
          </div>
        </div>
      </div>

      <div className="simulator-controls">
        <button
          type="button"
          aria-label="Previous step"
          disabled={state.step === 0}
          onClick={() => dispatch({ type: 'previous' })}
        >
          Previous
        </button>
        <button
          type="button"
          aria-label={state.playing ? 'Pause simulation' : 'Play simulation'}
          onClick={() => dispatch({ type: 'toggle' })}
        >
          {state.playing ? 'Pause' : state.step === frames.length - 1 ? 'Replay' : 'Play'}
        </button>
        <button
          type="button"
          aria-label="Next step"
          disabled={state.step === frames.length - 1}
          onClick={() => dispatch({ type: 'next' })}
        >
          Next
        </button>
      </div>
      <figcaption>Advance only after you can explain why the highlighted state makes the next move safe.</figcaption>
    </figure>
  );
}
