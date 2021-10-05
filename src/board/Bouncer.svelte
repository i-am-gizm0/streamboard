<script lang="ts">
    export let width = '200px';
    export let height = '4px';
    export let borderRadius = '2px';

    export let style: 'info' | 'ok' | 'problem';
</script>

<div
    class="bouncer"
    style="
        --width: {width};
        --height: {height};
        --border-radius: {borderRadius};
    "
    class:problem={style === 'problem'}
    class:ok={style === 'ok'}
></div>

<style>
    /* .bouncer, .bouncer::after {
        --width: 200px;
        --height: 4px;
        --border-radius: 2px;
    } */
    .bouncer {
        display: inline-block;
        height: var(--height);
        border-radius: var(--border-radius);
        width: var(--width);
        background-color: #1976d2;
    }

    .bouncer::after {
        content: '';
        display: block;
        margin-left: 0;
        height: var(--height);
        border-radius: var(--border-radius);
        width: 20px;
        background-color: #90caf9;
        animation: 1s bounce ease-in-out alternate infinite;
    }

    .bouncer.problem {
        background-color: #d32f2f;
    }

    .bouncer.problem::after {
        background-color: #ef9a9a;
    }

    .bouncer.ok {
        background-color: #388e3c;
    }

    .bouncer.ok::after {
        background-color: #a5d6a7;
    }

    @keyframes bounce {
        from {
            margin-left: 0;
            width: 20px;
        }

        50% {
            width: 40px;
        }

        to {
            width: 20px;
            margin-left: calc(var(--width) - 20px);
        }
    }
</style>