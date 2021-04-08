<script lang="ts">
    import { StatusColor } from "./SharedDefinitions";


    export let statusColor: StatusColor;
    export let width = '200px';
</script>

<div
    class="bouncer"
    style="--width: {width};"
    class:problem={statusColor == StatusColor.DANGER}
    class:ok={statusColor == StatusColor.SUCCESS}
></div>

<style>
    .bouncer, .bouncer::after {
        --height: 4px;
        --border-radius: 2px;
    }
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