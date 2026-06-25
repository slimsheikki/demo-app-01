import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { useProjectStore } from '../../store/projectStore';
import { useToolStore } from '../../store/toolStore';
import AnnotationLayerComponent from './AnnotationLayer';
import ShapeRenderer from './ShapeRenderer';
import { useDrawing } from '../../hooks/useDrawing';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { createTextShape } from '../../utils/shapeFactory';
import type { Shape } from '../../types';

interface Props {
  readOnly?: boolean;
}

interface TextEditState {
  shapeId: string | null;
  x: number;
  y: number;
  initialText: string;
}

export default function CanvasArea({ readOnly = false }: Props) {
  const { project, addShape, updateShape, setMediaUrl } = useProjectStore();
  const { activeTool, color, strokeWidth, opacity, fontSize } = useToolStore();

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [textEdit, setTextEdit] = useState<TextEditState | null>(null);
  const [textValue, setTextValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useKeyboardShortcuts(selectedShapeId, setSelectedShapeId);

  // Load image when media URL changes
  useEffect(() => {
    if (!project?.media.url) return;
    const img = new window.Image();
    img.src = project.media.url;
    img.onload = () => setImage(img);
  }, [project?.media.url]);

  // Listen for background upload completion
  useEffect(() => {
    const handler = (e: Event) => {
      const { url } = (e as CustomEvent<{ url: string }>).detail;
      setMediaUrl(url);
    };
    window.addEventListener('mediaUploaded', handler);
    return () => window.removeEventListener('mediaUploaded', handler);
  }, [setMediaUrl]);

  // Listen for double-click text edit requests from ShapeRenderer
  useEffect(() => {
    const handler = (e: Event) => {
      const { shapeId, x, y, text } = (e as CustomEvent<{ shapeId: string; x: number; y: number; text: string }>).detail;
      setTextEdit({ shapeId, x, y, initialText: text });
      setTextValue(text);
    };
    window.addEventListener('textEditRequested', handler);
    return () => window.removeEventListener('textEditRequested', handler);
  }, []);

  // Focus textarea when it appears
  useEffect(() => {
    if (textEdit && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [textEdit]);

  // Measure container to compute CSS scale
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { inProgressShape, handleMouseDown, handleMouseMove, handleMouseUp } = useDrawing(
    selectedShapeId,
    setSelectedShapeId
  );

  const handleShapeChange = useCallback(
    (id: string, attrs: Partial<Shape>) => {
      updateShape(id, attrs);
    },
    [updateShape]
  );

  const commitTextEdit = useCallback(() => {
    if (!textEdit || !project) return;
    const trimmed = textValue.trim();
    if (trimmed) {
      if (textEdit.shapeId) {
        updateShape(textEdit.shapeId, { text: trimmed } as Partial<Shape>);
      } else {
        const activeLayer = project.layers.find((l) => l.id === project.activeLayerId);
        if (activeLayer && !activeLayer.locked) {
          addShape(
            createTextShape({
              layerId: project.activeLayerId,
              color,
              strokeWidth,
              opacity,
              x: textEdit.x,
              y: textEdit.y,
              fontSize,
              text: trimmed,
            })
          );
        }
      }
    }
    setTextEdit(null);
    setTextValue('');
  }, [textEdit, textValue, project, addShape, updateShape, color, strokeWidth, opacity, fontSize]);

  if (!project) return null;

  const mediaW = project.media.width;
  const mediaH = project.media.height;

  const scaleX = containerSize.width / mediaW;
  const scaleY = containerSize.height / mediaH;
  const scale = Math.min(scaleX, scaleY, 1);

  const stageW = mediaW * scale;
  const stageH = mediaH * scale;

  // Stage offset within the centered container
  const stageLeft = (containerSize.width - stageW) / 2;
  const stageTop = (containerSize.height - stageH) / 2;

  const cursor =
    activeTool === 'eraser'
      ? 'cell'
      : activeTool === 'select'
      ? 'default'
      : activeTool === 'text'
      ? 'text'
      : 'crosshair';

  const sortedLayers = [...project.layers].sort((a, b) => a.order - b.order);

  // Intercept stage mousedown for the text tool before passing to useDrawing
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (activeTool === 'text' && !readOnly) {
        const stage = e.target.getStage();
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;
        const ix = pos.x / scale;
        const iy = pos.y / scale;
        setTextEdit({ shapeId: null, x: ix, y: iy, initialText: '' });
        setTextValue('');
        return;
      }
      handleMouseDown(e);
    },
    [activeTool, readOnly, scale, handleMouseDown]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-neutral-900 flex items-center justify-center relative"
    >
      <div style={{ width: stageW, height: stageH, cursor }}>
        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={readOnly ? undefined : handleStageMouseDown}
          onMouseMove={readOnly ? undefined : handleMouseMove}
          onMouseUp={readOnly ? undefined : handleMouseUp}
          onMouseLeave={readOnly ? undefined : handleMouseUp}
          onTouchStart={readOnly ? undefined : handleStageMouseDown}
          onTouchMove={readOnly ? undefined : handleMouseMove}
          onTouchEnd={readOnly ? undefined : handleMouseUp}
        >
          {/* Base image layer */}
          <Layer listening={false}>
            {image && (
              <KonvaImage
                image={image}
                x={0}
                y={0}
                width={mediaW}
                height={mediaH}
              />
            )}
          </Layer>

          {/* Annotation layers */}
          {sortedLayers.map((layer) => (
            <AnnotationLayerComponent
              key={layer.id}
              layer={layer}
              shapes={project.shapes}
              selectedShapeId={selectedShapeId}
              onSelectShape={setSelectedShapeId}
              onShapeChange={handleShapeChange}
              readOnly={readOnly}
              isActiveLayer={layer.id === project.activeLayerId && !readOnly}
            />
          ))}

          {/* In-progress shape (drawn on top) */}
          {inProgressShape && (
            <Layer listening={false}>
              <ShapeRenderer shape={inProgressShape} readOnly />
            </Layer>
          )}
        </Stage>
      </div>

      {/* Floating text editor */}
      {textEdit && !readOnly && (
        <textarea
          ref={textareaRef}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={commitTextEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitTextEdit();
            }
            if (e.key === 'Escape') {
              setTextEdit(null);
              setTextValue('');
            }
          }}
          style={{
            position: 'absolute',
            left: stageLeft + textEdit.x * scale,
            top: stageTop + textEdit.y * scale,
            fontSize: fontSize * scale,
            color,
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 4,
            padding: '2px 4px',
            minWidth: 120,
            outline: 'none',
            resize: 'none',
            lineHeight: 1.2,
            fontFamily: 'sans-serif',
            zIndex: 10,
            rows: 1,
          } as React.CSSProperties}
          rows={1}
          placeholder="Type text…"
        />
      )}
    </div>
  );
}
