const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Enable top-level await support in webpack 5
      if (!webpackConfig.experiments) {
        webpackConfig.experiments = {};
      }
      webpackConfig.experiments.topLevelAwait = true;

      // Find the oneOf rule (react-scripts uses oneOf for all rules)
      const oneOfRule = webpackConfig.module.rules.find(
        (rule) => rule.oneOf
      );

      if (oneOfRule && oneOfRule.oneOf) {
        const novncPath = path.resolve(__dirname, 'node_modules/@novnc/novnc');
        const novncRegex = /node_modules[\/\\]@novnc[\/\\]novnc/;

        // First, add a rule for @novnc/novnc at the beginning to handle it as ES module
        const novncRule = {
          test: /\.(js|mjs)$/,
          include: [
            path.resolve(__dirname, 'node_modules/@novnc/novnc'),
          ],
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false,
          },
          parser: {
            requireEnsure: false,
          },
          generator: {
            outputModule: true,
          },
        };

        // Insert at the very beginning to ensure it's processed first
        oneOfRule.oneOf.unshift(novncRule);

        // Now, modify all babel-loader rules to exclude @novnc/novnc
        oneOfRule.oneOf.forEach((rule, index) => {
          // Skip the rule we just added
          if (index === 0) return;

          // Check if this rule uses babel-loader
          let hasBabelLoader = false;
          if (rule.use && Array.isArray(rule.use)) {
            hasBabelLoader = rule.use.some((loader) => {
              const loaderPath = typeof loader === 'string' 
                ? loader 
                : (loader.loader || '');
              return loaderPath.includes('babel-loader');
            });
          } else if (rule.loader && rule.loader.includes('babel-loader')) {
            hasBabelLoader = true;
          }

          if (hasBabelLoader) {
            // Create exclude function for @novnc/novnc
            const excludeNovnc = (modulePath) => {
              if (!modulePath) return false;
              const normalizedPath = modulePath.replace(/\\/g, '/');
              return (
                normalizedPath.includes('@novnc/novnc') ||
                normalizedPath.includes('node_modules/@novnc/novnc') ||
                normalizedPath.match(novncRegex) !== null
              );
            };

            // Modify exclude to also exclude @novnc/novnc
            if (!rule.exclude) {
              rule.exclude = excludeNovnc;
            } else if (typeof rule.exclude === 'function') {
              const originalExclude = rule.exclude;
              rule.exclude = (modulePath) => {
                return excludeNovnc(modulePath) || originalExclude(modulePath);
              };
            } else if (Array.isArray(rule.exclude)) {
              rule.exclude.push(excludeNovnc);
            } else {
              // It's a regex or string
              rule.exclude = [rule.exclude, excludeNovnc];
            }
          }
        });
      }

      return webpackConfig;
    },
  },
};

