import { create } from 'zustand'

interface AddNodeDialogStore {
  isOpen: boolean
  position?: { x: number; y: number }
  
  openDialog: (position?: { x: number; y: number }) => void
  closeDialog: () => void
}

export const useAddNodeDialogStore = create<AddNodeDialogStore>((set) => ({
  isOpen: false,
  position: undefined,
  
  openDialog: (position) => set({ isOpen: true, position }),
  closeDialog: () => set({ isOpen: false, position: undefined }),
}))