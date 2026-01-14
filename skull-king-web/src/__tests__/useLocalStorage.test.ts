import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("returns initial value when localStorage is empty", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial-value")
    );
    expect(result.current[0]).toBe("initial-value");
  });

  it("returns stored value when localStorage has data", () => {
    localStorage.setItem("test-key", JSON.stringify("stored-value"));

    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial-value")
    );
    expect(result.current[0]).toBe("stored-value");
  });

  it("updates localStorage when setValue is called", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial-value")
    );

    act(() => {
      result.current[1]("new-value");
    });

    expect(result.current[0]).toBe("new-value");
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
  });

  it("handles object values", () => {
    const initialObj = { name: "test", count: 0 };

    const { result } = renderHook(() =>
      useLocalStorage("test-obj", initialObj)
    );

    expect(result.current[0]).toEqual(initialObj);

    act(() => {
      result.current[1]({ name: "updated", count: 5 });
    });

    expect(result.current[0]).toEqual({ name: "updated", count: 5 });
  });

  it("handles array values", () => {
    const initialArr = [1, 2, 3];

    const { result } = renderHook(() =>
      useLocalStorage("test-arr", initialArr)
    );

    expect(result.current[0]).toEqual(initialArr);

    act(() => {
      result.current[1]([4, 5, 6]);
    });

    expect(result.current[0]).toEqual([4, 5, 6]);
  });

  it("returns initial value when localStorage contains invalid JSON", () => {
    localStorage.setItem("test-key", "not-valid-json{");

    // Suppress console.log for this test
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useLocalStorage("test-key", "fallback")
    );

    expect(result.current[0]).toBe("fallback");
    consoleSpy.mockRestore();
  });
});
