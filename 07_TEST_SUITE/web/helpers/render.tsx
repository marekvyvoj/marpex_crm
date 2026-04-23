import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render } from "@testing-library/react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(ui: ReactElement, options?: { route?: string }) {
  const queryClient = createTestQueryClient();
  const route = options?.route ?? "/";

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper }),
  };
}

export function renderRouteTree(ui: ReactElement, options?: { route?: string }) {
  const queryClient = createTestQueryClient();
  const route = options?.route ?? "/";

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/login" element={<div>Login route</div>} />
            <Route path="*" element={ui} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}