import path from 'path'
import Parser, { Query } from 'tree-sitter';
import type { Point, SyntaxNode } from 'tree-sitter';
import Python from 'tree-sitter-python';


interface Summarizer {
    language: any,
    summarize(node: SyntaxNode, depth?: number): string
}

function summarizePython(node: SyntaxNode, depth = 0) {
    let summary = '';

    switch (node.type) {
        case 'function_definition':
            const funcName = node.childForFieldName('name')?.text;
            summary += `${' '.repeat(depth * 2)}Function: ${funcName}\n`
            break;
        case 'class_definition':
            const className = node.childForFieldName('name')?.text;
            summary += `${' '.repeat(depth * 2)}Class: ${className}\n`
            break;
    }

    for (let i = 0; i < node.namedChildCount; i++) {
        summary += summarizePython(node.namedChild(i)!, depth+1);
    }

    return summary;
}

const PARSER_FOR_EXTENSION: Record<string, Summarizer> = {
    '.py': {
        language: Python,
        summarize: summarizePython
    }
}

const parser = new Parser();

export function parseFile(filename: string, file: string) {
    const summarizer = PARSER_FOR_EXTENSION[path.extname(filename)];
    if (!summarizer) return null;
    parser.setLanguage(summarizer.language);
    const root = parser.parse(file).rootNode;
    console.log(summarizer.summarize(root));
}
