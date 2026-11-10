module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      function ({ types: t }) {
        return {
          name: 'inline-expo-router-root',
          visitor: {
            MemberExpression(path) {
              if (
                path.node.object &&
                path.node.object.object &&
                path.node.object.object.name === 'process' &&
                path.node.object.property.name === 'env'
              ) {
                if (path.node.property.name === 'EXPO_ROUTER_APP_ROOT') {
                  path.replaceWith(t.stringLiteral('../../app'));
                } else if (path.node.property.name === 'EXPO_ROUTER_IMPORT_MODE') {
                  path.replaceWith(t.stringLiteral('sync'));
                }
              }
            },
          },
        };
      },
    ],
  };
};
