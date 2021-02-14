import 'bootstrap/dist/css/bootstrap.min.css';
import bootstrap from 'bootstrap';
import { GameState, PartialState, Penalty, Player, Timer } from '../Shared';
import { io } from 'socket.io-client';
import merge from 'deepmerge';
import { debug } from 'console';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js', {
        scope: './'
    }).then(()=>{console.log('Registered Service Worker!')});
}

let $ = (selector:string) => document.querySelector(selector);
let $$ = (selector:string) => document.querySelectorAll(selector);

document.querySelectorAll('button').forEach(button => {
    if (button.parentElement.childElementCount == 3 && button.parentElement.querySelectorAll('input[type="number"]').length == 1) {
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
    INFO, OK, PROBLEM, WARNING
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
            tag.classList.remove('bg-warning');
            newColor = 'primary';
            break;

        case StatusColor.OK:
            tag.classList.remove('bg-secondary');
            tag.classList.remove('bg-primary');
            tag.classList.add('bg-success');
            tag.classList.remove('bg-danger');
            tag.classList.remove('bg-warning');
            newColor = 'success';
            break;

        case StatusColor.PROBLEM:
            tag.classList.remove('bg-secondary');
            tag.classList.remove('bg-primary');
            tag.classList.remove('bg-success');
            tag.classList.add('bg-danger');
            tag.classList.remove('bg-warning');
            newColor = 'danger'
            break;
        
        case StatusColor.WARNING:
            tag.classList.remove('bg-secondary');
            tag.classList.remove('bg-primary');
            tag.classList.remove('bg-success');
            tag.classList.remove('bg-danger');
            tag.classList.add('bg-warning');
            newColor = 'warning'

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

const socket = io('wss://gizm0.tk');
socket.on('connect', () => {
    attachGID();
    socket.emit('declareRole', 'controller');
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
    state = <GameState>merge(state, newState, {arrayMerge: (destination, source, options)=>source});
    loadState();
});

function loadState() {
    console.log('loadState', state);
    (<HTMLInputElement>$('#aName')).value = state.away.name;
    (<HTMLInputElement>$('#aColor')).value = state.away.color;
    (<HTMLInputElement>$('#aScore')).value = state.away.score + '';
    $('.away .penalties').childNodes.forEach(child => child.parentElement.removeChild(child));
    generatePenalties(state.away.penalties).forEach(container => $('.away .penalties').appendChild(container));

    (<HTMLInputElement>$('#period')).value = state.time.period.number + '';

    (<HTMLInputElement>$('#hName')).value = state.home.name;
    (<HTMLInputElement>$('#hColor')).value = state.home.color;
    (<HTMLInputElement>$('#hScore')).value = state.home.score + '';
    $('.home .penalties').childNodes.forEach(child => child.parentElement.removeChild(child));
    generatePenalties(state.home.penalties).forEach(container => $('.home .penalties').appendChild(container));
}

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
    setConnectionStatus(`Connected; Ping: ${latency}ms`, StatusColor.OK);
});

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
(<HTMLInputElement>$('#time')).addEventListener('change', function () {socket.emit('partialState', gid, <PartialState>{time: {time: this.value}});});
(<HTMLInputElement>$('#period')).addEventListener('change', function () {socket.emit('partialState', gid, <PartialState>{time: {period: {number: parseInt(this.value)}}});});
(<HTMLInputElement>$('#hName')).addEventListener('input', function () {socket.emit('partialState', gid, <PartialState>{home: {name: this.value}});});
(<HTMLInputElement>$('#hColor')).addEventListener('input', function () {socket.emit('partialState', gid, <PartialState>{home: {color: this.value}});});
(<HTMLInputElement>$('#hScore')).addEventListener('change', function () {socket.emit('partialState', gid, <PartialState>{home: {score: parseInt(this.value)}});});


function generatePenalties(penalties: Penalty[] = []) {
    penalties = penalties.filter(penalty => penalty != undefined);
    penalties.push(undefined);
    let elements = penalties.map(penalty => {
        let container = document.createElement('div');
        container.classList.add('btn-group');
        container.setAttribute('role', 'group');

        let removeButton = document.createElement('button');
        removeButton.classList.add('btn', 'btn-primary');
        removeButton.innerText = '-';
        removeButton.addEventListener('click', function (event) {
            this.parentElement.remove();
            sendPenalties(false);
        });
        container.appendChild(removeButton);

        let playerNumber = document.createElement('input');
        playerNumber.type = 'number';
        playerNumber.classList.add('form-control', 'num');
        playerNumber.placeholder = '#';
        if (penalty?.player?.number) {
            playerNumber.value = penalty.player.number.toString();
        }
        // playerNumber.addEventListener('change', sendPenalties);
        container.appendChild(playerNumber);

        let offense = document.createElement('input');
        offense.type = 'text';
        offense.classList.add('form-control', 'offense');
        offense.placeholder = 'Offense';
        if (penalty?.offense) {
            offense.value = penalty.offense;
        }
        // offense.addEventListener('change', sendPenalties);
        container.appendChild(offense);

        let outTime = document.createElement('input');
        outTime.type = 'text';
        outTime.classList.add('form-control', 'out');
        outTime.placeholder = 'Out Time';
        if (penalty?.time?.time) {
            outTime.value = typeof penalty.time.time == 'string' ? penalty.time.time : penalty.time.time.toString();
        }
        // outTime.addEventListener('change', sendPenalties);
        container.appendChild(outTime);

        if (!penalty) {
            let addButton = document.createElement('button');
            addButton.classList.add('btn', 'btn-primary');
            addButton.innerText = '+';
            addButton.addEventListener('click', function () { 
                this.remove();
                sendPenalties();
                // this.parentElement.parentElement.appendChild(generatePenalties([])[0]);
                // this.remove();
            });
            container.appendChild(addButton);
        }

        return container;
    });
    // debugger;
    return elements;
}

function storePenalties(container: HTMLDivElement) {
    let penalties: Penalty[] = [];
    for (const el of container.children) {
        let penalty = <Penalty>{};
        let number = parseInt((<HTMLInputElement>el.querySelector('.num')).value) || undefined;
        let offense = (<HTMLInputElement>el.querySelector('.offense')).value || undefined;
        let outTime = (<HTMLInputElement>el.querySelector('.out')).value || undefined;
        if (number) {
            penalty.player = <Player>{};
            penalty.player.number = number;
        }
        if (offense) {
            penalty.offense = offense;
        }
        penalty.time = <Timer>{};
        if (outTime) {
            penalty.time.time = outTime;
        }
        penalties.push(penalty);
    }
    debugger;
    return penalties;
}

function sendPenalties(reLoad = true) {
    let state:PartialState = {
        home: {
            penalties: storePenalties(<HTMLDivElement>$('.home .penalties')).filter(penalty => penalty?.time?.time != undefined)
        },
        away: {
            penalties: storePenalties(<HTMLDivElement>$('.away .penalties')).filter(penalty => penalty?.time?.time != undefined)
        }
    };
    // debugger;
    socket.emit('partialState', gid, state);
    if (reLoad) {
        loadState();
    }
}