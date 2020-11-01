import {openSync, readSync,closeSync} from 'fs';
import {Buffer}from 'buffer';
import {spawn,ChildProcess}  from 'child_process'    ;
import {cacheStore}from'./flat-cache-store';
import {Readable}from'stream';
import { spawnInputBuffer, spawnToBuffer } from './ffmpeg-link';
export const bytesPerNote = 887832 / 88;
export const bytesPCMPerNote = 38452;

const cache = cacheStore(200, bytesPerNote);
const pcmCache= cacheStore(200,bytesPCMPerNote );

export const midi_sample_mp3 = (instrument: string, midi: number): Buffer=>{
    const cacheKey:string = instrument + midi;
    let cachedValue = cache.read(cacheKey);
    console.log('cachedvalue', cachedValue);
    if(cachedValue) return cachedValue;
    console.log(cache.cacheKeys);
    const fd=openSync(`./mp3/Fatboy_${instrument.replace(" ",'_')}/${midi+21}.mp3`,'r');
    const segment = cache.malloc(cacheKey);
    readSync(fd,segment);
    closeSync(fd);
    console.log(fd,'close');
    return segment;
}

export  const midi_s16le_ac1_ar_9000 = async (instrument: string, midi: number): Promise<Buffer>=>{
    const cacheKey:string = instrument + midi;
    let cachedValue = pcmCache.read(cacheKey);
    if(cachedValue) return cachedValue;

    const infile = `./mp3/Fatboy_${instrument.replace(" ",'_')}/${midi-21}.mp3`;
    const ffm = spawn("ffmpeg", `-i ${infile} -f s16le -ac 1 -ar 9000 -`.split(' '));
    const buff = await spawnToBuffer(ffm);
    pcmCache.set(cacheKey, buff);
    return buff;
}

export type Note = [number, string];
export interface Attributes{
    '-t': number
}
export  const combined_midi_s16le_ac1_ar_9000_proc =  (notes: Note[], attributes:Attributes): ChildProcess=>{

    const cacheKey:string = notes.map(([midi,instrument])=>midi+instrument).join("-");
    // let cachedValue = pcmCache.read(cacheKey);
    // if(cachedValue) return cachedValue;

    const cmdargs = `${notes.reduce((args,[midi,instrument])=>{
        return args + ` -i ./mp3/Fatboy_${instrument}/${midi-21}.mp3`;
    }, "")} -filter_complex amix=inputs=${notes.length} -ac 1 -ar 9000 -f s16le -`.split(' ');

    return spawn('ffmpeg', cmdargs);
}

export const ffplayPCM = ( format:string=' -f s16le -ac 1 -ar 9000 ')=>{
    return spawn("ffplay", `-i pipe:0 ${format}`.split(' '));
}
combined_midi_s16le_ac1_ar_9000_proc([
    [67,'clarinet'],
    [67,'string_ensemble_1'],
    [67,'string_ensemble_1'],
    [55,'string_ensemble_1'],
    [43,'string_ensemble_1'],
    [43,'string_ensemble_1']
],{'-t':0.22});

