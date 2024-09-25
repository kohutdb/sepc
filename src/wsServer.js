import express from "express";
import { WebSocketServer } from "ws";

const wsServer = (handle) => ({
    listen(port, path, callback) {
        const app = express();

        const webSocketServer = new WebSocketServer({ noServer: true });

        webSocketServer.on('connection', (client) => {
            client.on('message', (message) => {
                handle(message.toString())
                    .then((out) => {
                        if (out) {
                            client.send(JSON.stringify(out));
                        }
                    });
            });
        });

        const httpServer = app.listen(port, callback);

        httpServer.on('upgrade', (request, socket, head) => {
            webSocketServer.handleUpgrade(request, socket, head, socket => {
                webSocketServer.emit('connection', socket, request);
            });
        });

        return { app, webSocketServer, httpServer };
    },
});

export default wsServer;
