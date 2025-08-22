# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment variables

The application expects `PRIVATE_API_BASE_URL` to be available at runtime. Builds
can proceed without it, but the proxy API routes will return an error until the
variable is set. When deploying with Firebase Hosting, you can provide it in
`firebase.json` under `hosting.build.env` and in `apphosting.yaml` under
`runConfig.env`.
