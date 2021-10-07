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
    import { StatusColor, titleCase } from '../SharedUtilities';
    import type { GameState } from '../SharedUtilities';
    import {
        Accordion,
        AccordionItem,
        Badge,
        Button,
        Col,
        Container,
        Input,
        Label,
        Modal,
        ModalBody,
        ModalHeader,
        ModalFooter,
        Navbar,
        Nav,
        Row,
        Spinner,
FormGroup
    } from 'sveltestrap';
    import merge from 'deepmerge';

    let gid = new URL(location.href).searchParams.get('gid');

    let appState: GameState;
    $: ({ gameData } = appState ?? { gameData: undefined});

    let setupComponent: unknown;
    let mainControlsComponent: unknown;

    let statusText: string = gid ? 'Connecting WS' : 'No game ID';
    let statusColor: StatusColor = gid ? StatusColor.INFO : StatusColor.PROBLEM;

    const socket = io(':3000');
    socket.on('connect', () => {
        if (gid) {
            statusText = 'Requesting Game State';
            statusColor = StatusColor.INFO;

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
            console.log({gameState});
            if (oldAppState === undefined) {
                initializeGame(appState.gameType);
            }
            // console.log('Game state updated', gameState);
        });

        socket.on('deleteGame', () => {
            appState = undefined;
            mainControlsComponent = undefined;
            // TODO: Make this a popup, probably
            statusText = 'Game was deleted';
            statusColor = StatusColor.PROBLEM;
        });

        socket.on('error', (error: string) => {
            console.warn(error);
            // TODO: Make this a popup, probably
            statusText = error;
            statusColor = StatusColor.PROBLEM;
        });

        socket.on('disconnect', () => {
            console.warn('Disconnected');
            statusText = 'Disconnected';
            statusColor = StatusColor.PROBLEM;
            appState = undefined;
            mainControlsComponent = undefined;
            createGameModalOpen = false;
        });
    });

    async function initializeGame(game: string) {
        console.log(`Initializing game: ${game}`);
        try {
            statusText = `Loading ${game} controls`;
            statusColor = StatusColor.INFO;
            setupComponent = (await import(`./games/${game}/Setup.svelte`)).default;
            mainControlsComponent = (await import(`./games/${game}/Main.svelte`)).default;
            statusText = `${game} controls loaded`;
            statusColor = StatusColor.OK;
        } catch (e) {
            console.error(e);
            statusText = `Could not load ${game} controls!`;
            statusColor = StatusColor.PROBLEM;
            alert(e.message);
        }
    }

    function partialStateUpdate(data: Partial<unknown>) {
        appState.gameData = merge(
            appState.gameData,
            data,
            { arrayMerge: (_, source) => source }
        );
        socket.emit('setPartialGameState', data);
        console.trace(appState.gameData);
    }

    function customUpdate(event: string, data: unknown): void {
        socket.emit('customEvent', event, data);
    }

    function registerCustomUpdateListener(event: string, callback: (data: unknown) => any): void {
        socket.on(event, callback);
    }

    let createGameModalOpen = false;
    const toggleCreateGameModal = () => createGameModalOpen = !createGameModalOpen;
    let createGameType: string = undefined;

    function getClientSupportedGames(): Promise<string[]> {
        if (!socket || !socket.connected) {
            throw 'Socket not connected!';
        }

        return new Promise((resolve, reject) => {
            socket.emit('getClientSupportedGames', (games: string[]) => {
                if (games === undefined) {
                    reject('No games returned!');
                } else {
                    resolve(games);
                }
            });
        });
    }

    function createGame() {
        socket.emit('createGame', gid, createGameType);
        createGameModalOpen = false;
    }
</script>

<Navbar color="light">
    <div class="navbar-brand">
        Streamboard
        <Badge color={statusColor === StatusColor.INFO ? 'info' : (statusColor === StatusColor.OK ? 'success' : (statusColor === StatusColor.PROBLEM ? 'danger' : 'secondary'))}>{statusText}</Badge>
    </div>
    <Nav>
        <Input placeholder="Game ID" value={gid} on:change={(e) => {
            let url = new URL(location.href);
            // @ts-ignore
            url.searchParams.set('gid', (e.target).value);
            location.href = url.href;
        }} />
    </Nav>
</Navbar>

<main>
    {#if appState}
        <Container>
            <Row>
                <Col>
                    <Accordion class="mt-3">
                        <AccordionItem header="Game Setup">
                            <svelte:component this={setupComponent} state={gameData} {partialStateUpdate} {customUpdate} {registerCustomUpdateListener} />
                        </AccordionItem>
                    </Accordion>
                </Col>
            </Row>
        </Container>
        <Container>
            <svelte:component this={mainControlsComponent} state={gameData} {partialStateUpdate} {customUpdate} {registerCustomUpdateListener} />
        </Container>
    {:else if gid}
        <Container>
            <Row>
                <Col class="mt-5" style="text-align: center">
                    <Spinner color=primary class="mb-5" />
                    {#if statusText.includes('does not exist')}
                        <h2>That game doesn't exist right now.</h2>
                        <h4>It will load automatically if it's created</h4>
                        <span>Or you can</span>
                        <Button color="primary" on:click={toggleCreateGameModal}>Create Game</Button>
                    {/if}
                    {#if statusText === ('Disconnected')}
                        <h2>Reconnecting to server</h2>
                    {/if}
                </Col>
            </Row>
        </Container>
    {:else}
        <Container>
            <Row>
                <Col class="mt-5" style="text-align: center">
                    <h1>No game ID</h1>
                </Col>
            </Row>
        </Container>
    {/if}
</main>

<Modal isOpen={createGameModalOpen} toggle={toggleCreateGameModal}>
    <ModalHeader toggle={toggleCreateGameModal}>Create Game</ModalHeader>
    <ModalBody>
        <FormGroup>
            <Label for="createGameId">Game ID</Label>
            <Input readonly value={gid} />
        </FormGroup>
        <FormGroup>
            <Label for="createGameType">Game Type</Label>
            {#await getClientSupportedGames()}
                <Input type="select" id="createGameType" disabled>
                    <option disabled>Fetching supported games...</option>
                </Input>
                <Spinner color="primary" size="sm" />
            {:then games} 
                <Input type="select" id="createGameType" bind:value={createGameType} autofocus>
                    <option disabled>Choose a game</option>
                    {#each games as game}
                        <option value={game}>{titleCase(game)}</option>
                    {/each}
                </Input>
            {:catch error}
                <span class="text-danger">Something went wrong! {error.message}</span>
            {/await}
        </FormGroup>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={toggleCreateGameModal}>Cancel</Button>
        <Button color="primary" on:click={createGame}>Create</Button>
    </ModalFooter>
</Modal>