<script lang="ts">

/*
 * Streamboard - a free and extendible scoreboard overlay for livestreaming
 * Copyright (C) 2021  Sam Ollari
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */


    import { io } from 'socket.io-client';
    import type { GameState } from '../SharedUtilities';
    
    const gid = new URL(location.href).searchParams.get('gid');

    let appState: GameState;
    $: ({ gameData } = appState ?? { gameData: undefined });
    let gameComponent: unknown;
    let errorText = gid ?
        '<span style="color: #2196f3">Connecting to WS Server</span>'
        : '<span style="color: #f44336">No Game ID</span>';

    $: showComponent = !errorText && (appState && gameComponent);

    const socket = io(':3000');
    socket.on('connect', () => {
        if (gid) {
            errorText = '<span style="color: #2196f3">Requesting game state</span>';

            // Request the current game state
            // This will automatically join us to the room for this game
            // so if it doesn't exist now but is created later, we will be notified
            socket.emit('joinGame', gid);
            socket.emit('getGameState', gid);
        }

        // When the game we're waiting for is created,
        // we can get ready to receive more data
        socket.on('gameCreated', (gameState: GameState) => {
            appState = gameState;
            console.log('Game created', gameState);
            initializeGame(appState.gameType);
        });

        socket.on('gameState', (gameState: GameState) => {
            const oldAppState = appState;
            appState = gameState;
            // console.log({gameState});
            if (oldAppState === undefined) {
                initializeGame(appState.gameType);
            }
            // console.log('Game state updated', gameState);
        });

        socket.on('deleteGame', () => {
            appState = undefined;
            gameComponent = undefined;
            errorText = 'Game was deleted';
        });

        socket.on('error', (error: string) => {
            console.warn(error);
            errorText = `<span style="color: #f44336">${error}</span>`;
        });

        socket.on('disconnect', () => {
            console.warn('Disconnected');
            errorText = `<span style="color: #f44336">Disconnected</span>`;
            appState = undefined;
            gameComponent = undefined;
        });

        socket.on('customEvent', console.log);

    });

    async function initializeGame(game: string) {
        console.log(`Initializing game: ${game}`);
        try {
            gameComponent = (await import(`./games/${game}.svelte`)).default;
            errorText = undefined;
        } catch (e) {
            console.error(e);
            errorText = `<span style="color: #f44336">Could not load module:<br><code>${e.message.replace('\n', '<br>')}</code></span>`;
        }
    }

    function registerCustomUpdateListener(event: string, callback: (data: unknown) => any): void {
        socket.on(event, callback);
    }
</script>

<!-- {@debug gameData} -->

<div class="mainContainer" style="display: {showComponent ? 'initial' : 'none'}">
    {#if gameComponent}
        <svelte:component this={gameComponent} {gameData} {registerCustomUpdateListener} />
    {/if}
</div>
{#if errorText}
    <div class="errorText">{@html errorText}</div>
{/if}

<style>
    .mainContainer {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #000;
    }

    .errorText {
        display: grid;
        place-items: center;

        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #000;

        z-index: 100;
    }

    :global(code) {
        font-family: monospace;
    }
</style>