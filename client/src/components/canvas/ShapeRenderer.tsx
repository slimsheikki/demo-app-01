import { Arrow, Ellipse, Line, Rect, Text } from 'react-konva';
import type { Shape } from '../../types';

interface Props {
  shape: Shape;
  onSelect?: (id: string) => void;
  onChange?: (id: string, attrs: Partial<Shape>) => void;
  readOnly?: boolean;
}

export default function ShapeRenderer({ shape, onSelect, readOnly }: Props) {
  const commonProps = {
    id: shape.id,
    opacity: shape.opacity,
    stroke: shape.color,
    strokeWidth: shape.strokeWidth,
    strokeScaleEnabled: false,
    onClick: onSelect && !readOnly ? () => onSelect(shape.id) : undefined,
    onTap: onSelect && !readOnly ? () => onSelect(shape.id) : undefined,
    listening: !readOnly,
  };

  switch (shape.type) {
    case 'pencil':
      return (
        <Line
          {...commonProps}
          points={shape.points}
          tension={shape.tension}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation="source-over"
        />
      );

    case 'rectangle':
      return (
        <Rect
          {...commonProps}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.fill ?? 'transparent'}
        />
      );

    case 'ellipse':
      return (
        <Ellipse
          {...commonProps}
          x={shape.x}
          y={shape.y}
          radiusX={shape.radiusX}
          radiusY={shape.radiusY}
          fill="transparent"
        />
      );

    case 'arrow':
      return (
        <Arrow
          {...commonProps}
          points={[...shape.points]}
          pointerLength={shape.pointerLength}
          pointerWidth={shape.pointerWidth}
          fill={shape.color}
        />
      );

    case 'text':
      return (
        <Text
          {...commonProps}
          x={shape.x}
          y={shape.y}
          text={shape.text}
          fontSize={shape.fontSize}
          fontFamily={shape.fontFamily}
          fill={shape.color}
          stroke={undefined}
          strokeWidth={0}
        />
      );

    default:
      return null;
  }
}
