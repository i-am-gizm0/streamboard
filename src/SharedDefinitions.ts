export type GameState = {
    home: Team;
    away: Team;
    time: Clock;
    play?: string;
    flag?: boolean;
};

export type Team = {
    name: string;
    color: string;
    score: number;
    timeoutsLeft?: number;
    timeoutsMax?: number;
    flag?: string;
    possession: boolean;
}

export type Clock = {
    time?: string | number;
    period: number;
};

export enum StatusColor {
    INFO, OK, PROBLEM, WARNING
}

export function timeToString(time: number) {
    time = Math.max(time, 0);

    const showTenths = time < 60;

    const seconds = Math.max(time % 60, 0);
    const fullSeconds = Math.floor(seconds);
    const tenths = Math.floor((Math.floor(seconds * 10) / 10 - fullSeconds) * 10);
    const prependZero = seconds < 10;
    const secondsString = `${
        prependZero ? '0' : ''
    }${
        showTenths ?
            `${fullSeconds}.${tenths}` :
            fullSeconds
    }`;

    const minutes = Math.max((time - seconds) / 60, 0);
    const minutesString = minutes != 0 ? `${minutes}:` : '';
    
    return `${minutesString}${secondsString}`
}

export function parseTimeString(time: string) {
    const match = time.match(/(?:([0-9]{1,2}):)?([0-5][0-9])(?:\.([0-9]))?/);
    const minutes = match[1] ? parseInt(match[1]) : 0;
    const seconds = parseInt(match[2]);
    const tenths = match[3] ? parseInt(match[3]) : 0;
    return minutes * 60 + seconds + tenths / 10;
}