import { Context } from '../context/context'
import fs from 'fs'
import path from 'path'
import { parseFile } from '../context/file_ast'


// const context = await Context.from_stream(fs.createReadStream('test/rustbik.tar.gz'));

parseFile('enigma.py', fs.readFileSync('test/enigma.py').toString('utf-8'));
