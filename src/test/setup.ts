import "@testing-library/jest-dom";

vi.mock("next/navigation", () => {
  const push = vi.fn();
  const refresh = vi.fn();
  return {
    useRouter: () => ({ push, refresh, replace: vi.fn(), back: vi.fn() }),
  };
});

vi.mock("sonner", () => {
  return {
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
      message: vi.fn(),
    },
    Toaster: () => null,
  };
});
