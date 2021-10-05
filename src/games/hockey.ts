export const defaultState: HockeyState = {
    home: {
        name: 'Home Team',
        color: '#f44336',
        score: 0,
        penalties: [],
    },
    away: {
        name: 'Away Team',
        color: '#03a9f4',
        score: 0,
        penalties: [],
    },
    time: {
        time: 0,
        period: 0,
    },
    config: {
        periodLength: 900,
        minorLength: 120,
        majorLength: 300,
    }
};

export type HockeyState = {
    home: Team;
    away: Team;
    time: Time;
    config: Config;
}

export type Team = {
    name: string;
    color: string;
    score: number;
    penalties: Penalty[];
}

export type Penalty = {
    player?: number;
    offense?: string;
    remainingTime: number;
    id: number;
}

export type Time = {
    time: number;
    period: number;
    custom?: string;
}

export type Config = {
    periodLength: number;
    minorLength: number;
    majorLength: number;
}