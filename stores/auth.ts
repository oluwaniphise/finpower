import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  phoneNumber?: string
  isVerified?: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  hydrated: boolean
  setUser: (user: User) => void
  logout: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hydrated: false,

      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      setHydrated: (hydrated: boolean) => {
        set({ hydrated })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
