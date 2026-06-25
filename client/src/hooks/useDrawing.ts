import { useState, useCallback, useRef } from 'react';
import type Konva from 'konva';
import type { Shape } from '../types';
import { useToolStore } from '../store/toolStore';
import { useProjectStore } from '../store/projectStore';
import {
  createPencilShape,
  createRectShape,
  createEllipseShape,
  createArrowShape,
  createTextShape,
} from '../utils/shapeFactory';

type DrawingState = 'idle' | 'drawing';

interface UseDrawingReturn {
  inProgressShape: Shape | null;
  drawingState: DrawingState;
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseUp: () => void;
}

export function useDrawing(_selectedShapeId: string | null, setSelectedShapeId: (id: string | null) => void): UseDrawingReturn {
  const [drawingState, setDrawingState] = useState<DrawingState>('idle');
  const [inProgressShape, setInProgressShape] = useState<Shape | null>(null);
  const moveCountRef = useRef(0);

  const { activeTool, color, strokeWidth, opacity, fontSize, eraserRadius } = useToolStore();
  const { project, addShape, removeShapes } = useProjectStore();

  const getPos = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    const scale = stage.scaleX();
    return { x: pos.x / scale, y: pos.y / scale };
  };

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!project) return;
      const activeLayer = project.layers.find((l) => l.id === project.activeLayerId);
      if (!activeLayer || activeLayer.locked) return;

      if (activeTool === 'select') {
        if (e.target === e.target.getStage()) setSelectedShapeId(null);
        return;
      }

      if (activeTool === 'eraser') {
        const pos = getPos(e);
        if (!pos) return;
        // Collect shapes in active layer whose bounding box overlaps eraser circle
        const toRemove = project.shapes
          .filter((s) => s.layerId === project.activeLayerId)
          .filter((s) => {
            if (s.type === 'pencil') {
              for (let i = 0; i < s.points.length; i += 2) {
                const dx = s.points[i] - pos.x;
                const dy = s.points[i + 1] - pos.y;
                if (Math.sqrt(dx * dx + dy * dy) <= eraserRadius) return true;
              }
              return false;
            }
            const bbox = getShapeBBox(s);
            return pointNearRect(pos, bbox, eraserRadius);
          })
          .map((s) => s.id);
        if (toRemove.length > 0) removeShapes(toRemove);
        return;
      }

      const pos = getPos(e);
      if (!pos) return;

      const baseOpts = {
        layerId: project.activeLayerId,
        color,
        strokeWidth,
        opacity,
      };

      let shape: Shape | null = null;

      switch (activeTool) {
        case 'pencil':
          shape = createPencilShape(baseOpts);
          (shape as ReturnType<typeof createPencilShape>).points = [pos.x, pos.y];
          break;
        case 'rectangle':
          shape = createRectShape({ ...baseOpts, x: pos.x, y: pos.y });
          break;
        case 'ellipse':
          shape = createEllipseShape({ ...baseOpts, x: pos.x, y: pos.y });
          break;
        case 'arrow':
          shape = createArrowShape({ ...baseOpts, x: pos.x, y: pos.y });
          break;
        case 'text':
          shape = createTextShape({ ...baseOpts, x: pos.x, y: pos.y, fontSize });
          break;
      }

      if (!shape) return;
      moveCountRef.current = 0;
      setInProgressShape(shape);
      setDrawingState('drawing');
    },
    [project, activeTool, color, strokeWidth, opacity, fontSize, eraserRadius, removeShapes, setSelectedShapeId]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (drawingState !== 'drawing' || !inProgressShape) return;
      const pos = getPos(e);
      if (!pos) return;

      moveCountRef.current++;

      setInProgressShape((prev) => {
        if (!prev) return prev;

        switch (prev.type) {
          case 'pencil': {
            // Downsample: add every point but skip intermediates every 2 moves for perf
            const newPoints =
              moveCountRef.current % 2 === 0
                ? [...prev.points, pos.x, pos.y]
                : prev.points;
            return { ...prev, points: newPoints };
          }
          case 'rectangle': {
            const x = Math.min(prev.x, pos.x);
            const y = Math.min(prev.y, pos.y);
            return { ...prev, x, y, width: Math.abs(pos.x - prev.x), height: Math.abs(pos.y - prev.y) };
          }
          case 'ellipse': {
            return {
              ...prev,
              radiusX: Math.abs(pos.x - prev.x),
              radiusY: Math.abs(pos.y - prev.y),
            };
          }
          case 'arrow': {
            return { ...prev, points: [prev.points[0], prev.points[1], pos.x, pos.y] };
          }
          default:
            return prev;
        }
      });
    },
    [drawingState, inProgressShape]
  );

  const handleMouseUp = useCallback(() => {
    if (drawingState !== 'drawing' || !inProgressShape) return;

    // Only commit if shape has meaningful size
    let meaningful = true;
    if (inProgressShape.type === 'pencil' && inProgressShape.points.length < 4) meaningful = false;
    if (inProgressShape.type === 'rectangle' && (inProgressShape.width < 2 || inProgressShape.height < 2)) meaningful = false;
    if (inProgressShape.type === 'ellipse' && (inProgressShape.radiusX < 2 || inProgressShape.radiusY < 2)) meaningful = false;

    if (meaningful) {
      addShape(inProgressShape);
    }

    setInProgressShape(null);
    setDrawingState('idle');
  }, [drawingState, inProgressShape, addShape]);

  return { inProgressShape, drawingState, handleMouseDown, handleMouseMove, handleMouseUp };
}

function getShapeBBox(shape: Shape): { x: number; y: number; w: number; h: number } {
  switch (shape.type) {
    case 'rectangle':
      return { x: shape.x, y: shape.y, w: shape.width, h: shape.height };
    case 'ellipse':
      return { x: shape.x - shape.radiusX, y: shape.y - shape.radiusY, w: shape.radiusX * 2, h: shape.radiusY * 2 };
    case 'arrow':
      return {
        x: Math.min(shape.points[0], shape.points[2]),
        y: Math.min(shape.points[1], shape.points[3]),
        w: Math.abs(shape.points[2] - shape.points[0]),
        h: Math.abs(shape.points[3] - shape.points[1]),
      };
    case 'text':
      return { x: shape.x, y: shape.y, w: shape.fontSize * shape.text.length * 0.6, h: shape.fontSize };
    default:
      return { x: 0, y: 0, w: 0, h: 0 };
  }
}

function pointNearRect(
  p: { x: number; y: number },
  bbox: { x: number; y: number; w: number; h: number },
  radius: number
): boolean {
  return (
    p.x >= bbox.x - radius &&
    p.x <= bbox.x + bbox.w + radius &&
    p.y >= bbox.y - radius &&
    p.y <= bbox.y + bbox.h + radius
  );
}
