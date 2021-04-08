<script lang="ts">
    import 'bootstrap/dist/css/bootstrap.min.css';
    import TeamConfig from './controller/TeamConfig.svelte';
    import TeamControl from './controller/TeamControl.svelte';
    import { parseTimeString, StatusColor, timeToString } from './SharedDefinitions';
    import type { GameState } from './SharedDefinitions';
    import { io } from 'socket.io-client';
    import merge from 'deepmerge';
    import ordinal, { indicator } from 'ordinal';

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
            time: 5,
            period: 0
        }
    };
    
    let play: { down: number; distance: number; } | string = {
        down: 1,
        distance: 10
    };



    let timer: number;

    function startClock() {
        timer = setInterval(() => {
            appState.time.time = <number>appState.time.time - 0.1;
            if (appState.time.time <= 0) {
                stopClock();
            }
        }, 100);
    }

    function stopClock() {
        clearInterval(timer);
        timer = undefined;
    }

    function toggleClock() {
        if (timer) {
            stopClock();
        } else {
            startClock();
        }
    }

    $: timeString = typeof appState.time.time == 'string' ? appState.time.time : timeToString(appState.time.time);

    function setMaxTimeouts(event: any) {
        const count = parseInt((<HTMLInputElement>event.target).value);
        appState.home.timeoutsMax = count;
        appState.home.timeoutsLeft = count;
        appState.away.timeoutsMax = count;
        appState.away.timeoutsLeft = count;
    }

    function handleTimeChange(event: any) {
        appState.time.time = parseTimeString((<HTMLInputElement>event.target).value);
    }

    function handlePlayChange(event: any) {
        appState.play = play = (<HTMLInputElement>event.target).value;
    }

    function toggleFlag() {
        setGlobalFlag();
    }

    function setGlobalFlag(value?: boolean) {
        appState.flag = value ?? !appState.flag;
        appState.home.flag = '';
        appState.away.flag = '';
    }

    function clearPossession() {
        appState.home.possession = false;
        appState.away.possession = false;
    }

    function setFirstAnd10() {
        play = {
            down: 1,
            distance: 10
        };
        // @ts-expect-error
        play.down = "1";
        play.down = 1;
        appState.play = '1st & 10';
        setGlobalFlag(false);
    }

    $: enableTime = appState.time.time != '';

    function handleToggleTime(event: any) {
        if ((<HTMLInputElement>event.target).checked) {
            enableTime = true;
        } else {
            appState.time.time = '';
        }
    }

    let statusColor: StatusColor;
    let statusText: string = 'Initializing';

    const gid = new URL(location.href).searchParams.get('gid') || 'default';

    function setConnectionStatus(status: string, color: StatusColor) {
        statusColor = color;
        statusText = status;
        let renderedColor = getComputedStyle(document.querySelector('span.badge')).getPropertyValue(`--${StatusColor[color].toLowerCase()}`);
        document.querySelector('meta[name="theme-color"]').setAttribute('content', renderedColor);
    }

    const socket = io('wss://gizm0.dev/');
    socket.on('connect', () => {
        attachGID();
        socket.emit('declareRole', 'controller');
    });
    socket.on('disconnect', () => {
        setConnectionStatus('Disconnected', StatusColor.DANGER);
    });
    socket.on('error', (who: string, details: string) => {
        setConnectionStatus(`${who.charAt(0).toUpperCase() + who.substr(1)} Error: ${details}`, StatusColor.DANGER);
    });

    function attachGID() {
        setConnectionStatus('Handshake', StatusColor.INFO);
        socket.emit('getFullState', gid);
    }

    socket.on('fullState', (gid: string, gameState: GameState) => {
        appState = gameState;
        setConnectionStatus('Connected', StatusColor.SUCCESS);
    });

    socket.on('partialState', (thisGID:string, newState: GameState) => {
        console.log('partialState', {gid: thisGID, state: newState});
        if (thisGID != gid) {
            return;
        }
        appState = <GameState>merge(appState, newState);
    });

    let pings:Date[] = [];
    setInterval(()=>{
        socket.emit('ping', 
            pings.push(new Date()) - 1
        );
    }, 5000);
    socket.on('pong', (nonce:number) => {
        let latency = new Date().getTime() - pings[nonce].getTime();
        try {
            delete pings[nonce];
        } catch (e) {
            setConnectionStatus(`Multiple Nonce ${nonce} Received`, StatusColor.WARNING);
        }
        setConnectionStatus(`Connected; Ping: ${latency}ms`, StatusColor.SUCCESS);
    });

    $: if (appState) {  // On update
        socket.emit('partialState', gid, appState);
    }

    $: down = (typeof play == 'object') ? play.down.toString() : '' ;

    function updateDown(event: Event) {
        if (typeof play == 'string') return;
        play.down = parseInt((<HTMLSelectElement>event.target).value);
    }
</script>

<nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
        <span class="navbar-brand">StreamBoard
            <span
                class="badge text-light"
                class:bg-secondary={statusColor == undefined}
                class:bg-primary={statusColor == StatusColor.INFO}
                class:bg-success={statusColor == StatusColor.SUCCESS}
                class:bg-danger={statusColor == StatusColor.DANGER}
                class:bg-warning={statusColor == StatusColor.WARNING}
            >{statusText}</span>
        </span>
    </div>
</nav>

<div class="card m-3 p-3">
    <details>
        <summary><h4>Team Configuration</h4></summary>
        <div class="container">
            <div class="row">
                <div class="col-md">
                    <h5>Shared</h5>
                    <div class="mb-3 form-check">
                        <input
                            type="checkbox"
                            class="form-check-input"
                            on:click={handleToggleTime}
                        >
                        <span class="form-check-label">Show Time</span>
                    </div>
                    <div class="mb-3">
                        <label for="maxTimeoutCount" class="form-label">Max Timeouts</label>
                        <input
                            type="number"
                            id="maxTimeoutCount"
                            class="form-control"
                            placeholder="0"
                            min="0"
                            value={Math.min(appState.home.timeoutsMax, appState.away.timeoutsMax)}
                            on:change={setMaxTimeouts}
                        >
                    </div>
                </div>
                <div class="col-md">
                    <h5>Home Team</h5>
                    <TeamConfig bind:state={appState} team="home" />
                </div>
                <div class="col-md">
                    <h5>Away Team</h5>
                    <TeamConfig bind:state={appState} team="away" />
                </div>
            </div>
        </div>
    </details>
</div>

<div class="container">
    <div class="row">
        <div class="card col-md m-1 p-3">
            <h5>Play</h5>
            <div class="input-group mb-3">
                {#if typeof play !== 'object'}
                    <input
                        type="text"
                        class="form-control"
                        value={appState.play || ''}
                        on:change={handlePlayChange}
                    />
                {:else}
                    <button
                        class="btn btn-outline-info mx-1"
                        style="margin-left: 0;"
                        on:click={setFirstAnd10}
                    >1st &amp; 10</button>
                    <!-- svelte-ignore a11y-no-onchange -->
                    <select value={down} on:change={updateDown}>
                        <option value=1>1</option>
                        <option value=2>2</option>
                        <option value=3>3</option>
                        <option value=4>4</option>
                    </select>
                    <span style="padding: 6.4px 0">
                        &nbsp;{indicator(play.down)} &amp;&nbsp;
                    </span>
                    <input
                        type="number"
                        min=0
                        max=100
                        bind:value={play.distance}
                    />
                    <button
                        class="btn btn-outline-primary mx-1"
                        on:click={()=>{
                            if (typeof play != 'string') {
                                appState.play = `${
                                    // @ts-expect-error because ordinal(number) but Select.value:string
                                    ordinal(parseInt(play.down))
                                } & ${
                                    play.distance == 0 ? 'GOAL' : play.distance
                                }`;
                            } else {
                                appState.play = play;
                            }
                            setGlobalFlag(false);
                        }}
                    >Save</button>
                {/if}
                <button
                    class="btn btn-outline-secondary"
                    on:click={()=>{appState.play = ''}}
                >Clear</button>
                <button
                    class="btn btn-outline-secondary mx-2"
                    on:click={()=>{
                        switch (typeof play) {
                            case 'string':
                                play = {down: 1, distance: 10};
                                break;
                            case 'object':
                                play = '';
                                break;
                        }
                    }}>Mode</button>
            </div>
            <button
                class="btn mb-1"
                class:btn-warning={appState.flag}
                class:btn-outline-warning={!appState.flag}
                on:click={toggleFlag}
            >{appState.flag ? 'Clear Flag' : 'FLAG'}</button>
        </div>
        <div class="card col-md m-1 p-3">
            <h5>Clock</h5>
            {#if enableTime}
                <button
                    class="btn mb-1"
                    class:btn-primary={timer}
                    class:btn-outline-primary={!timer}
                    on:click={toggleClock}
                >Clock {timer ? 'Running' : 'Stopped'}</button>
                <input
                    type="text"
                    class="form-control"
                    value={timeString}
                    on:change={handleTimeChange}
                />
            {/if}
            <span class="form-label">Quarter</span>
            <div class="input-group mb-3">
                <input
                    type="number"
                    class="form-control"
                    min="0"
                    bind:value={appState.time.period}
                />
                <button
                    class="btn btn-outline-secondary"
                    on:click={()=>{appState.time.period += 1}}
                >+1</button>
            </div>
        </div>
        <div class="card col-lg m-1 p-3">
            <TeamControl
                bind:team={appState.home}
                setFlag={setGlobalFlag}
                {clearPossession}
            />
        </div>
        <div class="card col-lg m-1 p-3">
            <TeamControl
                bind:team={appState.away}
                setFlag={setGlobalFlag}
                {clearPossession}
            />
        </div>
    </div>
</div>

<style>
    summary h4 {
        display: inline-block;
    }
</style>


<svelte:head>
    <style>
        html, body {
            margin: 0;
            padding: 0;
        }
    </style>
</svelte:head>