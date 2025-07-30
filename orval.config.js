/** @type {import('orval').Config} */
module.exports = {
  'checklist-api': {
    input: './api_v1.yaml',
    output: {
      target: './src/lib/api.ts',
      client: 'swr',
      mock: false,
      prettier: true,
      override: {
        mutator: {
          path: './src/lib/axios.ts',
          name: 'customInstance',
        },
      },
      prependServices: true,
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
};
