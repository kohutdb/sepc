import getParameterNames from "get-parameter-names";
import express from "express";
import { WebSocketServer } from 'ws';

export class JsonRpcError {
    constructor(code, message, data = undefined) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
}

class SepcMethod {
    constructor(fn, types = null) {
        this.fn = fn;
        this.types = types;
    }

    call(params) {
        return this.fn(params);
    }
}

export function method(fn, types = null) {
    return new SepcMethod(fn, types);
}

function createMethodHandler(fn) {
    if (fn instanceof SepcMethod) {
        return (params) => fn.call(params);
    }

    const names = getParameterNames(fn);

    return (params) => {
        if (names[0] && (names[0].startsWith('{') || names[0].startsWith('['))) {
            return fn(params);
        }

        if (!Array.isArray(params)) {
            params = names.map((name) => params[name]);
        }

        return fn(...params);
    };
}

function makeError(id, error) {
    return {
        jsonrpc: '2.0',
        error,
        id,
    };
}

function makeResult(id, result) {
    return {
        jsonrpc: '2.0',
        result,
        id,
    };
}

function sepc(methods = {}, startFn = null) {
    methods = { ...methods };

    Object.entries(methods).forEach(([name, fn]) => {
        methods[name] = createMethodHandler(fn);
    });

    async function call(request) {
        // { "jsonrpc": "2.0", "method": "...", "params": [], "id": 1 }
        if (!request || typeof request !== 'object') {
            return makeError(null, {
                code: -32600,
                message: 'Invalid Request',
            });
        }

        let { jsonrpc, method, params = [], id = null } = request;

        // 2.0
        if (jsonrpc !== '2.0') {
            return makeError(id, {
                code: -32600,
                message: 'Invalid Request',
            });
        }

        // "getUsers"
        if (typeof method !== 'string') {
            return makeError(id, {
                code: -32600,
                message: 'Invalid Request',
            });
        }

        // {}, []
        if (!params || typeof request !== 'object') {
            return makeError(id, {
                code: -32600,
                message: 'Invalid Request',
            });
        }

        // 1, 3.14, "ha.sh"
        if (id && typeof id !== "string" && typeof id !== "number") {
            return makeError(id, {
                code: -32600,
                message: 'Invalid Request',
            });
        }

        if (!(method in methods)) {
            return makeError(id, {
                code: -32601,
                message: 'Method not found'
            });
        }

        try {
            const result = await methods[method](params);

            const madeResult = makeResult(id, result);

            if (!id) {
                return '';
            }

            return madeResult;
        } catch (e) {
            if (!id) {
                return '';
            }

            if (e instanceof JsonRpcError) {
                return makeError(id, {
                    code: e.code,
                    message: e.message,
                    data: e.data,
                });
            } else {
                return makeError(id, {
                    code: -32603,
                    message: 'Internal error',
                });
            }
        }
    }

    async function handle(message, send) {
        let request;

        try {
            request = JSON.parse(message);
        } catch (e) {
            return send(makeError(null, {
                code: -32700,
                message: 'Parse error'
            }));
        }

        let output;

        if (Array.isArray(request)) {
            if (!request.length) {
                return send(makeError(null, {
                    code: -32600,
                    message: 'Invalid Request',
                }));
            }

            output = (await Promise.all(request.map((input) => call(input))))
                .filter((v) => !!v);

            if (!output.length) {
                return send('');
            }
        } else {
            output = await call(request);
        }

        if (output) {
            return send(output);
        } else {
            return send('');
        }
    }

    function listen(port = 3000, path = '/', callback = undefined) {
        const app = express();

        app.use(express.text({ type: '*/*' }));

        app.post(path, (request, response) => {
            handle(request.body, (data) => {
                if (data) {
                    response.send(data);
                } else {
                    response.send('');
                }
            });
        });

        let wss;

        if (startFn?.asWs) {
            wss = new WebSocketServer({ noServer: true });

            wss.on('connection', (client) => {
                client.on('message', (message) => {
                    handle(message, (data) => {
                        if (data) {
                            client.send(JSON.stringify(data));
                        }
                    });
                });
            });

            startFn = startFn.startFn;
        }

        if (typeof startFn === "function") {
            return startFn({
                methods,
                call,
                app,
                port,
                path,
                callback,
                handle,
                wss,
            });
        }

        const server = app.listen(port, callback);

        if (wss) {
            server.on('upgrade', (request, socket, head) => {
                wss.handleUpgrade(request, socket, head, socket => {
                    wss.emit('connection', socket, request);
                });
            });
        }

        return server;
    }

    return { listen, call, methods };
}

sepc.ws = (methods, startFn = null) => sepc(methods, { asWs: true, startFn });

export default sepc;
