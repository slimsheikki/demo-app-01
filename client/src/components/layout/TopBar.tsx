import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { updateProject } from '../../utils/api';
import ShareModal from '../share/ShareModal';

export default function TopBar() {
  const { project, updateProjectTitle, isViewer } = useProjectStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!project) return null;

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleVal.trim()) updateProjectTitle(titleVal.trim());
  };

  const save = async () => {
    if (!project.id) { setShowShare(true); return; }
    setSaving(true);
    try { await updateProject(project); } finally { setSaving(false); }
  };

  return (
    <>
      <div className="h-12 bg-neutral-900 border-b border-neutral-700 flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-blue-400 font-bold text-sm tracking-tight">annotate</span>
        </div>

        <div className="w-px h-5 bg-neutral-700" />

        {/* Editable project title */}
        {editingTitle && !isViewer ? (
          <input
            autoFocus
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            className="text-white text-sm bg-neutral-700 rounded px-2 py-0.5 outline-none"
          />
        ) : (
          <span
            onDoubleClick={() => { if (!isViewer) { setTitleVal(project.title); setEditingTitle(true); } }}
            className="text-neutral-300 text-sm cursor-default"
            title={isViewer ? undefined : 'Double-click to rename'}
          >
            {project.title}
          </span>
        )}

        <div className="flex-1" />

        {!isViewer && (
          <>
            <button
              onClick={save}
              disabled={saving}
              className="text-xs text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              Share
            </button>
          </>
        )}
      </div>

      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
    </>
  );
}
