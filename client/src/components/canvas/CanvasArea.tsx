import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { useProjectStore } from '../../store/projectStore';
import { useToolStore } from '../../store/toolStore';
import AnnotationLayerComponent from './AnnotationLayer';
import ShapeRenderer from './ShapeRenderer';
import { useDrawing } from '../../hooks/useDrawing';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import type { Shape } from '../../types';

interface Props {
  readOnly?: boolean;
}

export default function CanvasArea({ readOnly = false }: Props) {
  const { project, updateShape, setMediaUrl } = useProjectStore();
  const { activeTool } = useToolStore();

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

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

  if (!project) return null;

  const mediaW = project.media.width;
  const mediaH = project.media.height;

  // Compute scale to fit the stage inside the container, preserving aspect ratio
  const scaleX = containerSize.width / mediaW;
  const scaleY = containerSize.height / mediaH;
  const scale = Math.min(scaleX, scaleY, 1);

  const stageW = mediaW * scale;
  const stageH = mediaH * scale;

  const cursor =
    activeTool === 'eraser'
      ? 'cell'
      : activeTool === 'select'
      ? 'default'
      : 'crosshair';

  const sortedLayers = [...project.layers].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-neutral-900 flex items-center justify-center"
    >
      <div style={{ width: stageW, height: stageH, cursor }}>
        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={readOnly ? undefined : handleMouseDown}
          onMouseMove={readOnly ? undefined : handleMouseMove}
          onMouseUp={readOnly ? undefined : handleMouseUp}
          onMouseLeave={readOnly ? undefined : handleMouseUp}
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
    </div>
  );
}
