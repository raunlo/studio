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
        // This transformer will automatically rename properties in the generated schemas
        // to better match the conventions of the frontend code.
        transformer: {
          output: (schema) => {
            // Helper to recursively find and replace keys
            const renameKeys = (obj, keyMap) => {
              if (typeof obj !== 'object' || obj === null) {
                return;
              }

              if (Array.isArray(obj)) {
                obj.forEach(item => renameKeys(item, keyMap));
                return;
              }
              
              Object.keys(obj).forEach(key => {
                // Rename the key if it's in the map
                if (keyMap[key]) {
                  const newKey = keyMap[key];
                  obj[newKey] = obj[key];
                  delete obj[key];
                  key = newKey; // Continue processing with the new key
                }

                // Recurse for nested objects
                renameKeys(obj[key], keyMap);
              });
            };

            // This map defines the renames: 'id' -> 'checklistId', 'name' -> 'title'
            const keyMap = { 'name': 'title', 'id': 'checklistId' };
            renameKeys(schema, keyMap);
            
            return schema;
          },
        },
      },
      prependServices: true,
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
};
