import { nanoid } from 'nanoid';
import type {
  Shape,
  PencilShape,
  RectShape,
  EllipseShape,
  ArrowShape,
  TextShape,
  ToolType,
} from '../types';

interface BaseOpts {
  layerId: string;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export function createPencilShape(opts: BaseOpts): PencilShape {
  return { id: nanoid(), type: 'pencil', points: [], tension: 0.5, ...opts };
}

export function createRectShape(
  opts: BaseOpts & { x: number; y: number }
): RectShape {
  return { id: nanoid(), type: 'rectangle', width: 0, height: 0, ...opts };
}

export function createEllipseShape(
  opts: BaseOpts & { x: number; y: number }
): EllipseShape {
  return { id: nanoid(), type: 'ellipse', radiusX: 0, radiusY: 0, ...opts };
}

export function createArrowShape(
  opts: BaseOpts & { x: number; y: number }
): ArrowShape {
  return {
    id: nanoid(),
    type: 'arrow',
    points: [opts.x, opts.y, opts.x, opts.y],
    pointerLength: 12,
    pointerWidth: 10,
    ...opts,
  };
}

export function createTextShape(
  opts: BaseOpts & { x: number; y: number; fontSize: number }
): TextShape {
  return { id: nanoid(), type: 'text', text: 'Text', fontFamily: 'sans-serif', ...opts };
}

export function isShapeType(tool: ToolType): tool is Shape['type'] {
  return ['pencil', 'rectangle', 'ellipse', 'arrow', 'text'].includes(tool);
}
