# Node Express TypeScript REST API

This project started as a quest to learn how to use [TypeScript](https://www.typescriptlang.org/) to build a restful API using [Node.js](https://nodejs.org/en/docs) and the [Express](https://expressjs.com/en/starter/installing.html) Framework. While i am happy with the progress i've made, i do not think it is ready for a production environment but feel free to clone and modify it to your need.

## Prerequisites

To run the project you will need the following installed on your device:
- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://www.mongodb.com/try/download/community)
- [TypeScript](https://www.npmjs.com/package/typescript)

To send emails you'll need a verified [SendGrid](https://sendgrid.com) account, create a verified sender and a sendgrid API key. Currently there is no option to opt out of sending emails using sendgrid, if you wish to send emails you can try [nodemailer](https://www.npmjs.com/package/nodemailer), it will be added in the future (oh look a possible contribution :wink:).

[//]: # (add contribution.md and link)

## Table of Contents

- [Node Express TypeScript](#node-express-typescript-rest-api)
  - [Prerequisite](#prerequisites)
  - [Running locally](#running-locally)
  - [Environment Variables](#environment-variables)
  - [Project Structure](#project-structure)
  - [Features](#features)
  - [Scripts](#scripts)
  - [Authentication](#scripts)
  - [Validation](#validation)
  - [Documentation](#documentation)
    - [Code Documentation](#code-documentation)
    - [API Documentation](#api-documentation)
  - [Testing](#testing)
    - [Setup](#setup)
    - [Running Tests](#running-tests)
        - [Single test file](#run-a-single-test-file)
        - [All test files](#run-all-tests)
  - [Debugging](#debugging)
    - [Steps to debug](#steps-to-debug)
  - [Security](#security)
  - [Error Handling](#error-handling)
  - [Logging](#logging)
  - [Linting](#linting-and-code-formatting)
  - [Inspirations](#inspirations)

## Running Locally

##### 1. Clone the repo and install dependencies

```bash
git clone <repo-url> project-name
cd project-name
npm i
```

##### 2. Add environment variables

Save `.env.example` as `.env` and fill in the following environment [variables](#environment-variables).

##### 3. Startup MongoDB

In your terminal running `mongod` should start the mongodb server.

##### 4. Start the server

- To run in **production** mode, where all TypeScript source codes are compiled and the JavaScript output is run directly in `node`:

```bash
npm run build:compile
npm start
```

- To run in **development** mode, where all TypeScript source are recompiled whenever they are modified:

```bash
npm run dev
```

##### 5. Send HTTP request

View the api [documentation](#api-documentation) for all available routes, endpoints, and information regarding sending HTTP requests to the server, along with the server's responses.

## Environment Variables

```
NODE_ENV=                   # node.js environment
PORT=                       # port to listen for connections
MONGO_PATH=                 # mongodb connection uri
MONGO_USER=                 # mongodb admin name
MONGO_PASSWORD=             # mongodb admin password
MONGO_DATABASE=             # mongodb database name
JWT_SECRET=                 # secret used for signing jsonwebtokens
APP_NAME=                   # app name to use in emails
APP_EMAIL=                  # verified sendgrid email sender
SECRET_CHARACTERS=          # characters used to generate users secrets
SENDGRID_API_KEY=           # your sendgrid api key
SECRET_KEY=                 # secret key for crypto apis
SECRET_IV=                  # secret iv for crypto apis
USER_SECRET_TOKEN_LENGTH=   # length of secret for users
```

Depending on the security settings of your mongodb connection just `MONGO_PATH` and `MONGO_DATABASE` are needed, if admin credentials are required you can modify the string used in the [mongoose](/src/utils/database/mongoose.ts) connection. 

## Project Structure

```
src/
|--middlewares/         # Custom Express middlewares.
|--resources/
    |--resource/        # A singular entity representing a specific type of data or operation.
        |--resource.controller.spec.ts  # unit test for the controller.
        |--resource.controller.ts       # Controller.
        |--resource.interface.ts        # Interface representing the resource, for type inference.
        |--resource.model.ts            # Database representation of the resource.
        |--resource.routes.test.ts      # Integration tests for the routes.
        |--resource.routes.ts           # Routes.
        |--resource.service.spec.ts     # Unit tests for the service class.
        |--resource.service.ts          # Service class.
        |--resource.validation.ts       # Validation schemas.
    |--index.ts     # Array of available routers for each resource.
|--tests/       # Objects and functions that streamline testing.
|--utils/       # Utility classes and functions.
|--app.ts       # Express app setup.
|--index.ts     # Application's entry point.
```

## Features

- **MongoDB**: via [mongoose](https://mongoosejs.com/)
- **Validation**: via [Joi](https://joi.dev/api/)
- **Authentication**: via [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- **Sending emails**: via [Twilio SendGrid](https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs)
- **One time password**: via [otpauth](https://www.npmjs.com/package/otpauth)
- **Logging**: via [pino](https://www.npmjs.com/package/pino) and [morgan](https://www.npmjs.com/package/morgan)
- **Testing**: using [jest](https://jestjs.io/) and [supertest](https://www.npmjs.com/package/supertest)
- **Code documentation**: via [TSdoc](https://tsdoc.org/) and [TypeDoc](https://typedoc.org/)
- **API documentation**: via [postman](https://learning.postman.com/docs/publishing-your-api/api-documentation-overview/)
- **Dependency management**: using [npm](https://www.npmjs.com/)
- **Environment variables**: via [dotenv](https://www.npmjs.com/package/dotenv)
- **Cross-origin resource sharing**: enabled via [cors](https://www.npmjs.com/package/cors).

## Scripts

## Authentication

Certain routes require a valid JWT access token in the Authorization request header, using the Bearer schema. If the request does not contain a valid access token an Unauthorized (401) error is thrown.

An access token can be generated for a registered user by making a request to `(POST api/v1/auth/login)` endpoint.

## Validation

## Documentation

### Code Documentation

### API Documentation

Sample api [documentation](https://documenter.getpostman.com/view/20696731/2s9Y5ZuMEM), full api documentation will be available soon, please be patient :wink:

## Testing

### Setup

Create a new .test.env file and copy the contents form .env but **use specific test variables**, for example a dedicated **`test`** database can be used, node environment can be set to `test`, test API keys can be used etc.
Test files end with **.spec.ts** for unit tests and **.test.ts** for integration tests, see [project structure](#project-structure).

### Running tests

[Jest](https://jestjs.io/) in used for assertions and mocks while [supertest](https://www.npmjs.com/package/supertest) is used to test the servers endpoints and routes.

##### Run a single test file

```bash
npm test filename.test.ts
# or
npm test filename.spec.ts
```

##### Run all tests

```bash
npm test
```

## Debugging

The debugging environment is setup using [ts-node](https://www.npmjs.com/package/ts-node), [tsconfig-paths](https://www.npmjs.com/package/tsconfig-paths) and TypeScript [sourceMaps](https://www.typescriptlang.org/tsconfig#sourceMap), see [launch.json](/.vscode/launch.json).

The debugger starts up the server which will listen to incoming HTTP requests and sends a response when the request is completed. Breakpoints can be set within modules and functions that handle specific requests.

#### Steps to debug

- Compile all TypeScript source code (if you haven't)
- Startup mongodb server
- Setup breakpoints
- Start the debugger
- Send HTTP request.

## Security

One reason i don't consider this project ready for production is mainly because of security, in future versions i will be implementing necessary recommendations from [OWASP](https://owasp.org/Top10/A00-about-owasp/) and [express](https://expressjs.com/en/advanced/best-practice-security.html).

## Error Handling

## Logging

## Linting and Code Formatting

## Inspirations
