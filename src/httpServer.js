import express from "express";

const httpServer = (handle) => ({
    listen(port, path, callback) {
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

        const httpServer = app.listen(port, callback);

        return { app, httpServer };
    },
});

export default httpServer;
