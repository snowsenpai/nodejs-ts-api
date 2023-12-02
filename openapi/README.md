# Node-ts-api OpenApi Specification

The OpenApi specification for [snowsenpai/node-ts-api](https://github.com/snowsenpai/node-ts-api/tree/main)

## Structure

Main folders of interest:

- `main`: This contains a comprehensive specification of the node-ts-api:
    - `resources`: This contains individual endpoints in each API category
    - `responses`: This contains the models for responses
    - `schemas`: This contains models for each endpoints
    - `openapi.yaml`: This is the entry point for all components.
- `dist`: This contains a single specification file, bundled from all components in `main` directory, which can be used by OpenApi readers.

## Utilization

The bundled specification file within `dist` is used with [Postman](https://postman.com/product/what-is-postman/) for api documentation and generating postman collections. 

## Development

[Redocly CLI](https://www.npmjs.com/package/@redocly/cli) and [redocly vscode extension](https://marketplace.visualstudio.com/items?itemName=Redocly.openapi-vs-code) are used to manage files within this directory.