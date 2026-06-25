import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { createProject, updateProject, createShareToken } from '../../utils/api';

interface Props {
  onClose: () => void;
}

export default function ShareModal({ onClose }: Props) {
  const { project, setProjectId } = useProjectStore();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      let projectId = project.id;

      if (!projectId) {
        const created = await createProject({
          title: project.title,
          media: project.media,
          layers: project.layers,
          shapes: project.shapes,
          activeLayerId: project.activeLayerId,
        });
        projectId = created.id;
        setProjectId(projectId);
      } else {
        await updateProject({ ...project, id: projectId });
      }

      const { token } = await createShareToken(projectId, false);
      const url = `${window.location.origin}/view/${token}`;
      setShareUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-neutral-800 border border-neutral-600 rounded-xl p-6 w-96 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Share annotation</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-xl">✕</button>
        </div>

        <p className="text-neutral-400 text-sm mb-4">
          Generate a link your collaborator can open in their browser. They'll see the image with all annotation layers they can toggle on and off.
        </p>

        {!shareUrl ? (
          <button
            onClick={generate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Generating…' : 'Generate share link'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-neutral-700 text-white text-sm px-3 py-2 rounded-lg outline-none min-w-0"
              />
              <button
                onClick={copy}
                className="bg-neutral-600 hover:bg-neutral-500 text-white px-3 py-2 rounded-lg text-sm transition-colors shrink-0"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-blue-400 hover:text-blue-300 text-sm"
            >
              Open in new tab →
            </a>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}
