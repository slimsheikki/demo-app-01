import { create } from 'zustand';

interface UploadState {
  uploadPending: boolean;
  setUploadPending: (pending: boolean) => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  uploadPending: false,
  setUploadPending: (pending) => set({ uploadPending: pending }),
}));
