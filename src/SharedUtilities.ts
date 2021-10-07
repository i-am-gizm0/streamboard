/** Converts a time in seconds to a human-friendly string
 * @example `timeToString(120)` returns `2:00`
 * @example `timeToString(45.7)` returns `45.7`
 */
export function timeToString(time: number) {
    time = Math.max(time, 0);   // Things break if time is negative, so don't let it be!

    const showTenths = time < 60;   // If less than a minute, show tenths of a second

    const seconds = Math.max(time % 60, 0);  // Get the just the seconds
    const fullSeconds = Math.floor(seconds);    // Get the whole seconds total (so we can calulate tenths)
    const tenths = Math.floor(  // Unneccessary to round
        (
            Math.floor(seconds * 10) / 10   // Round down to the nearest tenth
            - fullSeconds   // Subtract the full seconds so we just have tenths
        ) * 10  // Multiply by 10 to get the tenths as an integer
    );
    const prependZero = seconds < 10;   // If the seconds are less than 10, prepend a zero
    const secondsString = `${
        prependZero ? '0' : ''  // If necessary, prepend a zero
    }${
        showTenths ?    // If we're showing tenths, add them to the string
            `${fullSeconds}.${tenths}` :
            fullSeconds
    }`;

    const minutes = Math.max((time - seconds) / 60, 0); // Get the minutes
    const minutesString = minutes != 0 ? `${minutes}:` : '';    // If there are minutes, add them to the string
    
    return `${minutesString}${secondsString}`;   // Return the string
}

/** Parse a human-readable time to seconds
 * @example `parseTimeString('2:00')` returns `120`
 * @example `parseTimeString('45.7')` returns `45.7`
 */
export function parseTimeString(time: string) {
    const match = time.match(/(?:([0-9]{1,2}):)?([0-5][0-9])(?:\.([0-9]))?/);
    const minutes = match[1] ? parseInt(match[1]) : 0;
    const seconds = parseInt(match[2]);
    const tenths = match[3] ? parseInt(match[3]) : 0;
    return minutes * 60 + seconds + tenths / 10;
}


export type GameState = {
    gameType: string;
    gameData: unknown;
};

export enum StatusColor {
    INFO = '#1976d2',
    OK = '#388e3c',
    PROBLEM = '#d32f2f'
}

export type RecursivePartial<T> = {
    [P in keyof T]?:
      T[P] extends (infer U)[] ? RecursivePartial<U>[] :
      T[P] extends object ? RecursivePartial<T[P]> :
      T[P];
  };

export function titleCase(str: string) {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}