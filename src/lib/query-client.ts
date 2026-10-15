import { QueryClient } from "@tanstack/react-query"

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new query client
    return makeQueryClient()
  } else {
    // Browser: reuse the existing query client if available
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}

export const queryClient = getQueryClient()
