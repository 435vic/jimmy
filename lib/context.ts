import zlib from 'zlib'
import tar from 'tar-stream'
import { nanoid } from 'nanoid'
import tool from './tool'
import { z } from 'zod'
import OpenAI from 'openai';
import { ChatCompletionTool } from 'openai/resources/index.mjs'
import { Stream } from 'openai/streaming.mjs'
import type { FunctionTool } from './tool'

async function concatEntry(entry: NodeJS.ReadableStream) {
    let chunks: any = [];
    for await (const chunk of entry) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

type JimmyCompletionEvent =
    { type: "partial", content: string } |
    { type: "func", name: string, args: string } |
    { type: "stop", reason: string }

export class Context {
    id: string;
    files: Map<string, Buffer>;
    openai: OpenAI;
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
    tools: FunctionTool[]
    
    constructor(id: string, files: Map<string, Buffer>) {
        this.id = id;
        this.files = files;
        this.openai = new OpenAI();
        this.messages = [];
        this.tools = [
            tool.function(
                'get_file',
                'Get a file\'s contents. If it exceeds 10,000 characters a map will be provided instead, with the file\'s class and function definitions. Returns an empty string if file is empty, not found or not valid UTF-8.',
                z.object({
                    path: z.string().describe("The path to the file. Must start with './'")
                }),
                async (params) => {
                    if (!this.files.has(params.path)) return '';
                    try {
                        return this.getTextFile(params.path)
                    } catch {
                        return '';
                    }
                }
            )
        ]
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

    systemPrompt() {
        return `
You are Jimmy, an expert programmer that assists people with their coding projects.
Given a list of files, you can open them and read their contents. The user will provide information
about their project, optionally showing an error message and/or terminal output. You must obtain the
information required to fully answer the user's questions, even if the user does not directly ask
you to process a file. You may obtain multiple files at once.
You may ask questions to the user if more information is needed.
The file list will be provided in a Markdown code block preceded by $FILES.
The terminal output, if present, will be provided in a Markdown code block preceded by $TERMINAL.


$FILES
\`\`\`
${[...this.files.keys()].join('\n')}
\`\`\`
        `
    }

    async processCompletionStream(
        stream: Stream<OpenAI.ChatCompletionChunk>,
        callback: (event: JimmyCompletionEvent) => void
    ): Promise<[OpenAI.ChatCompletionMessage, boolean]> {
    
        let partialMessage: OpenAI.ChatCompletionMessage = {
            role: 'assistant',
            content: null,
        };

        let calledFunction = false;
        const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];
        for await(const chunk of stream) {
            const completion = chunk.choices[0]!;
            if (completion.delta.content) {
                callback({
                    type: "partial",
                    content: completion.delta.content,
                })
                partialMessage.content = 
                    partialMessage.content === null ?
                    completion.delta.content :
                    partialMessage.content + completion.delta.content
            }
            if (chunk.choices[0]?.delta.tool_calls) {
                const call = chunk.choices[0]!.delta.tool_calls[0]!
                if (call.index >= toolCalls.length) {
                    toolCalls.push({
                        id: call.id!,
                        type: call.type!,
                        function: {
                            name: call.function!.name!,
                            arguments: ''
                        }
                    });
                } else {
                    toolCalls[call.index].function = {
                        ...toolCalls[call.index].function,
                        name: toolCalls[call.index].function.name,
                        arguments: toolCalls[call.index].function!.arguments! + call.function?.arguments
                    }
                }
            }
            if (completion.finish_reason) {
                callback({
                    type: "stop",
                    reason: completion.finish_reason
                });
                calledFunction = completion.finish_reason === 'tool_calls';
            }
        }
        if (toolCalls.length > 0) {
            partialMessage.tool_calls = toolCalls;
        }
        return [partialMessage, calledFunction];
    }

    async runFunctionCall(call: OpenAI.ChatCompletionMessageToolCall, callback: (event: JimmyCompletionEvent) => void) {
        console.log(`Function call ${call.function.name}`);
        if (call.function.name != 'get_file') return;
        const args = JSON.parse(call.function.arguments);
        console.log(args);
        callback({
            type: 'func',
            name: call.function.name,
            args: call.function.arguments
        });
        const tool = this.tools.find(t => t.name === call.function.name)!; 
        this.messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: await tool.callback(args)
        })
    }

    async ask(message: string, callback: (event: JimmyCompletionEvent) => void) {
        if (this.messages.length == 0) {
            this.messages.push({ role: 'system', content: this.systemPrompt() })
        }
        this.messages.push({ role: 'user', content: message })
        let stop = false;
        while (!stop) {
            const lastMessage = this.messages[this.messages.length - 1]
            if (lastMessage.role === 'assistant' && lastMessage.tool_calls) {
                await Promise.all(lastMessage.tool_calls.map(tc => this.runFunctionCall(tc, callback)));
                // console.log(this.messages);
                // break;
            }
            console.log('Asking ChatGPT...');
            const stream = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: this.messages,
                stream: true,
                tools: this.tools.map(t => t.json())
            });

            const [completion, calledFunction] = await this.processCompletionStream(stream, callback);
            stop = !calledFunction;

            this.messages.push(completion);
        }
    }
}