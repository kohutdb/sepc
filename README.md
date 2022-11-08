# sepc

Dead simple JSON-RPC over HTTP/WebSockets server for Node.js. Built with [repc](https://github.com/kohutd/repc)
and [express](https://expressjs.com). If you
need a client, try [jepc](https://github.com/kohutd/repc).

## Installation

```shell
npm i sepc
```

## Usage

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
