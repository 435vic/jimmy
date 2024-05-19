
import z from 'zod';

interface Tool extends Record<string, any> {
    type: string,
}

interface Function extends Tool {
    name: string,
    description: string,
    parameters: z.AnyZodObject
}

const handle = {
    function: (name: string, description: string, parameters: z.AnyZodObject): Function => ({
        type: 'function',
        name,
        description,
        parameters
    })
}

export default handle;
