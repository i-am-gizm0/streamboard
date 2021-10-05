<script lang="ts">
    import type { Team } from "../../../games/hockey";

    import { hex as colorContrast } from 'wcag-contrast';
    import { timeToString } from "../../../SharedUtilities";

    import { slide } from 'svelte/transition';

    export let state: Team;
    export let align: 'left' | 'right';

    $: color = state.penalties.length ? '#f9a825' : state.color;

    window.addEventListener('clockTick', () => {
        for (let i = 0; i < state.penalties.length; i++) {
            if (state.penalties[i].remainingTime >= 0.1) {
                state.penalties[i].remainingTime -= 0.1;
            }
        }
    });
</script>

<div
    class="team-container"
    class:invert={colorContrast(color, '#fff') < 4.5}
>
    <div class="penalties">
        {#each state.penalties as penalty (penalty.id)}
            <div class="penalty" transition:slide={{duration: 200}}>
                <span class="details">
                    {#if penalty.player}
                        <b>#{penalty.player}</b>
                    {/if}
                    {penalty.offense || 'Penalty'}
                </span>
                <span class="time">{timeToString(penalty.remainingTime)}</span>
            </div>
        {/each}
    </div>
    <div
        class="team"
        class:left={align === 'left'}
        class:right={align === 'right'}
        style="
            background-color: {color};
        "
    >
        <span class="team-name">{state.name}</span>
        <span class="team-score">{state.score}</span>
    </div>
</div>

<style>
    .team-container {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto var(--board-height);
    }

    .team-container.invert {
        color: #000;
    }

    .penalties {
        box-sizing: border-box;
        display: flex;
        flex-flow: column nowrap;
        width: 100%;
    }
    
    .penalty {
        display: flex;
        justify-content: space-between;

        margin-bottom: 4px;
        padding: 0 16px 2px 16px;
        height: 22px;

        background-color: #f9a825;
        border-radius: 6px;
    }

    .team {
        box-sizing: border-box;

        display: flex;
        justify-content: space-between;
        /* align-items: center; */
        
        /* width: 100%; */
        height: var(--board-height);

        padding: 0 16px;
        border-radius: var(--board-radius);

        transition: background-color 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
    }

    .team.left {
        border-bottom-right-radius: 0;
        border-top-right-radius: 0;
    }

    .team.right {
        flex-direction: row-reverse;

        border-bottom-left-radius: 0;
        border-top-left-radius: 0;
    }
</style>