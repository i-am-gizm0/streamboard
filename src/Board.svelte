<script lang="ts">
    import { fly, scale } from 'svelte/transition';

    import { StatusColor, timeToString } from './SharedDefinitions';
    import type { GameState } from './SharedDefinitions';

    import Team from './board/Team.svelte';
    import Bouncer from './Bouncer.svelte';

    import { io } from 'socket.io-client';
    import merge from 'deepmerge';
    import ordinal from 'ordinal';

    let appState: GameState = {
        home: {
            name: 'Lancers',
            color: '#282828',
            score: 0,
            timeoutsLeft: 0,
            possession: false
        },
        away: {
            name: 'Colts',
            color: '#007BBB',
            score: 0,
            timeoutsLeft: 0,
            possession: false
        },
        time: {
            time: 0,
            period: 0
        }
    };
    
    let statusColor = StatusColor.INFO;
    let statusText = 'Connecting';
    $: connectionGood = statusColor == StatusColor.OK;

    // let periodSuffix = "";
    // $: switch (appState.time.period) {
    //     case 1:
    //         periodSuffix = 'st';
    //     break;

    //     case 2:
    //         periodSuffix = 'nd';
    //     break;

    //     case 3:
    //         periodSuffix = 'rd';
    //     break;

    //     default:
    //         periodSuffix= 'th';
    // }
    // $: period = `${appState.time.period}${periodSuffix}`;
    $: period = ordinal(appState.time.period);
    $: time = appState.time.time != undefined ? (typeof appState.time.time == 'string' ? appState.time.time : timeToString(appState.time.time)) : null;
    $: play = appState.flag ? 'FLAG' : false || appState.home.flag || appState.away.flag || appState.play;

    // setInterval(()=>{
    //     state.time.time = (<number>state.time.time) - 0.1
    // }, 100);

    const gid = new URL(location.href).searchParams.get('gid') || 'default';

    const socket = io('wss://gizm0.dev/');
    socket.on('connect', ()=>{
        statusColor = StatusColor.OK;
        statusText = 'Connected';
        
        socket.emit('getFullState', gid);
    });
    socket.on('disconnect', ()=>{
        statusText = 'Disconnected';
        statusColor = StatusColor.PROBLEM;
    });

    socket.on('fullState', (gid: string, state: GameState)=>{
        appState = state;
        statusText = 'Ready';
        statusColor = StatusColor.OK;
    });

    socket.on('partialState', (newGID: string, state: GameState) => {
        if (newGID != gid) return;
        appState = <GameState>merge(appState, state);
    });

    socket.on('error', (who: string, details: string) => {
        statusText = `${who.charAt(0).toUpperCase() + who.substr(1)} Error: ${details}`;
        statusColor = StatusColor.PROBLEM;
    });
</script>

<div class="scoreboard">
    <div class="board">
        {#if connectionGood}
            <div class="teams">
                <Team team={appState.home} align='left' />
                <Team team={appState.away} align='right' />
            </div>
            <div class="clock">
                <span class="period" class:wide={!appState.time.time}>{period}</span>
                {#if appState.time.time}
                    <span class="time">{time}</span>
                {/if}
            </div>
        {:else}
            <span style="display: block; width: 128px; text-align: center;">{statusText}</span>
            <Bouncer {statusColor} width="128px" />
        {/if}
    </div>
    {#if play && connectionGood}
        <div
            class="play"
            transition:fly={{y: -12}}
            class:flag={appState.flag || appState.home.flag || appState.away.flag}
        >
            {#key play}
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
        top: 36px; /*resized*/ 
        left: 36px; /*resized*/

        color: #eee;
        font-family: 'Roboto Slab', serif;
    }

    .scoreboard > div {
        border-radius: var(--border-radius);

        box-shadow: #00000040 0 6px 6px; /*resized*/
        background-color: var(--bg);
    }

    .scoreboard :global(*) {
        --border-radius: 6px; /*resized*/
        --bg: #1e1e1e;
    }

    .teams {
        display: grid;
        grid-template-columns: auto auto;
    }

    .clock {
        height: 36px; /*resized*/
        width: 192px; /*resized*/
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
        align-items: center;
        align-content: center;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
        box-shadow: inset #00000040 0 6px 6px; /*resized*/
        font-size: 21px; /*resized*/
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
        margin-top: 12px; /*resized*/

        width: 192px; /*resized*/
        min-height: 36px; /*resized*/

        display: grid;
        place-items: center;
        text-align: center;
        background-color: var(--bg);

        box-shadow: #00000040 0 6 6px, inset #00000040 0 3px 3px !important; /*resized*/
        font-size: 21px;/*resized*/
        font-weight: 700;

        transition: background-color 0.4s;
    }

    .play.flag {
        background-color: #fdd835;
        color: var(--bg);
        box-shadow: #00000040 0 6px 6px, inset #00000040 0 -3px 3px !important; /*resized*/
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