import { io } from 'socket.io-client';
import { GameState, PartialState } from '../SharedDefinitions';
import merge from 'deepmerge';

let $ = (selector:string) => document.querySelector(selector);
let $$ = (selector:string) => document.querySelectorAll(selector);

let url = new URL(location.href);
let app = {
    dom: {
        loading: <HTMLDivElement>$('.loading'),
        connStatus: <HTMLDivElement>$('.loading .status'),
        bouncer: <HTMLDivElement>$('.bouncer'),
        score: <HTMLDivElement>$('.score'),
        away: <HTMLDivElement>$('.away'),
        aName: <HTMLSpanElement>$('.away .name'),
        aScore: <HTMLSpanElement>$('.away .num'),
        period: <HTMLSpanElement>$('.period .val'),
        home: <HTMLDivElement>$('.home'),
        hName: <HTMLSpanElement>$('.home .name'),
        hScore: <HTMLSpanElement>$('.home .num')
    },
    gid: url.searchParams.get('gid') || 'default',
    state: <GameState>undefined
}

enum StatusColor {
    INFO, OK, PROBLEM
}

let setConnectionStatus = (status:string, color = StatusColor.INFO, connected = false) => {
    if (connected) {
        app.dom.loading.classList.add('hidden');
        app.dom.score.classList.remove('hidden');
    } else {
        app.dom.connStatus.innerText = status;
        app.dom.loading.classList.remove('hidden');
        app.dom.score.classList.add('hidden');
    }
    let bouncer = app.dom.bouncer;
    switch (color) {
        case StatusColor.INFO:
            bouncer.classList.remove('problem');
            bouncer.classList.remove('ok');
            break;

        case StatusColor.OK:
            bouncer.classList.remove('problem');
            bouncer.classList.add('ok');
            break;

        case StatusColor.PROBLEM:
            bouncer.classList.add('problem');
            bouncer.classList.remove('ok');
            break;
    }
}
const socket = io();
socket.on('connect', () => {
    setConnectionStatus('Connected', StatusColor.OK, false);
    socket.emit('ping');
    console.time('ping');
    socket.emit('getFullState', app.gid);
});
socket.on('disconnect', () => {
    setConnectionStatus('Disconnected', StatusColor.PROBLEM, false);
});

socket.on('fullState', (gid:string, state:GameState) => {
    app.state = state;
    loadState();
    setConnectionStatus('Ready', StatusColor.OK, true);
});

socket.on('partialState', (gid:string, state:PartialState) => {
    console.log('partialState', {gid, state});
    if (gid != app.gid) {
        return;
    }
    app.state = <GameState>merge(app.state, state);
    loadState();
});

socket.on('error', (who:string, details:string) => {
    setConnectionStatus(`${who.charAt(0).toUpperCase() + who.substr(1)} Error: ${details}`, StatusColor.PROBLEM, false);
});

socket.on('ping', () => {
    socket.emit('pong');
});
socket.on('pong', () => {
    console.timeEnd('ping');
});

function loadState() {
    const state = app.state;

    app.dom.away.style.setProperty('--bg', state.away.color);
    app.dom.aName.innerText = state.away.name;
    app.dom.aScore.innerText = state.away.score + '';
    
    app.dom.period.innerHTML = state.time.period.type.charAt(0).toUpperCase() + state.time.period.number;

    app.dom.home.style.setProperty('--bg', state.home.color);
    app.dom.hName.innerText = state.home.name;
    app.dom.hScore.innerText = state.home.score + '';
}