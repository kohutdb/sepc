# sepc

Dead simple JSON-RPC over HTTP/WebSockets server for Node.js. Built with [jepc](https://github.com/kohutd/jepc)
and [express](https://expressjs.com). If you
need a client, try [repc](https://github.com/kohutd/repc).

## Installation

```shell
npm i sepc
```

## Usage

```javascript
sepc(methods, options)
```

HTTP:

```javascript
import sepc from 'sepc';

const add = (a, b) => a + b;
const sub = (a, b) => a - b;

sepc({ add, sub }).listen(3000);
```

```shell
curl -X POST 'http://localhost:3000' \
  -d '{ "jsonrpc": "2.0", "method": "add", "params": [2, 2], "id": 1 }'

# { "jsonrpc": "2.0", "result": 4, "id": 1 }
```

WebSockets:

```javascript
import sepc from 'sepc';

const add = (a, b) => a + b;
const sub = (a, b) => a - b;

sepc.ws({ add, sub }).listen(3000);
```

Errors:

```javascript
import sepc from 'sepc';
import { JsonRpcError } from 'jepc';

function divide(a, b) {
    if (b === 0) {
        throw new JsonRpcError(-32602, 'Cannot divide by zero');
    }

    return a / b;
}

sepc({ divide }).listen(3000);
```

## Options

### `server`

Server builder function. Must implement method `listen` with identical parameters from api's one.

- type: `function`
- example: [httpServer](/src/httpServer.js), [wsServer](/src/wsServer.js)

### `api`

Additional parameters for API.

- type: `object`

## API

### `listen`

Start a server.

- type: `function(port, path, callback)`

### `methods`

Available methods.

- type: `Record<string, Method>`
