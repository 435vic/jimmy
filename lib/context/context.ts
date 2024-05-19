import zlib from 'zlib'
import tar from 'tar-stream'
import { nanoid } from 'nanoid'

async function concatEntry(entry: NodeJS.ReadableStream) {
    let chunks: any = [];
    for await (const chunk of entry) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

export class Context {
    id: string;
    files: Map<string, Buffer>;
    
    constructor(id: string, files: Map<string, Buffer>) {
        this.id = id;
        this.files = files;
    }

    static async from_stream<T extends NodeJS.ReadableStream>(stream: T) {
        const extract = tar.extract();
        const gzip = zlib.createGunzip();

        stream.pipe(gzip);
        gzip.pipe(extract);

        let files: Map<string, Buffer> = new Map();
        for await (const entry of extract) {
            files.set(
                entry.header.name,
                await concatEntry(entry)
            )
        }

        return new Context(nanoid(), files);
    }

    getTextFile(filename: string) {
        const file = this.files.get(filename);
        if (file === undefined) {
            throw Error(`file ${filename} does not exist`);
        }

        for (let i = 0; i < Math.min(file.length, 512); i++) {
            const byte = file[i];
            if (byte <= 8 || (byte >= 14 && byte < 32) || byte > 126) {
                throw Error(`non printable char at ${i}`);
            }
        }
        return file.toString('utf-8');
    }
}