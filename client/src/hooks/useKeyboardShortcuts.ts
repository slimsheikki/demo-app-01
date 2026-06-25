import { useEffect } from 'react';
import { useToolStore } from '../store/toolStore';
import { useProjectStore } from '../store/projectStore';

export function useKeyboardShortcuts(
  selectedShapeId: string | null,
  setSelectedShapeId: (id: string | null) => void
) {
  const setTool = useToolStore((s) => s.setTool);
  const removeShape = useProjectStore((s) => s.removeShape);
  const temporalStore = useProjectStore.temporal;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      const isUndo = (e.metaKey || e.ctrlKey) && key === 'z';
      const isRedo = (e.metaKey || e.ctrlKey) && (key === 'y' || (e.shiftKey && key === 'z'));

      if (isUndo) {
        e.preventDefault();
        temporalStore.getState().undo();
        return;
      }
      if (isRedo) {
        e.preventDefault();
        temporalStore.getState().redo();
        return;
      }

      if (key === 'v') setTool('select');
      if (key === 'p') setTool('pencil');
      if (key === 'r') setTool('rectangle');
      if (key === 'e') setTool('ellipse');
      if (key === 'a') setTool('arrow');
      if (key === 't') setTool('text');
      if (key === 'x') setTool('eraser');

      if ((key === 'delete' || key === 'backspace') && selectedShapeId) {
        removeShape(selectedShapeId);
        setSelectedShapeId(null);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setTool, removeShape, selectedShapeId, setSelectedShapeId, temporalStore]);
}
