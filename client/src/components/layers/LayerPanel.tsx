import { useState, useRef } from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { AnnotationLayer } from '../../types';

interface Props {
  readOnly?: boolean;
}

export default function LayerPanel({ readOnly = false }: Props) {
  const { project, addLayer, updateLayer, removeLayer, reorderLayers, setActiveLayer } =
    useProjectStore();

  const dragItem = useRef<string | null>(null);
  const dragOver = useRef<string | null>(null);

  if (!project) return null;

  const sorted = [...project.layers].sort((a, b) => b.order - a.order);

  const handleDragStart = (id: string) => {
    dragItem.current = id;
  };

  const handleDragEnter = (id: string) => {
    dragOver.current = id;
  };

  const handleDragEnd = () => {
    if (!dragItem.current || !dragOver.current || dragItem.current === dragOver.current) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }
    const ids = sorted.map((l) => l.id);
    const fromIdx = ids.indexOf(dragItem.current);
    const toIdx = ids.indexOf(dragOver.current);
    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, dragItem.current);
    // reversed because sorted is top-down (highest order first)
    reorderLayers([...reordered].reverse());
    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <div className="w-52 bg-neutral-800 border-l border-neutral-700 flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Layers</span>
        {!readOnly && (
          <button
            onClick={addLayer}
            title="Add layer"
            className="text-neutral-400 hover:text-white text-lg leading-none"
          >
            +
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            isActive={layer.id === project.activeLayerId}
            readOnly={readOnly}
            onSelect={() => !readOnly && setActiveLayer(layer.id)}
            onToggleVisible={() => updateLayer(layer.id, { visible: !layer.visible })}
            onRename={(name) => updateLayer(layer.id, { name })}
            onRemove={() => removeLayer(layer.id)}
            onOpacityChange={(opacity) => updateLayer(layer.id, { opacity })}
            onDragStart={() => handleDragStart(layer.id)}
            onDragEnter={() => handleDragEnter(layer.id)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

interface RowProps {
  layer: AnnotationLayer;
  isActive: boolean;
  readOnly: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
  onOpacityChange: (opacity: number) => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
}

function LayerRow({
  layer, isActive, readOnly, onSelect, onToggleVisible, onRename, onRemove,
  onOpacityChange, onDragStart, onDragEnter, onDragEnd,
}: RowProps) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(layer.name);

  const commitName = () => {
    setEditing(false);
    if (nameVal.trim()) onRename(nameVal.trim());
    else setNameVal(layer.name);
  };

  return (
    <div
      draggable={!readOnly}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onClick={onSelect}
      className={`flex flex-col px-2 py-1.5 border-b border-neutral-700 cursor-pointer transition-colors ${
        isActive ? 'bg-blue-900/40' : 'hover:bg-neutral-700/50'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {/* Visibility toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
          className="text-xs w-5 text-center shrink-0"
        >
          {layer.visible ? '👁' : '🙈'}
        </button>

        {/* Name */}
        {editing && !readOnly ? (
          <input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setEditing(false); setNameVal(layer.name); } }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-xs bg-neutral-600 text-white rounded px-1 outline-none min-w-0"
          />
        ) : (
          <span
            onDoubleClick={(e) => { if (!readOnly) { e.stopPropagation(); setEditing(true); } }}
            className="flex-1 text-xs text-neutral-200 truncate"
            title={layer.name}
          >
            {layer.name}
          </span>
        )}

        {/* Remove */}
        {!readOnly && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            title="Delete layer"
            className="text-neutral-500 hover:text-red-400 text-xs shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {/* Opacity slider */}
      <div className="flex items-center gap-1.5 mt-1 pl-6">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={layer.opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-1 accent-blue-500"
          title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
        />
        <span className="text-neutral-500 text-[10px] w-7 text-right shrink-0">
          {Math.round(layer.opacity * 100)}%
        </span>
      </div>
    </div>
  );
}
