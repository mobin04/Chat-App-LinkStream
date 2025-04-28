module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  plugins: ["prettier"],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    "prettier/prettier": ["off"],
    "no-console": "warn",
    "func-names": "off",
    "no-underscore-dangle": "off", // useful for _id in mongoose
    "consistent-return": "off",
  },
};
