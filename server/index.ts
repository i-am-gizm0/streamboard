import { join } from 'path';
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GameState } from '../src/SharedDefinitions';
import merge from 'deepmerge';

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
        socket.emit('pong', nonce);
    });

    socket.on('new', (gid: string) => {
        if (!gid) {
            socket.emit('error', 'client', 'gid undefined');
            return;
        }
        gameStates[gid] = defaultGameState;
        socket.broadcast.emit('newGID', gid);
        socket.emit('fullState', gid, gameStates[gid]);
    });

    socket.on('getFullState', (gid: string) => {
        if (!gid) {
            socket.emit('error', 'client', 'gid undefined');
            return;
        }
        socket.emit('fullState', gid, gameStates[gid]);
    });
    socket.on('fullState', (gid: string, state: GameState) => {
        console.log('fullState', {gid, state});
        if (!gid || !state) {
            socket.emit('error', 'client', 'gid or state undefined');
            return;
        }
        gameStates[gid] = state;
        socket.broadcast.emit('fullState', gid, gameStates[gid]);
    });

    socket.on('partialState', (gid: string, state: GameState) => {
        console.log('partialState', {gid, state});
        if (!gid || !state) {
            socket.emit('error', 'client', 'gid or state undefined');
            return;
        }
        gameStates[gid] = <GameState>merge(gameStates[gid], state, {arrayMerge: (destination, source, options)=>source});
        socket.broadcast.emit('partialState', gid, state);
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