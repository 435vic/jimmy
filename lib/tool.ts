import z from 'zod';
import { zodToJsonSchema } from "zod-to-json-schema";

interface Tool extends Record<string, any> {
    type: string,
    json(): any,
}

export interface FunctionTool extends Tool {
    name: string,
    description: string,
    parameters: z.AnyZodObject,
    callback: (params: any) => Promise<string>
}

const handle = {
    function: (name: string, description: string, parameters: z.AnyZodObject, callback: (params: any) => Promise<string>): FunctionTool => ({
        type: 'function',
        name,
        description,
        parameters,
        callback,
        json: () => {
            const schema = zodToJsonSchema(parameters) as any;
            return {
                type: 'function',
                function: {
                    name,
                    description,
                    parameters: {
                        type: schema.type,
                        properties: schema.properties,
                        required: schema.required
                    }
                }
            };
        }
    })
}

export default handle;
