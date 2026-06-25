export type ToolType = 'pencil' | 'rectangle' | 'ellipse' | 'arrow' | 'text' | 'eraser' | 'select';

interface BaseShape {
  id: string;
  layerId: string;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface PencilShape extends BaseShape {
  type: 'pencil';
  points: number[];
  tension: number;
}

export interface RectShape extends BaseShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
}

export interface EllipseShape extends BaseShape {
  type: 'ellipse';
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
}

export interface ArrowShape extends BaseShape {
  type: 'arrow';
  points: [number, number, number, number];
  pointerLength: number;
  pointerWidth: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
}

export type Shape = PencilShape | RectShape | EllipseShape | ArrowShape | TextShape;

export interface AnnotationLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  order: number;
}

export interface MediaFile {
  type: 'image';
  originalName: string;
  url: string;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  media: MediaFile;
  layers: AnnotationLayer[];
  shapes: Shape[];
  activeLayerId: string;
}

export interface ShareToken {
  token: string;
  projectId: string;
  canAnnotate: boolean;
  createdAt: string;
}
