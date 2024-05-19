import { Context } from '../context'
import fs from 'fs'
import path from 'path'
import { parseFile } from '../file_ast'

// for (const tool of tools) {
//     console.log(tool.json());
// }

(async () => {
    const context = await Context.from_stream(fs.createReadStream('test/rustbik.tar.gz'));
    await context.ask(`
My program uses wasm-bindgen and a 3d library called three-d to render a rubik\'s cube to a web canvas.
Can you change the code inside the main render loop so that the cube moves slower?
    `, event => {
        if (event.type === 'partial') {
            process.stdout.write(event.content);
        }
    });
})();

// parseFile('enigma.py', fs.readFileSync('test/sudoku.py').toString('utf-8'));
