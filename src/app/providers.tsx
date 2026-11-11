"use client";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import superjson from "superjson";
import { api } from "@/lib/trpc";
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() => {
    const onError = (error: unknown) => {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED" &&
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/"
      ) {
        client.clear();
        router.replace("/login");
      }
    };
    const client = new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: { staleTime: 30_000, retry: false, refetchOnWindowFocus: true },
        mutations: { retry: false },
      },
    });
    return client;
  });
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: "/api/trpc",
          fetch: (url, options) => fetch(url, { ...options, credentials: "same-origin" }),
        }),
      ],
    }),
  );
  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
