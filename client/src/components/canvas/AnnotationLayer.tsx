import { Layer, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';
import type Konva from 'konva';
import ShapeRenderer from './ShapeRenderer';
import type { AnnotationLayer as LayerType, Shape } from '../../types';

interface Props {
  layer: LayerType;
  shapes: Shape[];
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  onShapeChange: (id: string, attrs: Partial<Shape>) => void;
  readOnly?: boolean;
  isActiveLayer: boolean;
}

// Only rect and ellipse support the resize transformer
function isTransformable(shape: Shape | undefined): shape is Shape & { type: 'rectangle' | 'ellipse' } {
  return shape?.type === 'rectangle' || shape?.type === 'ellipse';
}

export default function AnnotationLayerComponent({
  layer,
  shapes,
  selectedShapeId,
  onSelectShape,
  onShapeChange,
  readOnly,
  isActiveLayer,
}: Props) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    const tr = transformerRef.current;
    const l = layerRef.current;
    if (!tr || !l) return;

    if (selectedShapeId && isActiveLayer) {
      const node = l.findOne(`#${selectedShapeId}`);
      const shape = shapes.find((s) => s.id === selectedShapeId);
      if (node && isTransformable(shape)) {
        tr.nodes([node]);
      } else {
        tr.nodes([]);
      }
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedShapeId, isActiveLayer, shapes]);

  if (!layer.visible) return null;

  const layerShapes = shapes.filter((s) => s.layerId === layer.id);

  return (
    <Layer ref={layerRef} opacity={layer.opacity} listening={!readOnly && isActiveLayer}>
      {layerShapes.map((shape) => (
        <ShapeRenderer
          key={shape.id}
          shape={shape}
          onSelect={isActiveLayer ? onSelectShape : undefined}
          onChange={isActiveLayer ? onShapeChange : undefined}
          readOnly={readOnly || !isActiveLayer}
        />
      ))}
      {!readOnly && isActiveLayer && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          boundBoxFunc={(_oldBox, newBox) => newBox}
          onTransformEnd={() => {
            const tr = transformerRef.current;
            if (!tr) return;
            const nodes = tr.nodes();
            nodes.forEach((node) => {
              const shapeId = node.id();
              const shape = shapes.find((s) => s.id === shapeId);
              if (!shape) return;

              if (shape.type === 'rectangle') {
                onShapeChange(shapeId, {
                  x: node.x(),
                  y: node.y(),
                  width: node.width() * node.scaleX(),
                  height: node.height() * node.scaleY(),
                } as Partial<Shape>);
              } else if (shape.type === 'ellipse') {
                onShapeChange(shapeId, {
                  x: node.x(),
                  y: node.y(),
                  radiusX: (node.width() * node.scaleX()) / 2,
                  radiusY: (node.height() * node.scaleY()) / 2,
                } as Partial<Shape>);
              }

              node.scaleX(1);
              node.scaleY(1);
            });
          }}
        />
      )}
    </Layer>
  );
}
