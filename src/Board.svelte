<script lang="ts">
    import { fly, scale } from 'svelte/transition';

    import { StatusColor, timeToString } from './SharedDefinitions';
    import type { GameState } from './SharedDefinitions';

    import Team from './board/Team.svelte';
    import Bouncer from './Bouncer.svelte';

    import { io } from 'socket.io-client';
    import merge from 'deepmerge';
    import ordinal from 'ordinal';

    const gid = new URL(location.href).searchParams.get('gid') || 'default';

    let appState: GameState;


    /** WebSocket connection to server */
    const socket = io();
    socket.on('connect', ()=>{  // Request state from server
        statusColor = StatusColor.INFO;
        statusText = 'Loading';
        
        socket.emit('getFullState', gid, (response: GameState) => {
            appState = response;

            statusText = 'Ready';
            statusColor = StatusColor.SUCCESS;
        });
    });
    socket.on('disconnect', ()=>{
        statusText = 'Disconnected';
        statusColor = StatusColor.DANGER;
    });

    socket.on('fullState', (thisGID: string, state: GameState)=>{   // Overwrite current state with game state
        if (thisGID != gid) return;

        appState = state;

        statusText = 'Ready';
        statusColor = StatusColor.SUCCESS;
    });

    socket.on('partialState', (thisGID: string, state: GameState) => {  // Merge states
        if (thisGID != gid) return;

        appState = <GameState>merge(appState, state);
    });

    socket.on('error', (who: string, details: string) => {
        statusText = `${who.charAt(0).toUpperCase() + who.substr(1)} Error: ${details}`;
        statusColor = StatusColor.DANGER;
    });

    
    let statusColor = StatusColor.INFO;
    let statusText = 'Connecting';
    $: connectionGood = statusColor == StatusColor.SUCCESS;
    
    /** Period with ordinal (1st, 2nd, 3rd, 4th)*/
    $: period = ordinal(appState.time.period);
    /** Formatted game time */
    $: time = appState.time.time != undefined ? (typeof appState.time.time == 'string' ? appState.time.time : timeToString(appState.time.time)) : null;
    /** Down & Distance or Flag or penalty */
    $: play = appState.flag ? 'FLAG' : false || appState.home.flag || appState.away.flag || appState.play;
</script>

<div class="scoreboard">
    <div class="board"> <!-- Main scoreboard -->
        {#if connectionGood} <!-- Connection good, show scoreboard -->
            <div class="teams">
                <Team team={appState.home} align='left' />
                <Team team={appState.away} align='right' />
            </div>
            <div class="clock">
                <span
                    class="period"
                    class:wide={!appState.time.time}
                >{period}</span>


                {#if appState.time.time} <!-- Show the time -->
                    <span class="time">{time}</span>
                {/if}
            </div>
        {:else} <!-- Connection bad, explain why -->
            <span
                style="display: block; width: 128px; text-align: center;"
            >{statusText}</span>
            <Bouncer {statusColor} width="128px" />
        {/if}
    </div>
    {#if play && connectionGood}
        <div
            class="play"
            transition:fly={{y: -12}}
            class:flag={appState.flag || appState.home.flag || appState.away.flag}
        >
            {#key play} <!-- Recreate value (show animation) every time it updates -->
                <span
                    transition:scale
                    style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);"
                >{play}</span>
            {/key}
        </div>
    {/if}
</div>

<style>
    :root {
        box-sizing: border-box;
    }

    .scoreboard {
        position: fixed;
        top: 36px;
        left: 36px;

        color: #eee;
        font-family: 'Roboto Slab', serif;
    }

    .scoreboard > div {
        border-radius: var(--border-radius);

        box-shadow: #00000040 0 6px 6px;
        background-color: var(--bg);
    }

    .scoreboard :global(*) {
        --border-radius: 6px;
        --bg: #1e1e1e;
    }

    .teams {
        display: grid;
        grid-template-columns: auto auto;
    }

    .clock {
        height: 36px;
        width: 192px;
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
        align-items: center;
        align-content: center;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
        box-shadow: inset #00000040 0 6px 6px, inset #ffffff08 0 -6px 6px;
        font-size: 21px;
    }

    .clock span {
        text-align: center;
        width: 100%;
        transition: width 0.4s;
    }

    .period {
        font-weight: 400;
    }

    /* .period {
        width: 100% !important;
    } */

    .time {
        font-family: 'Roboto Mono', monospace;
        font-weight: 500;
    }

    .play {
        position: relative;
        margin-top: 12px;

        width: 192px;
        min-height: 36px;

        display: grid;
        place-items: center;
        text-align: center;
        background-color: var(--bg);

        box-shadow: #00000040 0 6 6px, inset #00000040 0 3px 3px, inset #ffffff08 0 -3px 3px !important;
        font-size: 21px;
        font-weight: 700;

        transition: background-color 0.4s;
    }

    .play.flag {
        background-color: #fdd835;
        color: var(--bg);
        box-shadow: #00000040 0 6px 6px, inset #00000040 0 -3px 3px !important;
    }

    .play span {
        display: block;
        width: 192px;
    }
</style>

<svelte:head>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed&family=Roboto+Slab:wght@400;500;700;900&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
</svelte:head>