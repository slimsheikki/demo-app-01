import type { Project } from '../types';

const BASE = '';

export async function uploadMedia(file: File): Promise<{ url: string; filename: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Upload failed');
  return res.json();
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const res = await fetch(`${BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function updateProject(project: Project): Promise<Project> {
  const res = await fetch(`${BASE}/api/projects/${project.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to save project');
  return res.json();
}

export async function createShareToken(
  projectId: string,
  canAnnotate = false
): Promise<{ token: string }> {
  const res = await fetch(`${BASE}/api/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, canAnnotate }),
  });
  if (!res.ok) throw new Error('Failed to create share link');
  return res.json();
}

export async function getSharedProject(
  token: string
): Promise<{ project: Project; canAnnotate: boolean }> {
  const res = await fetch(`${BASE}/api/share/${token}`);
  if (!res.ok) throw new Error('Share link not found or expired');
  return res.json();
}
