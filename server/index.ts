import { join } from 'path';
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

import merge from 'deepmerge';

import { GameState } from '../src/SharedDefinitions';

const app = express();

const server = createServer(app);
const io = new Server(server);

// app.use('/', express.static(join(__dirname, '../build')));
app.use('/', express.static('./build/'));

io.on('connection', (socket: Socket) => {
    console.log(`${socket.id.substr(0, 8)} connected`);

    socket.on('disconnect', () => {
        console.log(`${socket.id.substr(0, 8)} disconnected`);
    });

    socket.on('ping', (nonce?: number) => {
        socket.volatile.emit('pong', nonce);
    });


    socket.on('getFullState', (
        gid: string,
        callback: (response: GameState) => void
    ) => {    // Client requesting full state
        if (!gid) { // If no game specified
            socket.emit('error', 'client', 'gid undefined');    // Return an error
            return;
        }

        socket.join(gid);

        if (!(gid in gameStates)) { // If this game didn't exist...
            gameStates[gid] = defaultGameState; // Create it
            console.log(`Created game ${gid}`);
        }

        console.log({gid, callback});

        if (callback) {
            callback(gameStates[gid]);
        } else {
            socket.emit('fullState', gid, gameStates[gid]);
        }
    });


    socket.on('fullState', (gid: string, state: GameState) => { // Client sent a full state
        console.log('fullState', {gid, state});

        if (!gid || !state) {
            socket.emit('error', 'client', 'gid or state undefined');
            return;
        }

        gameStates[gid] = state;

        socket.to(gid).emit('fullState', gid, state);   // Forward to the rest of the room
        // socket.broadcast.emit('fullState', gid, state);
    });

    socket.on('partialState', (gid: string, state: GameState) => {  // Client sent a partial state
        console.log('partialState', {gid, state});
        if (!gid || !state) {
            socket.emit('error', 'client', 'gid or state undefined');
            return;
        }
        gameStates[gid] = <GameState>merge(
            gameStates[gid],
            state,
            {
                arrayMerge: (destination, source, options)=>source
            }
        );   // Merge it
        
        // socket.broadcast.emit('partialState', gid, state);
        socket.to(gid).emit('partialState', gid, state);    // Forward to the rest of the room
    });
});

server.listen(3000, ()=>{
    console.log('listening on 0.0.0.0:3000');
});

let defaultGameState = <GameState> {
    home: {
        name: 'Lancers',
        color: '#282828',
        score: 0,
        timeoutsLeft: 3,
        possession: false
    },
    away: {
        name: 'Colts',
        color: '#007BBB',
        score: 0,
        timeoutsLeft: 3,
        possession: false
    },
    time: {
        time: 0,
        period: 0
    }
};
let gameStates:{[key:string]:GameState} = {
    default: defaultGameState
};