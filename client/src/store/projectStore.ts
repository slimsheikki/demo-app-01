import { create } from 'zustand';
import { temporal } from 'zundo';
import { nanoid } from 'nanoid';
import type { Project, AnnotationLayer, Shape } from '../types';

interface ProjectState {
  project: Project | null;
  isViewer: boolean;

  setProject: (p: Project, viewer?: boolean) => void;
  clearProject: () => void;

  addLayer: () => void;
  updateLayer: (id: string, patch: Partial<AnnotationLayer>) => void;
  removeLayer: (id: string) => void;
  reorderLayers: (orderedIds: string[]) => void;
  setActiveLayer: (id: string) => void;

  addShape: (shape: Shape) => void;
  updateShape: (id: string, patch: Partial<Shape>) => void;
  removeShape: (id: string) => void;
  removeShapes: (ids: string[]) => void;

  updateProjectTitle: (title: string) => void;
  setProjectId: (id: string) => void;
  setMediaUrl: (url: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  temporal(
    (set) => ({
      project: null,
      isViewer: false,

      setProject: (p, viewer = false) => set({ project: p, isViewer: viewer }),
      clearProject: () => set({ project: null, isViewer: false }),

      addLayer: () =>
        set((s) => {
          if (!s.project) return s;
          const newLayer: AnnotationLayer = {
            id: nanoid(),
            name: `Layer ${s.project.layers.length + 1}`,
            visible: true,
            opacity: 1,
            locked: false,
            order: s.project.layers.length,
          };
          return {
            project: {
              ...s.project,
              layers: [...s.project.layers, newLayer],
              activeLayerId: newLayer.id,
            },
          };
        }),

      updateLayer: (id, patch) =>
        set((s) => {
          if (!s.project) return s;
          return {
            project: {
              ...s.project,
              layers: s.project.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
            },
          };
        }),

      removeLayer: (id) =>
        set((s) => {
          if (!s.project) return s;
          const remaining = s.project.layers.filter((l) => l.id !== id);
          const newActive =
            s.project.activeLayerId === id
              ? (remaining[remaining.length - 1]?.id ?? '')
              : s.project.activeLayerId;
          return {
            project: {
              ...s.project,
              layers: remaining,
              shapes: s.project.shapes.filter((sh) => sh.layerId !== id),
              activeLayerId: newActive,
            },
          };
        }),

      reorderLayers: (orderedIds) =>
        set((s) => {
          if (!s.project) return s;
          const layerMap = new Map(s.project.layers.map((l) => [l.id, l]));
          return {
            project: {
              ...s.project,
              layers: orderedIds
                .filter((id) => layerMap.has(id))
                .map((id, i) => ({ ...layerMap.get(id)!, order: i })),
            },
          };
        }),

      setActiveLayer: (id) =>
        set((s) => {
          if (!s.project) return s;
          return { project: { ...s.project, activeLayerId: id } };
        }),

      addShape: (shape) =>
        set((s) => {
          if (!s.project) return s;
          return { project: { ...s.project, shapes: [...s.project.shapes, shape] } };
        }),

      updateShape: (id, patch) =>
        set((s) => {
          if (!s.project) return s;
          return {
            project: {
              ...s.project,
              shapes: s.project.shapes.map((sh) =>
                sh.id === id ? ({ ...sh, ...patch } as Shape) : sh
              ),
            },
          };
        }),

      removeShape: (id) =>
        set((s) => {
          if (!s.project) return s;
          return {
            project: { ...s.project, shapes: s.project.shapes.filter((sh) => sh.id !== id) },
          };
        }),

      removeShapes: (ids) =>
        set((s) => {
          if (!s.project) return s;
          const idSet = new Set(ids);
          return {
            project: {
              ...s.project,
              shapes: s.project.shapes.filter((sh) => !idSet.has(sh.id)),
            },
          };
        }),

      updateProjectTitle: (title) =>
        set((s) => {
          if (!s.project) return s;
          return { project: { ...s.project, title } };
        }),

      setProjectId: (id) =>
        set((s) => {
          if (!s.project) return s;
          return { project: { ...s.project, id } };
        }),

      setMediaUrl: (url) =>
        set((s) => {
          if (!s.project) return s;
          return { project: { ...s.project, media: { ...s.project.media, url } } };
        }),
    }),
    { limit: 50 }
  )
);
