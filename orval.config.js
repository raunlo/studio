/** @type {import('orval').Config} */
module.exports = {
  api: {
    input: './openapi/api_v1.yaml', // or local path
    output: {
      mode: 'tags-split',
      target: './src/api/', // your generated code will appear here
      client: 'swr', // generates SWR-ready hooks!
      override: {
        mutator: {
          path: './src/lib/axios.ts',
          name: 'customInstance',
        },
      },
    },
  },
};
