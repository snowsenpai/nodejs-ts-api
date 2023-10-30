# Node Express TypeScript REST API
The primary objective of this project is to create a robust backend API capable of meeting the majority, if not all, of the requirements for a frontend client. It leverages [Node.js](https://nodejs.org/en/docs) through the [Express](https://expressjs.com/en/starter/installing.html) Framework and is written in [TypeScript](https://www.typescriptlang.org/). 

## Prerequisites

## Table of Contents
- [Node Express TypeScript](#node-express-typescript-rest-api)
  - [Prerequisite](#prerequisites)
  - [Running locally](#running-locally)
  - [Environment Variables](#environment-variables)
  - [Project Structure](#project-structure)
  - [Features](#features)
  - [Scripts](#scripts)
  - [Authentication](#scripts)
  - [Documentation](#documentation)
    - [Code Documentation](#code-documentation)
    - [API Documentation](#api-documentation)
  - [Inspirations](#inspirations)

## Running Locally

## Environment Variables

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
    |--index.ts     # Available API routers for each resource.
|--tests/       # Test objects and functions.
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
- **Cross-origin resource sharing**: enabled via [cors](https://www.npmjs.com/package/cors)

## Scripts

## Authentication

## Documentation

### Code Documentation

### API Documentation

Sample api [documentation](https://documenter.getpostman.com/view/20696731/2s9Y5ZuMEM), full api documentation will be available soon, please be patient :wink:

## Inspirations
