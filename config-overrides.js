const { override, disableEsLint } = require("customize-cra");

module.exports = override(
  // disable eslint in webpack
  disableEsLint()
);
