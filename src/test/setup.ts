import '@testing-library/jest-dom/vitest';

// jsdom does not implement window.matchMedia — mock it for ThemeContext
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// jsdom does not implement IntersectionObserver — mock it for framer-motion whileInView
class MockIntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    private callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
    }

    observe(target: Element) {
        const entry = {
            isIntersecting: true,
            target,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRatio: 1,
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: null,
            time: Date.now(),
        } as IntersectionObserverEntry;
        this.callback([entry], this as unknown as IntersectionObserver);
    }

    unobserve() { }
    disconnect() { }
    takeRecords(): IntersectionObserverEntry[] { return []; }
}

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
});

// Mock localStorage for Node 22/24 test environment
const storageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = String(value); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (index: number) => Object.keys(store)[index] ?? null,
    };
})();

Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: storageMock,
});
Object.defineProperty(globalThis, 'localStorage', {
    writable: true,
    value: storageMock,
});

