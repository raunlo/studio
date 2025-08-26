# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment variables

The application expects `PRIVATE_API_BASE_URL` to be available at runtime. Builds
can proceed without it, but the proxy API routes will return an error until the
variable is set. When deploying with Firebase Hosting, you can provide it in
`firebase.json` under `hosting.build.env` and in `apphosting.yaml` under
`runConfig.env`. For App Hosting, define the variable with the `variable` key:

```yaml
runConfig:
  env:
    - variable: PRIVATE_API_BASE_URL
      value: https://checklist-app-go
      availability:
        - RUNTIME
```

After updating these files, deploy with `firebase deploy` to apply the settings.

## API proxying

All requests beginning with `/api/` are internally rewritten to
`/api/proxy/` via the Next.js configuration. This allows the frontend to use
relative `/api` paths while the proxy route handles authentication and forwards
requests to the `checklist-app-go` service.
