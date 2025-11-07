const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find the oneOf rule (react-scripts uses oneOf for all rules)
      const oneOfRule = webpackConfig.module.rules.find(
        (rule) => rule.oneOf
      );

      if (oneOfRule && oneOfRule.oneOf) {
        // Add a rule for @novnc/novnc BEFORE babel-loader rules
        // This ensures @novnc/novnc is handled as ES module, not processed by babel
        const novncRule = {
          test: /\.(js|mjs)$/,
          include: [
            path.resolve(__dirname, 'node_modules/@novnc/novnc'),
          ],
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false,
          },
        };

        // Find the first babel-loader rule index
        const firstBabelIndex = oneOfRule.oneOf.findIndex((rule) => {
          if (rule.use && Array.isArray(rule.use)) {
            return rule.use.some(
              (loader) =>
                (loader.loader && loader.loader.includes('babel-loader')) ||
                (typeof loader === 'string' && loader.includes('babel-loader'))
            );
          }
          return false;
        });

        // Insert the novnc rule before babel-loader rules
        if (firstBabelIndex >= 0) {
          oneOfRule.oneOf.splice(firstBabelIndex, 0, novncRule);
        } else {
          // If no babel-loader found, add at the beginning
          oneOfRule.oneOf.unshift(novncRule);
        }

        // Also ensure all babel-loader rules exclude @novnc/novnc
        oneOfRule.oneOf.forEach((rule) => {
          if (rule.use && Array.isArray(rule.use)) {
            const hasBabelLoader = rule.use.some(
              (loader) =>
                (loader.loader && loader.loader.includes('babel-loader')) ||
                (typeof loader === 'string' && loader.includes('babel-loader'))
            );

            if (hasBabelLoader) {
              // Ensure @novnc/novnc is excluded from babel-loader
              const novncPath = path.resolve(__dirname, 'node_modules/@novnc/novnc');
              
              // Create a function to check if path should be excluded
              const shouldExcludeNovnc = (modulePath) => {
                return (
                  modulePath.includes('@novnc/novnc') ||
                  modulePath.includes('node_modules/@novnc/novnc') ||
                  modulePath === novncPath ||
                  modulePath.startsWith(novncPath + path.sep)
                );
              };

              // Handle exclude - it can be a function, regex, array, or string
              if (!rule.exclude) {
                rule.exclude = shouldExcludeNovnc;
              } else if (typeof rule.exclude === 'function') {
                const originalExclude = rule.exclude;
                rule.exclude = (modulePath) => {
                  return shouldExcludeNovnc(modulePath) || originalExclude(modulePath);
                };
              } else if (Array.isArray(rule.exclude)) {
                rule.exclude.push(shouldExcludeNovnc);
              } else {
                // It's a regex or string, convert to array
                rule.exclude = [rule.exclude, shouldExcludeNovnc];
              }
            }
          }
        });
      }

      // Enable top-level await support in webpack 5
      if (!webpackConfig.experiments) {
        webpackConfig.experiments = {};
      }
      webpackConfig.experiments.topLevelAwait = true;

      return webpackConfig;
    },
  },
};

