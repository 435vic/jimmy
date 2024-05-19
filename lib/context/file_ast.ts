import path from 'path'
import Parser, { Query } from 'tree-sitter';
import type { Point } from 'tree-sitter';
import Python from 'tree-sitter-python';

const PARSER_FOR_EXTENSION = {
    '.py': Python
}

const parser = new Parser();

function fileRange(lines: string[], start: Point, end: Point) {
    if (start.row != end.row) return "";

    return lines[start.row].substring(start.column, end.column);
}

export function parseFile(filename: string, file: string) {
    const lang = PARSER_FOR_EXTENSION[path.extname(filename)];
    if (!lang) return null;
    parser.setLanguage(lang);
    const results = parser.parse(file).rootNode;
    parser.reset();
    const functionQuery = new Query(Python, `
        (module (expression_statement (assignment left: (identifier) @name) @definition.constant))

        (class_definition
        name: (identifier) @name) @definition.class
        
        (function_definition
        name: (identifier) @name) @definition.function
    `);
    const matches = functionQuery.matches(results);
    const lines = file.split('\n');
    let idx = 0;
    for (const match of matches) {
        let tagType: string | undefined;
        let text: string | undefined;
        for (const capture of match.captures) {
            if (capture.name.startsWith('definition')) {
                tagType = capture.name.split('.')[1];
            }
            // console.log(capture.node.children);
            if (capture.name == 'name') {
                text = fileRange(lines, capture.node.startPosition, capture.node.endPosition);
            }
        }
        const num = `${idx}:`.padEnd(3);
        const info = `${num} ${tagType ?? 'unknown'}`;
        console.log(`${info.padEnd(14)}|  ${text}`);
        idx++;
    }
}
