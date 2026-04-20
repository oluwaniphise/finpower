import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'

export function useLoginMutation() {
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiClient.login({ email, password })

      if (!response.success) {
        throw new Error(response.error || 'Invalid email or password')
      }

      return response
    },
    onSuccess: (response) => {
      if (response.data?.user) {
        setUser(response.data.user)
      }
    },
  })
}
