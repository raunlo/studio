/** @type {import('orval').Config} */
module.exports = {
  api: {
    input: 'https://raw.githubusercontent.com/raunlo/ChecklistApplication/f192852d1f00fdc419dd757480363067e9a95a27/openapi/api_v1.yaml', // or local path
    output: {
      mode: 'tags-split',
      target: './src/api/',   // your generated code will appear here
      client: 'swr',          // generates SWR-ready hooks!
    },
  },
};
