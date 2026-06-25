import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { Project, MediaFile } from '../types';
import { uploadMedia } from '../utils/api';
import { useUploadStore } from '../store/uploadStore';

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/avif', 'image/bmp', 'image/svg+xml', 'image/tiff',
  'image/heic', 'image/heif',
];

interface UseMediaLoaderReturn {
  loading: boolean;
  error: string | null;
  loadFile: (file: File) => Promise<Project | null>;
}

export function useMediaLoader(): UseMediaLoaderReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (file: File): Promise<Project | null> => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      setError(`Unsupported file type: ${file.type || file.name}`);
      return null;
    }

    setLoading(true);

    try {
      const blobUrl = URL.createObjectURL(file);

      // Read natural dimensions
      const { width, height } = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => reject(new Error('Image failed to load — format may not be supported by this browser'));
          img.src = blobUrl;
        }
      );

      const media: MediaFile = {
        type: 'image',
        originalName: file.name,
        url: blobUrl,
        width,
        height,
      };

      const firstLayerId = nanoid();
      const project: Project = {
        id: '',
        title: file.name.replace(/\.[^.]+$/, ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        media,
        layers: [
          { id: firstLayerId, name: 'Layer 1', visible: true, opacity: 1, locked: false, order: 0 },
        ],
        shapes: [],
        activeLayerId: firstLayerId,
      };

      // Upload in background, swap URL when done.
      // Blob URL is intentionally not revoked so that undo stays safe
      // (reverting to the blob URL won't break the image display).
      useUploadStore.getState().setUploadPending(true);
      uploadMedia(file)
        .then(({ url }) => {
          window.dispatchEvent(new CustomEvent('mediaUploaded', { detail: { url } }));
        })
        .catch((err) => {
          console.warn('Background upload failed:', err);
        })
        .finally(() => {
          useUploadStore.getState().setUploadPending(false);
        });

      return project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, loadFile };
}
