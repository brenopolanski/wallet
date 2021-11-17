const slugify = require("@sindresorhus/slugify");
const { writeFileSync } = require("fs");
const { resolve } = require("path");
const YAML = require("yaml");

const workflow = {
	name: "Test",
	on: {
		push: {
			branches: ["master", "develop"],
		},
		pull_request: {
			types: ["ready_for_review", "synchronize", "opened"],
		},
	},
	jobs: {},
};

const directories = {
	app: {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: 4,
	},
	"domains/contact": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/dashboard": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/error": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/exchange": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/network": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/news": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/plugin": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/profile": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/setting": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/splash": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/transaction": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: 3,
	},
	"domains/vote": {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	"domains/wallet": {
		coverageThreshold: {
			branches: 95,
			functions: 80,
			lines: 60,
			statements: 60,
		},
		maxWorkers: "50%",
	},
	plugins: {
		coverageThreshold: {
			branches: 100,
			functions: 96.34,
			lines: 97.78,
			statements: 97.97,
		},
		maxWorkers: "50%",
	},
	router: {
		coverageThreshold: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		maxWorkers: "50%",
	},
	utils: {
		coverageThreshold: {
			branches: 55.71,
			functions: 23.4,
			lines: 50,
			statements: 46.94,
		},
		maxWorkers: "50%",
	},
};

for (const [directory, { coverageThreshold, maxWorkers }] of Object.entries(directories)) {
	const collectCoverageFrom = [
		`src/${directory}/**/*.{js,jsx,ts,tsx}`,
		"!<rootDir>/build/*",
		"!<rootDir>/dist/*",
		"!jest.setup.js",
		"!src/**/e2e/*.ts",
		"!src/**/cucumber/*.ts",
		"!src/**/*.e2e.ts",
		"!src/**/*.models.{js,jsx,ts,tsx}",
		"!src/**/*.stories.{js,jsx,ts,tsx}",
		"!src/**/*.styles.{js,jsx,ts,tsx}",
		"!src/electron/**/*",
		"!src/i18n/**/*",
		"!src/tests/**/*",
		"!src/tailwind.config.js",
		"!src/utils/e2e-utils.ts",
		"!src/polyfill/**/*",
	];

	const job = {
		"runs-on": "ubuntu-latest",
		strategy: {
			matrix: {
				"node-version": ["14.x"],
			},
		},
		concurrency: {
			group: `\${{ github.head_ref }}-test-${slugify(directory)}`,
			"cancel-in-progress": true,
		},
		steps: [
			{
				uses: "actions/checkout@v2",
				with: {
					ref: "${{ github.head_ref }}",
				},
			},
			{
				name: "Get yarn cache directory path",
				id: "yarn-cache-dir-path",
				run: 'echo "::set-output name=dir::$(yarn cache dir)"',
			},
			{
				name: "Cache node modules",
				uses: "actions/cache@v2",
				id: "yarn-cache",
				with: {
					path: "${{ steps.yarn-cache-dir-path.outputs.dir }}",
					key: "${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}",
					"restore-keys": "${{ runner.os }}-yarn-",
				},
			},
			{
				name: "Use Node.js ${{ matrix.node-version }}",
				uses: "actions/setup-node@v1",
				with: {
					"node-version": "${{ matrix.node-version }}",
				},
			},
			{
				name: "Update System",
				run: "sudo apt-get update",
			},
			{
				name: "Install (Ledger Requirements)",
				run: "sudo apt-get install libudev-dev libusb-1.0-0-dev",
			},
			{
				name: "Install (Yarn)",
				run: "pnpm install",
			},
			{
				name: "Rebuild",
				run: "npm rebuild",
			},
			{
				name: "Test",
				uses: "nick-invision/retry@v2",
				with: {
					timeout_minutes: 10,
					max_attempts: 3,
					command: `./node_modules/react-app-rewired/bin/index.js --expose-gc test src/${directory} --env=./src/tests/custom-env.js --forceExit --maxWorkers=${maxWorkers} --logHeapUsage --watchAll=false --coverage --collectCoverageFrom='${JSON.stringify(
						collectCoverageFrom,
					)}' --coverageThreshold='${JSON.stringify({
						[`./src/${directory}/`]: coverageThreshold,
					})}'`,
				},
			},
		],
	};

	workflow.jobs[slugify(directory)] = job;
}

writeFileSync(resolve(".github/workflows/test.yml"), YAML.stringify(workflow, { indent: 4 }));
