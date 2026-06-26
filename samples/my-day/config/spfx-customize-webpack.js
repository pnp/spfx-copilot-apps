'use strict';

/**
 * SPFx / Heft webpack customization hook.
 *
 * The rig's `customize-spfx-webpack-configuration-plugin` automatically loads
 * this file (`config/spfx-customize-webpack.js`) and calls the exported function
 * with the generated webpack configuration, on every `heft build` / `heft start`.
 *
 * Purpose: silence the noisy "export … was not found in '@fluentui/react-icons'"
 * warnings (and their giant "possible exports: …" icon dump) emitted for
 * transitive Fluent UI v9 packages — `@fluentui/react-field`,
 * `@fluentui/react-message-bar`, `@fluentui/react-toast`. Those packages
 * reference icon names that are absent from the pinned
 * `@fluentui/react-icons@2.0.270` build. They are not used by this component and
 * the warnings are harmless, so we filter only this specific warning category.
 *
 * @param {import('webpack').Configuration | import('webpack').Configuration[]} config
 * @returns {import('webpack').Configuration | import('webpack').Configuration[]}
 */
module.exports = function customizeWebpack(config) {
  /** @param {{ message?: string }} warning */
  const isMissingFluentIcon = (warning) => {
    const message = (warning && warning.message) || '';
    return (
      message.indexOf('@fluentui/react-icons') !== -1 && message.indexOf('was not found') !== -1
    );
  };

  const configs = Array.isArray(config) ? config : [config];
  for (const current of configs) {
    if (!current) {
      continue;
    }
    current.ignoreWarnings = current.ignoreWarnings || [];
    current.ignoreWarnings.push(isMissingFluentIcon);
  }

  return config;
};
