<script lang="ts">
    import { fade } from 'svelte/transition';
    import type { HockeyState } from "../../games/hockey";
    import { timeToString } from "../../SharedUtilities";
    import Bouncer from "../Bouncer.svelte";
    import Team from "./hockey/Team.svelte";
    // debugger;

    export let gameData: HockeyState;
    export let registerCustomUpdateListener: (event: string, callback: (data: unknown) => any) => void;

    registerCustomUpdateListener('clockTick', (data: number) => {
        gameData.time.time = data;
        window.dispatchEvent(new CustomEvent('clockTick'));
    });
</script>

<div class="scoreboardContainer">
    {#if gameData}
        <div class="score">
            <Team state={gameData.home} align=left />
            <div class="clock">
                <div></div>
                {#if gameData.time.custom}
                    <span transition:fade={{duration: 200}}>{gameData.time.custom}</span>
                {:else}
                    <span transition:fade={{duration: 200}}>{`${timeToString(gameData.time.time)} - P${gameData.time.period}`}</span>
                {/if}
            </div>
            <Team state={gameData.away} align=right />
        </div>
    {:else}
        <div style="justify-content: center;">
            <span class="statusText">Loading</span>
            <Bouncer style=info />
        </div>
    {/if}
</div>

<style>
    .scoreboardContainer, .scoreboardContainer :global(*) {
        --board-height: 24px;
        --board-radius: 8px;
    }

    .scoreboardContainer {

        position: fixed;
        left: 50%;
        bottom: 36px;
        transform: translate(-50%);

        min-width: 240px;
        width: 37vw;
        /* max-width: 500px; */
        height: var(--board-height);

        display: grid;
        grid-template-columns: 1fr;
        place-items: center;
        
        background-color: #263238;
        color: #ffffff;
        border-radius: var(--board-radius);
    }

    .scoreboardContainer > div {
        display: grid;
        /* place-items: stretch; */
        text-align: center;
    }

    .score {
        position: absolute;
        bottom: 0;
        width: 100%;
        grid-template-columns: 1fr auto 1fr;
        justify-items: stretch;
        justify-content: stretch;

        align-items: end;
        align-content: end;
    }

    .clock {
        position: relative;

        width: 96px;
        text-align: center;

        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto var(--board-height);
    }

    .clock span {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translate(-50%);
        width: 100%;
    }
</style>