import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
      name,
      phoneNumber,
    }: {
      email: string;
      password: string;
      name: string;
      phoneNumber: string;
    }) => {
      const response = await apiClient.register({
        email,
        password,
        name,
        phoneNumber,
      });

      if (!response.success) {
        throw new Error(response.error || "Registration failed");
      }

      return response;
    },
  });
}
