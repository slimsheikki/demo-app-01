import { create } from 'zustand';
import type { ToolType } from '../types';

interface ToolState {
  activeTool: ToolType;
  color: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  eraserRadius: number;

  setTool: (t: ToolType) => void;
  setColor: (c: string) => void;
  setStrokeWidth: (w: number) => void;
  setOpacity: (o: number) => void;
  setFontSize: (s: number) => void;
  setEraserRadius: (r: number) => void;
}

export const useToolStore = create<ToolState>()((set) => ({
  activeTool: 'pencil',
  color: '#ef4444',
  strokeWidth: 3,
  opacity: 1,
  fontSize: 18,
  eraserRadius: 20,

  setTool: (t) => set({ activeTool: t }),
  setColor: (c) => set({ color: c }),
  setStrokeWidth: (w) => set({ strokeWidth: w }),
  setOpacity: (o) => set({ opacity: o }),
  setFontSize: (s) => set({ fontSize: s }),
  setEraserRadius: (r) => set({ eraserRadius: r }),
}));
