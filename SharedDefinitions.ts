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
    offense: string,
    time?: Timer
}
export type Player = {
    number?: number,
    name?: string,
}
export type Timer = {
    mode: 'running' | 'stopped' | 'disabled',
    time?: number
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