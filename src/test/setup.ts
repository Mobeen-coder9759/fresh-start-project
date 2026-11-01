import "@testing-library/jest-dom/vitest";

const createStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
};

if (!globalThis.localStorage || typeof globalThis.localStorage.clear !== "function") {
  Object.defineProperty(globalThis, "localStorage", {
    writable: true,
    configurable: true,
    value: createStorage(),
  });
}

if (!globalThis.sessionStorage || typeof globalThis.sessionStorage.clear !== "function") {
  Object.defineProperty(globalThis, "sessionStorage", {
    writable: true,
    configurable: true,
    value: createStorage(),
  });
}

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => { },
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => { },
  }),
});

