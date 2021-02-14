export type GameState = {
    away: Team,
    home: Team,
    time: Clock
} & PartialState
export type Team = {
    name: string,
    color: string,
    score: number,
    penalties: Penalty[]
}
export type Penalty = {
    player?: Player,
    offense?: string,
    time: Timer
}
export type Player = {
    number?: number,
    name?: string,
}
export type Timer = {
    mode: 'running' | 'stopped' | 'disabled',
    time?: number | string
}
export type Clock = Timer & {
    period: {
        type: string,
        number: number
    }
}

export type PartialState = {
    away?: PartialTeam,
    home?: PartialTeam,
    time?: PartialClock
}
export type PartialTeam = {
    name?: string,
    color?: string,
    score?: number,
    penalties?: Penalty[]
}
export type PartialClock = Timer & {
    period?: {
        type: string,
        number: number
    }
}

export function timeToString(time: number) {
    let seconds = Math.max(time % 60, 0);
    let secondsString = (seconds < 10 ? '0' : '') + (Math.round(seconds * 10) / 10);
    let minutes = Math.max((time - seconds) / 60, 0);
    let minutesString = minutes != 0 ? `${minutes}:` : '';

    return minutesString + secondsString;
}