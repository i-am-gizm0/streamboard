/// <reference types="svelte" />

declare namespace svelte.JSX {
    interface JSXAttributes<T> {
        style?: string;
    }

    interface HTMLAttributes<T> {
        style?: string;
    }
}