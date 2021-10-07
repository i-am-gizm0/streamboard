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

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import merge from 'deepmerge';

import { readdirSync } from 'fs';
import { join } from 'path';

import { defaultState as defaultHockeyState } from '../src/games/hockey';

// Set up a server with Socket.IO and Express
const app = express();
const server = createServer(app);
const io = new Server(server
    // , {
    //     cors: {
    //         origin: '*',
    //     }
    // }
);

// Set up storage for the game states
const gameStates: { [key: string]: GameState } = {
    'default': {
        gameType: 'hockey',
        gameData: defaultHockeyState
    }
};

// Set up a map of sockets to which game they're in
const socketGameMap: { [key: string]: string } = {};

// Serve files from the public directory
app.use(express.static(join(__dirname, '../public')));

// Wait for connections
io.on('connection', (socket) => {
    console.log(`${socket.id.substr(0, 8)} connected`);

    socket.on('disconnect', () => {
        console.log(`${socket.id.substr(0, 8)} disconnected`);

        delete socketGameMap[socket.id];    // Forget about this socket
    });

    // When we receive a ping message with a nonce as a number, send a pong with the nonce
    socket.on('ping', (nonce) => {
        // Send a volatile message to the client so we don't keep trying if it doesn't work.
        socket.volatile.emit('pong', nonce);
    });

    // When the user creates a game
    socket.on('createGame', async (gameID: string, gameType: string) => {
        console.log(`${socket.id.substr(0, 8)} created ${gameType} game ${gameID}`);

        // Join the room for the game ID
        socket.join(gameID);
        socketGameMap[socket.id] = gameID;

        // Check if the game already exists and return an error
        if (gameStates[gameID]) {
            socket.emit('error', `Game ${gameID} already exists`);
            return;
        }

        try {
            // Load the default game state
            const game = await import(`../src/games/${gameType}`);
            const defaultState = game.defaultState;

            // Create a new game state and add it to the gameStates object
            gameStates[gameID] = {
                gameType,
                gameData: defaultState,
            };
        } catch (err) {
            console.error(err);
            socket.emit('error', `Could not create game ${gameID}`);
        }

        // Send the game state to the client
        // socket.emit('gameState', gameStates[gameID]);
        io.to(gameID).emit('gameCreated', gameStates[gameID]);
    });

    socket.on('joinGame', (gameID: string) => {
        console.log(`${socket.id.substr(0, 8)} joined ${gameID}`);

        // Join the room for the game ID
        socket.join(gameID);
        socketGameMap[socket.id] = gameID;  // Remember which game they're in

        // TODO: Do we want to notify other clients that someone joined?
        // socket.to(gameID).emit('joined', socket.id)
    });

    // When the user requests the full state of a game with the gameID, send it to them
    socket.on('getGameState', () => {
        // Get the game ID from the socket
        const gameID = socketGameMap[socket.id];
        if (!gameID) {
            socket.emit('error', 'You are not in a game');
            return;
        }

        console.log(`${socket.id.substr(0, 8)} requested state of game ${gameID}`);

        // Join the room (or make sure they're in it) for the game ID
        socket.join(gameID);
        socketGameMap[socket.id] = gameID;

        // Check if the game doesn't exist and return an error
        if (!gameStates[gameID]) {
            socket.emit('error', `Game ${gameID} does not exist`);
            return;
        }

        // Send the game state to the client
        socket.emit('gameState', gameStates[gameID]);
    });

    // When the user sends a full state with the gameID, save it and send it to the rest of the room
    socket.on('setGameState', (state: unknown) => {
        const gameID = socketGameMap[socket.id];
        if (!gameID) {
            socket.emit('error', 'You are not in a game');
            return;
        }
        console.log(`${socket.id.substr(0, 8)} set state of game ${gameID} to ${JSON.stringify(state)}`);

        gameStates[gameID].gameData = state;

        // Send the game state to the room, excluding the client
        socket.to(gameID).emit('gameState', gameStates[gameID]);
    });

    // When the user sends a partial state with the gameID, merge it and send it to the rest of the room
    socket.on('setPartialGameState', (state: unknown) => {
        const gameID = socketGameMap[socket.id];
        if (!gameID) {
            socket.emit('error', 'You are not in a game');
            return;
        }
        console.log(`${socket.id.substr(0, 8)} set partial state of game ${gameID} to ${JSON.stringify(state)}`);

        // Merge the new state with the existing one
        gameStates[gameID].gameData = merge(
            gameStates[gameID].gameData,
            state,
            { arrayMerge: (_, source) => source } // Overwrite arrays
        );

        // Send the game state to the room, excluding the client
        socket.to(gameID).emit('gameState', gameStates[gameID]);
    });

    // When the user wants to delete a game with the gameID, log it
    socket.on('deleteGame', () => {
        // Get the game ID from the socket
        const gameID = socketGameMap[socket.id];
        if (!gameID) {
            socket.emit('error', 'You are not in a game');
            return;
        }
        console.log(`${socket.id.substr(0, 8)} deleted game ${gameID}`);

        // Delete the game state
        delete gameStates[gameID];

        // Notify the room and then delete it
        socket.to(gameID).emit('deleteGame');
        socket.leave(gameID);
        (async () => {
            // Get all sockets in the room
            const sockets = await io.in(gameID).fetchSockets();
            // Leave the room for each socket
            sockets.forEach(socket => socket.leave(gameID));
        })();
    });

    // When we receive a custom event, forward it to the rest of the room
    socket.on('customEvent', (event: string, data: unknown) => {
        const gameID = socketGameMap[socket.id];
        if (!gameID) {
            socket.emit('error', 'You are not in a game');
            return;
        }
        console.log(`${socket.id.substr(0, 8)} sent custom event ${event} to game ${gameID} with data ${JSON.stringify(data)}`);

        /* TODO (BREAKING):
         *  Do we want to emit an event with this name?
         *  Or do we want to send back a customEvent with the name as the first data point?
         */
        socket.to(gameID).emit(event, data);
    });

    socket.on('getClientSupportedGames', (callback: (games: string[]) => any) => {
        const games = readdirSync(join(__dirname, '../src/games')).map(file => file.replace('.ts', ''));

        callback(games);
        // socket.emit('clientSupportedGames', games);
    });
});

// Listen on port 3000
server.listen(3000, () => {
    console.log('Listening on port 3000');
});

type GameState = {
    gameType: string;
    gameData: unknown;
};