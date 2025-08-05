/** @type {import('orval').Config} */
module.exports = {
  api: {
    input: 'https://raw.githubusercontent.com/raunlo/ChecklistApplication/refs/heads/main/openapi/api_v1.yaml', // or local path
    output: {
      mode: 'tags-split',
      target: './src/api/',   // your generated code will appear here
      client: 'swr',          // generates SWR-ready hooks!
    },
  },
};
