import express from "express";
import { WebSocketServer } from 'ws';
import jepc, { JsonRpcError as JepcRpcError } from 'jepc';

export class JsonRpcError extends JepcRpcError {
}

function sepc(methods = {}, startFn = null) {
    const { handle, methods } = jepc(methods);

    function listen(port = 3000, path = '/', callback = undefined) {
        const app = express();

        app.use(express.text({ type: '*/*' }));

        app.post(path, (request, response) => {
            handle(request.body)
                .then((out) => {
                    if (out) {
                        response.send(out)
                    } else {
                        response.end();
                    }
                });
        });

        let wss;

        if (startFn?.asWs) {
            wss = new WebSocketServer({ noServer: true });

            wss.on('connection', (client) => {
                client.on('message', (message) => {
                    handle(message)
                        .then((out) => {
                            if (out) {
                                client.send(JSON.stringify(out));
                            }
                        });
                });
            });

            startFn = startFn.startFn;
        }

        if (typeof startFn === "function") {
            return startFn({
                methods,
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

    return { listen, handle, methods };
}

sepc.ws = (methods, startFn = null) => sepc(methods, { asWs: true, startFn });

export default sepc;
