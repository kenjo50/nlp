# Blue Team Middleware

Add whatever you want but you must always have a valid `middleware.ts` or `middleware.js` file. TypeScript is recommended and will be auto-converted to JavaScript on push.

## Important

Export one of:

- `module.exports.handle = async (request, sdk) => ...`
- `module.exports = async (request, sdk) => ...`
- `export async function handle(request, sdk) { ... }`
- `export default async function handle(request, sdk) { ... }`

`request` is OpenAI-style JSON (`model`, `messages`, ...).
The platform enforces a fixed upstream model name; middleware may read `request.model`, but changing it has no effect on the final upstream call.

`sdk` is the small helper object passed as the second handler argument. It lets middleware create platform decisions without knowing the internal response format:

- `sdk.block(reason)`: builds a block decision payload. Use this when the request should not reach the upstream model. The optional `reason` is returned in the blocked response.
- `await sdk.callModel(payload)`: sends an OpenAI-style chat-completions payload to the hidden upstream model API and returns its OpenAI-style response. Use this when middleware needs to inspect the model's answer before deciding whether to return it, replace it, or block.

`sdk.callModel(...)` uses the same platform controls as a normal forwarded request: the upstream model is fixed by the platform, streaming is disabled, and request timeout limits still apply.

The middleware can also return `{ action: 'allow', request }` directly when no SDK helper is needed. There is no SDK helper for allow; the allow action is just a return value.

Runtime package availability:

- `wink-nlp` is available via `require('wink-nlp')`.
- `wink-eng-lite-web-model` is available via `require('wink-eng-lite-web-model')`.

Allowed return values:

- `{ action: 'allow', request?: object }` to forward upstream.
- `{ action: 'block', reason?: string }` to block.
- `{ action: 'respond', response: object }` to return a custom OpenAI-style response directly.
- A direct OpenAI-style response object.

## Promotion Flow

1. Push to `main`.
2. Validate your `test` endpoint.
3. Promote `test` to `live` in the blue team workspace.
