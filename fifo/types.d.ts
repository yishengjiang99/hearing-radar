declare module GrepFifo {
  interface FifoFunctions {
    ptr: number;
    write: (array: Uint8Array) => void;
    readFloat32: (length: number) => Float32Array;
    read: (length: number) => Uint8Array;
    available: () => number;
    free: (ptr: number) => void;
  }
  export function Fifo(ptr: number): FifoFunctions;
  export function FifoPtr(size: number): FifoFunctions;
}
