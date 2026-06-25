import { useToolStore } from '../../store/toolStore';
import type { ToolType } from '../../types';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ffffff', '#d1d5db', '#6b7280', '#111827',
];

const TOOLS: { type: ToolType; label: string; key: string; icon: string }[] = [
  { type: 'select', label: 'Select', key: 'V', icon: '↖' },
  { type: 'pencil', label: 'Pencil', key: 'P', icon: '✏' },
  { type: 'rectangle', label: 'Rectangle', key: 'R', icon: '▭' },
  { type: 'ellipse', label: 'Ellipse', key: 'E', icon: '◯' },
  { type: 'arrow', label: 'Arrow', key: 'A', icon: '→' },
  { type: 'text', label: 'Text', key: 'T', icon: 'T' },
  { type: 'eraser', label: 'Eraser', key: 'X', icon: '⌫' },
];

export default function Toolbar() {
  const { activeTool, color, strokeWidth, setTool, setColor, setStrokeWidth } = useToolStore();

  return (
    <div className="w-14 bg-neutral-800 border-r border-neutral-700 flex flex-col items-center py-3 gap-1 select-none shrink-0">
      {TOOLS.map((t) => (
        <button
          key={t.type}
          title={`${t.label} (${t.key})`}
          onClick={() => setTool(t.type)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
            activeTool === t.type
              ? 'bg-blue-600 text-white'
              : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
          }`}
        >
          {t.icon}
        </button>
      ))}

      <div className="w-8 border-t border-neutral-600 my-2" />

      {/* Color swatches */}
      <div className="grid grid-cols-2 gap-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            title={c}
            className={`w-4 h-4 rounded-sm border-2 transition-transform hover:scale-110 ${
              color === c ? 'border-white scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Custom color */}
      <label className="cursor-pointer" title="Custom color">
        <div
          className="w-7 h-7 rounded-full border-2 border-neutral-500 mt-1 overflow-hidden"
          style={{ backgroundColor: color }}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="sr-only"
        />
      </label>

      <div className="w-8 border-t border-neutral-600 my-2" />

      {/* Stroke width */}
      <div className="flex flex-col items-center gap-1 w-10">
        {[2, 4, 8].map((w) => (
          <button
            key={w}
            title={`Stroke ${w}px`}
            onClick={() => setStrokeWidth(w)}
            className={`w-full flex items-center justify-center rounded transition-colors ${
              strokeWidth === w ? 'bg-blue-600' : 'hover:bg-neutral-700'
            }`}
            style={{ height: Math.max(w + 4, 14) }}
          >
            <div
              className="w-full rounded-full"
              style={{ height: w, backgroundColor: strokeWidth === w ? 'white' : '#9ca3af' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
