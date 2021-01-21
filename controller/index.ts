import 'bootstrap/dist/css/bootstrap.min.css';
import bootstrap from 'bootstrap';
import { GameState, PartialState } from '../SharedDefinitions';
import { io } from 'socket.io-client';
import merge from 'deepmerge';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js', {
        scope: './'
    }).then(()=>{console.log('Registered Service Worker!')});
}

let $ = (selector:string) => document.querySelector(selector);
let $$ = (selector:string) => document.querySelectorAll(selector);

document.querySelectorAll('button').forEach(button => {
    if (button.parentElement.querySelectorAll('input[type="number"]').length == 1) {
        button.addEventListener('click', function () {
            console.log('click');
            let input:HTMLInputElement = this.parentElement.querySelector('input[type="number"]');
            input.value = clamp(parseInt(input.value || '0') + (this.innerText == '+' ? 1 : (this.innerText == '-' ? -1 : 0)), parseInt(input.min) || 0, parseInt(input.max) || Infinity) + '';
            input.dispatchEvent(new Event('change'));
        });
    }
});

function sendPartialState(state?:PartialState) {
    console.log('sendPartialState', state);
}

function clamp(num:number, min:number, max:number) {
    return num < min ? min : (num > max ? max : num);
}

enum StatusColor {
    INFO, OK, PROBLEM
}

let setConnectionStatus = (status:string, color) => {
    let tag = <HTMLSpanElement>$('nav span.badge');
    tag.innerText = status;
    let newColor = 'secondary';
    switch (color) {
        case StatusColor.INFO:
            tag.classList.remove('bg-secondary');
            tag.classList.add('bg-primary');
            tag.classList.remove('bg-success');
            tag.classList.remove('bg-danger');
            newColor = 'primary';
            break;

        case StatusColor.OK:
            tag.classList.remove('bg-secondary');
            tag.classList.remove('bg-primary');
            tag.classList.add('bg-success');
            tag.classList.remove('bg-danger');
            newColor = 'success';
            break;

        case StatusColor.PROBLEM:
            tag.classList.remove('bg-secondary');
            tag.classList.remove('bg-primary');
            tag.classList.remove('bg-success');
            tag.classList.add('bg-danger');
            newColor = 'danger'
            break;
        
        default:
            tag.classList.add('bg-secondary');
            tag.classList.remove('bg-primary');
            tag.classList.remove('bg-success');
            tag.classList.remove('bg-danger');
            newColor = 'secondary'
    }
    let renderedColor = getComputedStyle(tag).getPropertyValue(`--${newColor}`);
    $('meta[name="theme-color"]').setAttribute('content', renderedColor);
}

let url = new URL(location.href);
let gid = (<HTMLInputElement>$('#gid')).value = url.searchParams.get('gid') || 'default';
let state:GameState = undefined;

const socket = io();
socket.on('connect', () => {
    attachGID();
});
socket.on('disconnect', () => {
    setConnectionStatus('Disconnected', StatusColor.PROBLEM);
});

socket.on('error', (who:string, details:string) => {
    setConnectionStatus(`${who.charAt(0).toUpperCase() + who.substr(1)} Error: ${details}`, StatusColor.PROBLEM);
});

function attachGID() {
    setConnectionStatus('Handshake', StatusColor.INFO);
    gid = (<HTMLInputElement>$('#gid')).value || 'default';
    socket.emit('getFullState', gid);
}

socket.on('fullState', (gid:string, gameState:GameState) => {
    state = gameState;
    loadState();
    setConnectionStatus('Connected', StatusColor.OK);
});

socket.on('partialState', (thisGID:string, newState:PartialState) => {
    console.log('partialState', {gid: thisGID, state: newState});
    if (thisGID != gid) {
        return;
    }
    state = <GameState>merge(state, newState);
    loadState();
});

function loadState() {
    console.log('loadState', state);
    (<HTMLInputElement>$('#aName')).value = state.away.name;
    (<HTMLInputElement>$('#aColor')).value = state.away.color;
    (<HTMLInputElement>$('#aScore')).value = state.away.score + '';

    (<HTMLInputElement>$('#period')).value = state.time.period.number + '';

    (<HTMLInputElement>$('#hName')).value = state.home.name;
    (<HTMLInputElement>$('#hColor')).value = state.home.color;
    (<HTMLInputElement>$('#hScore')).value = state.home.score + '';
}

$('#pull').addEventListener('click', attachGID);
$('#push').addEventListener('click', () => {
    socket.emit('fullState', gid, state);
});
$('#reset').addEventListener('click', () => {
    socket.emit('new', gid);
});

(<HTMLInputElement>$('#aName')).addEventListener('input', function () {socket.emit('partialState', gid, <PartialState>{away: {name: this.value}});});
(<HTMLInputElement>$('#aColor')).addEventListener('input', function () {socket.emit('partialState', gid, <PartialState>{away: {color: this.value}});});
(<HTMLInputElement>$('#aScore')).addEventListener('change', function () {socket.emit('partialState', gid, <PartialState>{away: {score: parseInt(this.value)}});});
(<HTMLInputElement>$('#period')).addEventListener('change', function () {socket.emit('partialState', gid, <PartialState>{time: {period: {number: parseInt(this.value)}}});});
(<HTMLInputElement>$('#hName')).addEventListener('input', function () {socket.emit('partialState', gid, <PartialState>{home: {name: this.value}});});
(<HTMLInputElement>$('#hColor')).addEventListener('input', function () {socket.emit('partialState', gid, <PartialState>{home: {color: this.value}});});
(<HTMLInputElement>$('#hScore')).addEventListener('change', function () {socket.emit('partialState', gid, <PartialState>{home: {score: parseInt(this.value)}});});