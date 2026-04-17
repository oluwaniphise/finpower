import { useMutation } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: async ({ reference }: { reference: string }) => {
      const response = await apiClient.resendOtp({ reference })

      if (!response.success) {
        throw new Error(response.error || 'Failed to resend OTP')
      }

      return response
    },
  })
}
