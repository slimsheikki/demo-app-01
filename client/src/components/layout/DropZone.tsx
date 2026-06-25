import { useState, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useMediaLoader } from '../../hooks/useMediaLoader';

const ACCEPTED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/avif', 'image/bmp', 'image/svg+xml', 'image/tiff',
  'image/heic', 'image/heif',
].join(',');

export default function DropZone() {
  const { setProject } = useProjectStore();
  const { loading, error, loadFile } = useMediaLoader();
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const project = await loadFile(file);
      if (project) setProject(project);
    },
    [loadFile, setProject]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div
      className="flex-1 flex items-center justify-center bg-neutral-900"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <label
        className={`flex flex-col items-center gap-4 border-2 border-dashed rounded-2xl px-16 py-14 cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-400 bg-blue-900/20'
            : 'border-neutral-600 hover:border-neutral-400 hover:bg-neutral-800/50'
        }`}
      >
        <input type="file" accept={ACCEPTED_MIME} onChange={onFileInput} className="sr-only" />

        <div className="text-5xl">🖼</div>

        <div className="text-center">
          <p className="text-white font-medium text-lg">Drop your image here</p>
          <p className="text-neutral-400 text-sm mt-1">or click to browse</p>
        </div>

        <p className="text-neutral-600 text-xs text-center max-w-xs">
          Supports JPG, PNG, WebP, GIF, AVIF, BMP, SVG — up to 200 MB
        </p>

        {loading && (
          <div className="text-blue-400 text-sm animate-pulse">Loading…</div>
        )}

        {error && (
          <div className="text-red-400 text-sm text-center max-w-xs">{error}</div>
        )}
      </label>
    </div>
  );
}
