<script lang="ts">
    import 'bootstrap/dist/css/bootstrap.min.css';

    import TeamConfig from './controller/TeamConfig.svelte';
    import TeamControl from './controller/TeamControl.svelte';

    import { parseTimeString, StatusColor, timeToString } from './SharedDefinitions';
    import type { GameState } from './SharedDefinitions';

    import { io } from 'socket.io-client';
    import merge from 'deepmerge';
    import ordinal, { indicator } from 'ordinal';

    const gid = new URL(location.href).searchParams.get('gid') || 'default';

    let appState: GameState;
    
    /** A nice way to store the play no matter the format */
    let play: { down: number; distance: number; } | string = {
        down: 1,
        distance: 10
    };

    $: down = (typeof play == 'object') ? play.down.toString() : '' ;

    /** Interval ID for the running clock. If defined, the clock is running with that interval ID */
    let timer: number;

    /** A nicely formatted (human-readable) time */
    $: timeString = appState?.time?.time ? (typeof appState.time.time == 'string' ? appState.time.time : timeToString(appState.time.time)) : '';

    /** Is the time shown? */
    $: enableTime = appState?.time?.time != '';


    // Websockets and Lifecycle
    /** WebSocket connection to the server */
    const socket = io();
    
    socket.on('connect', () => {    // On connect, attach to our game
        attachGID();
    });

    function attachGID() {
        setConnectionStatus('Handshake', StatusColor.INFO);
        socket.emit('getFullState', gid, (response: GameState) => {
            console.log(response);
            appState = response;

            setConnectionStatus('Connected', StatusColor.SUCCESS);
        });   // Request game state from server
    }

    socket.on('fullState', (thisGID: string, gameState: GameState) => { // Receive full state from server
        console.log('fullState', {gid: thisGID, state: gameState});
        if (thisGID != gid) return; // Only pay attention to our game

        appState = gameState;

        setConnectionStatus('Connected', StatusColor.SUCCESS);
    });

    socket.on('partialState', (thisGID:string, newState: GameState) => {    // Receive a state update from server
        console.log('partialState', {gid: thisGID, state: newState});
        if (thisGID != gid) return;

        appState = <GameState>merge(appState, newState);    // Deep merge the states
    });

    socket.on('disconnect', () => {
        setConnectionStatus('Disconnected', StatusColor.DANGER);
    });
    socket.on('error', (who: string, details: string) => {  // If the server gives us an error message
        setConnectionStatus(`${who.charAt(0).toUpperCase() + who.substr(1)} Error: ${details}`, StatusColor.DANGER);
    });

    let pings:Date[] = [];
    setInterval(()=>{
        socket.volatile.emit('ping', 
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


    let statusColor: StatusColor;
    let statusText: string = 'Initializing';
    /** Update the badge with the status*/
    function setConnectionStatus(status: string, color: StatusColor) {
        statusColor = color;
        statusText = status;

        // Set the application theme color (title bar, etc.)
        let renderedColor = getComputedStyle(document.querySelector('span.badge')).getPropertyValue(`--${StatusColor[color].toLowerCase()}`);
        document.querySelector('meta[name="theme-color"]').setAttribute('content', renderedColor);
    }


    function startClock() {
        timer = window.setInterval(() => {
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

    /** Handle a manual time change (parse the time string and distribute it) */
    function handleTimeChange(event: any) {
        appState.time.time = parseTimeString((<HTMLInputElement>event.target).value);
    }
    /** Handle showing/hiding the time */
    function handleToggleTime(event: any) {
        if ((<HTMLInputElement>event.target).checked) {
            enableTime = true;
        } else {
            appState.time.time = '';
        }
    }


    function setMaxTimeouts(event: any) {
        const count = parseInt((<HTMLInputElement>event.target).value);
        appState.home.timeoutsMax = count;
        appState.home.timeoutsLeft = count;
        appState.away.timeoutsMax = count;
        appState.away.timeoutsLeft = count;
    }


    /** Send custom play text */
    function handlePlayChange(event: any) {
        appState.play = play = (<HTMLInputElement>event.target).value;
    }
    /** Update the down count of the play */
    function updateDown(event: Event) {
        if (typeof play == 'string') return;
        play.down = parseInt((<HTMLSelectElement>event.target).value);
    }
    /** Set everything to "1st & 10" and send it */
    function setFirstAnd10() {
        play = {
            down: 1,
            distance: 10
        };
        // @ts-expect-error
        play.down = "1";
        play.down = 1;
        down = "1";
        appState.play = '1st & 10';
        setGlobalFlag(false);
    }


    /** Toggle whether a generic flag is shown */
    function toggleFlag() {
        setGlobalFlag();
    }

    /** Set the global flag and disable team flags
     * @param value Whether or not the flag is shown. If undefined, toggles the flag
    */
    function setGlobalFlag(value?: boolean) {
        appState.flag = value ?? !appState.flag;
        appState.home.flag = '';
        appState.away.flag = '';
    }


    /** Clear both teams' possession */
    function clearPossession() {
        appState.home.possession = false;
        appState.away.possession = false;
    }


    $: if (appState) {  // On update
        socket.emit('fullState', gid, appState);    // Send a full state
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

{#if appState} <!-- We have a valid state from the server -->
    <div class="card m-3 p-3"> <!-- General team config that probably doesn't need to be touched during a game (besides hiding/showing the clock at halftime) -->
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

    <div class="container"> <!-- Game-time controls -->
        <div class="row">
            <div class="card col-md m-1 p-3"> <!-- Play and Flag -->
                <h5>Play</h5>
                <div class="input-group mb-3">
                    {#if typeof play !== 'object'} <!-- Custom (not of form DOWN & DIST) -->
                        <input
                            type="text"
                            class="form-control"
                            value={appState.play || ''}
                            on:change={handlePlayChange}
                        />
                    {:else} <!-- General plays, of form DOWN & DIST -->

                        <!-- Quick access to reset to 1st & 10 -->
                        <button
                            class="btn btn-outline-info mx-1"
                            style="margin-left: 0;"
                            on:click={setFirstAnd10}
                        >1st &amp; 10</button>

                        <!-- svelte-ignore a11y-no-onchange -->
                        <select value={down} on:change={updateDown}> <!-- Down (1-4) -->
                            <option value=1>1</option>
                            <option value=2>2</option>
                            <option value=3>3</option>
                            <option value=4>4</option>
                        </select>

                        <span style="padding: 6.4px 0"> <!-- Text to format (indicator &)-->
                            &nbsp;{indicator(play.down)} &amp;&nbsp;
                        </span>

                        <!-- Distance to 1st Down -->
                        <input
                            type="number"
                            min=0
                            max=100
                            bind:value={play.distance}
                        />

                        <!-- Dispatch -->
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

                    <!-- Clear/Hide Play -->
                    <button
                        class="btn btn-outline-secondary"
                        on:click={()=>{appState.play = ''}}
                    >Clear</button>

                    <!-- Switch mode (template/custom) -->
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
                        }}
                    >Mode</button>
                </div>

                <!-- Toggle Flag -->
                <button
                    class="btn mb-1"
                    class:btn-warning={appState.flag}
                    class:btn-outline-warning={!appState.flag}
                    on:click={toggleFlag}
                >{appState.flag ? 'Clear Flag' : 'Flag'}</button>
            </div>
            <div class="card col-md m-1 p-3"> <!-- Clock -->
                <h5>Clock</h5>
                {#if enableTime} <!-- Clock Controls -->
                    <!-- Start/Stop -->
                    <button
                        class="btn mb-1"
                        class:btn-primary={timer}
                        class:btn-outline-primary={!timer}
                        on:click={toggleClock}
                    >Clock {timer ? 'Running' : 'Stopped'}</button>

                    <!-- Clock Value -->
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
            <div class="card col-lg m-1 p-3"> <!-- Home Team Controls -->
                <TeamControl
                    bind:team={appState.home}
                    setFlag={setGlobalFlag}
                    {clearPossession}
                />
            </div>
            <div class="card col-lg m-1 p-3"> <!-- Away Team Controls -->
                <TeamControl
                    bind:team={appState.away}
                    setFlag={setGlobalFlag}
                    {clearPossession}
                />
            </div>
        </div>
    </div>

{/if}

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