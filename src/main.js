import jepc from 'jepc';
import httpServer from "./httpServer.js";
import wsServer from "./wsServer.js";

function sepc(methods = {}, options = {}) {
    const { handle } = jepc(methods);

    options.server = options.server || httpServer;
    options.api = options.api || {};

    function listen(port = 3000, path = '/', callback = undefined) {
        return options
            .server(handle, options)
            .listen(port, path, callback);
    }

    return { listen, handle, methods, ...options.api };
}

sepc.ws = (methods = {}, options = {}) => sepc(methods, { server: wsServer, ...options });

export default sepc;
