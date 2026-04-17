import { useMutation } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'

export function useVerifyOtpMutation() {
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: async ({ otp, reference }: { otp: string; reference: string }) => {
      const response = await apiClient.verifyOtp({ otp, reference })

      if (!response.success) {
        throw new Error(response.error || 'OTP verification failed')
      }

      return response
    },
    onSuccess: (response) => {
      if (response.data?.user && response.data?.token) {
        setUser(response.data.user, response.data.token)
      }
    },
  })
}
