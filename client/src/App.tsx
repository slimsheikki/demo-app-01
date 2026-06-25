import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { useProjectStore } from './store/projectStore';
import { getSharedProject } from './utils/api';
import CanvasArea from './components/canvas/CanvasArea';
import TopBar from './components/layout/TopBar';
import DropZone from './components/layout/DropZone';
import Toolbar from './components/toolbar/Toolbar';
import LayerPanel from './components/layers/LayerPanel';
import ViewerBanner from './components/share/ViewerBanner';

function EditorPage() {
  const project = useProjectStore((s) => s.project);

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {project ? (
          <>
            <Toolbar />
            <CanvasArea />
            <LayerPanel />
          </>
        ) : (
          <DropZone />
        )}
      </div>
    </div>
  );
}

function ViewerPage() {
  const { token } = useParams<{ token: string }>();
  const { setProject, project } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getSharedProject(token)
      .then(({ project: p }) => {
        setProject(p, true);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, setProject]);

  if (loading) {
    return (
      <div className="h-screen bg-neutral-900 flex items-center justify-center text-white">
        <div className="animate-pulse text-neutral-400">Loading shared annotation…</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen bg-neutral-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-red-400 font-medium">{error ?? 'Annotation not found'}</p>
          <p className="text-neutral-500 text-sm mt-2">This link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white overflow-hidden">
      <ViewerBanner title={project.title} />
      <div className="flex flex-1 overflow-hidden">
        <CanvasArea readOnly />
        <LayerPanel readOnly />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/view/:token" element={<ViewerPage />} />
      </Routes>
    </BrowserRouter>
  );
}
