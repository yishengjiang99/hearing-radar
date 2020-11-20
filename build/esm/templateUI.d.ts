export declare function templateUI(): {
    stdout: (str: string) => void;
    rx1Div: HTMLDivElement;
    postRx1: (str: string) => void;
    postRx2: (str: string) => void;
    cp: HTMLDivElement;
    appendNOde: (node: HTMLElement, name: string) => void;
};
export declare const createActionBtn: (offStateText: string, onStateText: string, fn: (state: any) => void, offFn?: (state: any) => void) => HTMLDivElement;
