# MtgData

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

For production builds with environment variable injection:

```bash
npm run build:prod
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

### Production Deployment

See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for detailed instructions on deploying to Render.com with proper secret management.

#### Environment Variables

The following environment variables can be configured for production:

- `API_URL` - Backend API endpoint (required)
- `ENABLE_ANALYTICS` - Enable/disable analytics (`true`/`false`)
- `TOKEN_KEY` - Local storage key for auth token
- `USER_KEY` - Local storage key for user data

See [.env.example](.env.example) for a template.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
