import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  phoneNumber?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token?: string
  hydrated: boolean
  setUser: (user: User, token?: string) => void
  logout: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: undefined,
      hydrated: false,

      setUser: (user: User, token?: string) => {
        set({
          user,
          isAuthenticated: true,
          token,
        })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, token: undefined })
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
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
