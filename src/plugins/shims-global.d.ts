declare global {
    interface Window {
        __APOLLO_STATE__: Record<string, unknown>;
    }
}

export {};
