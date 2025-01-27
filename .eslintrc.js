module.exports = {
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		project: "./tsconfig.json",
		parser: "@typescript-eslint/parser",
		sourceType: "module",
		projectFolderIgnoreList: ["build", "coverage", "node_modules", "public"],
	},
	env: {
		browser: true,
		node: true,
		es6: true,
	},
	plugins: [
		"@typescript-eslint",
		"jest-formatting",
		"jest",
		"prettier",
		"promise",
		"react-hooks",
		"react",
		"simple-import-sort",
		"sonarjs",
		"sort-keys-fix",
		"testcafe",
		"testing-library",
		"unicorn",
		"unused-imports",
	],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
		"plugin:@typescript-eslint/recommended",
		"plugin:import/errors",
		"plugin:import/typescript",
		"plugin:import/warnings",
		"plugin:jest-formatting/strict",
		"plugin:jest/recommended",
		"plugin:prettier/recommended",
		"plugin:promise/recommended",
		"plugin:react-hooks/recommended",
		"plugin:react/recommended",
		"plugin:sonarjs/recommended",
		"plugin:testcafe/recommended",
		"plugin:testing-library/react",
		"plugin:unicorn/recommended",
		"prettier",
	],
	rules: {
		"@typescript-eslint/ban-ts-comment": "warn",
		"@typescript-eslint/ban-types": "warn",
		"@typescript-eslint/consistent-type-definitions": ["error", "interface"],
		"@typescript-eslint/explicit-module-boundary-types": "warn",
		"@typescript-eslint/no-empty-function": "warn",
		"@typescript-eslint/no-explicit-any": "warn",
		"@typescript-eslint/no-floating-promises": "warn",
		"@typescript-eslint/no-misused-promises": "warn",
		"@typescript-eslint/no-non-null-assertion": "warn",
		"@typescript-eslint/no-unnecessary-condition": "warn", // @TODO: set to error and resolve issues
		"@typescript-eslint/no-unsafe-argument": "warn", // @TODO: set to error and resolve issues
		"@typescript-eslint/no-unsafe-assignment": "warn",
		"@typescript-eslint/no-unsafe-call": "warn",
		"@typescript-eslint/no-unsafe-member-access": "warn",
		"@typescript-eslint/no-unsafe-return": "warn",
		"@typescript-eslint/no-unused-expressions": "warn",
		"@typescript-eslint/no-unused-vars": ["error"],
		"@typescript-eslint/no-var-requires": "warn",
		"@typescript-eslint/prefer-regexp-exec": "warn",
		"@typescript-eslint/restrict-plus-operands": "warn",
		"@typescript-eslint/restrict-template-expressions": "warn",
		"@typescript-eslint/unbound-method": "warn",
		"arrow-body-style": ["error", "as-needed"],
		curly: "error",
		"import/default": "error",
		"import/export": "warn",
		"import/exports-last": "warn",
		"import/extensions": "off",
		"import/first": "error",
		"import/group-exports": "off",
		"import/namespace": "error",
		"import/no-absolute-path": "error",
		"import/no-anonymous-default-export": "error",
		"import/no-cycle": "warn",
		"import/no-deprecated": "error",
		"import/no-duplicates": "error",
		"import/no-dynamic-require": "off",
		"import/no-extraneous-dependencies": "error",
		"import/no-mutable-exports": "error",
		"import/no-namespace": "warn",
		"import/no-relative-parent-imports": "error",
		"import/no-restricted-paths": "error",
		"import/no-self-import": "error",
		"import/no-unresolved": "off",
		"import/no-unused-modules": "error",
		"import/no-useless-path-segments": "error",
		"import/no-webpack-loader-syntax": "error",
		"import/order": "warn",
		"jest/consistent-test-it": "error",
		"jest/max-nested-describe": "error",
		"jest/no-alias-methods": "error",
		"jest/no-conditional-expect": "off",
		"jest/no-done-callback": "off",
		"jest/no-identical-title": "error",
		"jest/no-test-return-statement": "error",
		"jest/prefer-called-with": "error",
		"jest/prefer-expect-resolves": "error",
		"jest/prefer-hooks-on-top": "error",
		"jest/prefer-spy-on": "error",
		"jest/prefer-strict-equal": "error",
		"jest/prefer-to-be": "error",
		"jest/prefer-to-contain": "error",
		"jest/prefer-to-have-length": "error",
		"jest/prefer-todo": "error",
		"jest/require-hook": "error",
		"jest/require-to-throw-message": "error",
		"jest/require-top-level-describe": "error",
		"jest/valid-expect": "error",
		"jest/valid-expect-in-promise": "error",
		"max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
		"max-lines-per-function": ["warn", { max: 40, skipBlankLines: true, skipComments: true }],
		"no-negated-condition": "error",
		"no-nested-ternary": "warn", // @TODO: set to error and resolve issues
		"no-unneeded-ternary": "warn", // @TODO: set to error and resolve issues
		"no-unused-expressions": "off",
		"no-unused-vars": "off",
		"prefer-const": ["warn", { destructuring: "all" }],
		"prettier/prettier": ["off", { endOfLine: "auto" }],
		"promise/param-names": "warn",
		"react-hooks/rules-of-hooks": "error",
		"react/prop-types": "off",
		"react/self-closing-comp": "error",
		"simple-import-sort/exports": "error",
		"simple-import-sort/imports": "error",
		"sonarjs/cognitive-complexity": "warn", // @TODO: set to error and resolve issues
		"sonarjs/no-all-duplicated-branches": "warn", // @TODO: set to error and resolve issues
		"sonarjs/no-collapsible-if": "warn", // @TODO: set to error and resolve issues
		"sonarjs/no-duplicate-string": "warn", // @TODO: set to error and resolve issues
		"sonarjs/no-identical-expressions": "warn", // @TODO: set to error and resolve issues
		"sonarjs/no-identical-functions": "warn", // @TODO: set to error and resolve issues
		"sonarjs/no-redundant-jump": "warn", // @TODO: set to error and resolve issues
		"sonarjs/no-small-switch": "warn", // @TODO: set to error and resolve issues
		"sonarjs/no-use-of-empty-return-value": "warn", // @TODO: set to error and resolve issues
		"sort-keys-fix/sort-keys-fix": ["error", "asc", { caseSensitive: true }],
		"testing-library/await-async-query": "warn", // @TODO: set to error and fix
		"testing-library/await-async-utils": "warn", // @TODO: set to error and fix
		"testing-library/await-fire-event": "warn", // @TODO: set to error and fix
		"testing-library/consistent-data-testid": "off", // @TODO: https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/consistent-data-testid.md
		"testing-library/no-await-sync-events": "warn", // @TODO: set to error and fix
		"testing-library/no-await-sync-query": "warn", // @TODO: set to error and fix
		"testing-library/no-container": "error",
		"testing-library/no-debugging-utils": "error",
		"testing-library/no-dom-import": "warn", // @TODO: set to error and fix
		"testing-library/no-manual-cleanup": "warn", // @TODO: set to error and fix
		"testing-library/no-node-access": "warn", // @TODO: set to error and fix
		"testing-library/no-promise-in-fire-event": "warn", // @TODO: set to error and fix
		"testing-library/no-render-in-setup": "warn", // @TODO: set to error and fix
		"testing-library/no-unnecessary-act": "error",
		"testing-library/no-wait-for-empty-callback": "warn", // @TODO: set to error and fix
		"testing-library/no-wait-for-multiple-assertions": "warn", // @TODO: set to error and fix
		"testing-library/no-wait-for-side-effects": "warn", // @TODO: set to error and fix
		"testing-library/no-wait-for-snapshot": "warn", // @TODO: set to error and fix
		"testing-library/prefer-explicit-assert": "warn", // @TODO: set to error and fix
		"testing-library/prefer-find-by": "error",
		"testing-library/prefer-presence-queries": "warn", // @TODO: set to error and fix
		"testing-library/prefer-screen-queries": "warn", // @TODO: set to error and fix
		"testing-library/prefer-user-event": "warn", // @TODO: set to error and fix
		"testing-library/prefer-wait-for": "error",
		"testing-library/render-result-naming-convention": "error",
		"unicorn/consistent-destructuring": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/consistent-function-scoping": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/error-message": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/explicit-length-check": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/filename-case": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/import-style": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/no-abusive-eslint-disable": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/no-array-callback-reference": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/no-array-for-each": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/no-array-method-this-argument": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/no-array-reduce": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/no-new-array": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/no-null": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/no-object-as-default-parameter": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/no-useless-undefined": "off",
		"unicorn/prefer-array-some": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/prefer-at": "off", // @TODO: set to error and fix resulting issues
		"unicorn/prefer-module": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/prefer-node-protocol": "off",
		"unicorn/prefer-number-properties": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/prefer-prototype-methods": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/prefer-spread": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/prefer-string-slice": "warn", // @TODO: set to error and fix resulting issues
		"unicorn/prefer-ternary": "off",
		"unicorn/prefer-top-level-await": "error", // @TODO: set to error and fix resulting issues
		"unicorn/prevent-abbreviations": "warn", // @TODO: set to error and fix resulting issues
		"unused-imports/no-unused-imports-ts": "error",
	},
	overrides: [
		{
			files: ["**/e2e/*.ts", "**/cucumber/*.ts", "**/cucumber/*.feature"],
			rules: {
				"import/no-relative-parent-imports": "off",
				"sort-keys-fix/sort-keys-fix": "off",
			},
		},
		{
			files: ["!**/*.test.{ts,tsx}"],
			plugins: ["jest"],
			rules: {
				"jest/require-hook": "off",
				"jest/require-top-level-describe": "off",
			},
		},
	],
	settings: {
		react: {
			version: "detect",
		},
	},
};
