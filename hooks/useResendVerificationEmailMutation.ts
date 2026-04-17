import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useResendVerificationEmailMutation() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await apiClient.resendVerificationEmail({ email });

      if (!response.success) {
        throw new Error(response.error || "Failed to resend verification email");
      }

      return response;
    },
  });
}
