import type { ApiError } from "@/shared/api/http";

export function resolveApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  const apiError = error as ApiError;
  if (typeof apiError?.data === "string" && apiError.data.trim().length > 0) {
    return apiError.data;
  }

  if (apiError?.data && typeof apiError.data === "object" && "message" in (apiError.data as object)) {
    const serverMessage = (apiError.data as { message?: unknown }).message;
    if (typeof serverMessage === "string" && serverMessage.trim().length > 0) {
      return serverMessage;
    }
  }

  if (apiError?.message && apiError.message.trim().length > 0) {
    return apiError.message;
  }

  return fallback;
}
