import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const response = await apiClient.verifyEmail({ token });

      if (!response.success) {
        throw new Error(response.error || "Email verification failed");
      }

      return response;
    },
  });
}
