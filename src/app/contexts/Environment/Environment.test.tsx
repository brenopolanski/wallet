import userEvent from "@testing-library/user-event";
import { Contracts } from "@payvo/profiles";
import { ARK } from "@payvo/sdk-ark";
import { httpClient } from "app/services";
import { createMemoryHistory } from "history";
import React from "react";
import { StubStorage } from "tests/mocks";
import { env, fireEvent, render, waitFor } from "utils/testing-library";

import { EnvironmentProvider, useEnvironmentContext } from "./Environment";

describe("Environment Context", () => {
	let database: Storage;

	beforeEach(() => {
		database = new StubStorage();
	});

	it("should throw without provider", () => {
		jest.spyOn(console, "error").mockImplementation(() => null);
		const Test = () => {
			const { env } = useEnvironmentContext();
			return <p>{env.profiles().count()}</p>;
		};

		expect(() => render(<Test />, { withProviders: false })).toThrow(
			"[useEnvironment] Component not wrapped within a Provider",
		);

		console.error.mockRestore();
	});

	it("should render the wrapper properly", () => {
		env.reset({ coins: { ARK }, httpClient, storage: new StubStorage() });

		const { container, asFragment, getByText } = render(
			<EnvironmentProvider env={env}>
				<span>Provider testing</span>
			</EnvironmentProvider>,
		);

		expect(getByText("Provider testing")).toBeInTheDocument();

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should rerender components when env updates", async () => {
		const Details = () => {
			const context = useEnvironmentContext();
			const count = React.useMemo(() => context.env.profiles().count(), [context]);
			return <h1>Counter {count}</h1>;
		};

		const Create = () => {
			const { env, persist } = useEnvironmentContext();

			const handleClick = async () => {
				env.profiles().create("Test");
				await persist();
			};

			return <button onClick={handleClick}>Create</button>;
		};

		const App = () => {
			env.reset({ coins: { ARK }, httpClient, storage: database });

			return (
				<EnvironmentProvider env={env}>
					<Details />
					<Create />
				</EnvironmentProvider>
			);
		};

		const { getByRole } = render(<App />, { withProviders: false });

		userEvent.click(getByRole("button"));

		await waitFor(() => expect(getByRole("heading")).toHaveTextContent("Counter 1"));

		const profiles = await database.get<any>("profiles");

		expect(Object.keys(profiles)).toHaveLength(1);
	});

	it("should save profile before persist", async () => {
		const profile = env.profiles().create("foo");
		const history = createMemoryHistory();
		history.push(`/profiles/${profile.id()}`);

		const ProfilePage = () => {
			const { persist } = useEnvironmentContext();

			const handleClick = async () => {
				profile.settings().set(Contracts.ProfileSetting.Name, "bar");
				await persist();
			};

			return <button onClick={handleClick}>Create</button>;
		};

		const App = () => (
			<EnvironmentProvider env={env}>
				<ProfilePage />
			</EnvironmentProvider>
		);

		const { getByRole } = render(<App />, { history });

		userEvent.click(getByRole("button"));

		await waitFor(() => expect(profile.settings().get(Contracts.ProfileSetting.Name)).toBe("bar"));
	});

	it("should not persist on e2e", async () => {
		process.env.REACT_APP_IS_E2E = "1";
		const Details = () => {
			const context = useEnvironmentContext();
			const count = React.useMemo(() => context.env.profiles().count(), [context]);
			return <h1>Counter {count}</h1>;
		};

		const Create = () => {
			const { env, persist } = useEnvironmentContext();

			const handleClick = async () => {
				env.profiles().create("Test");
				await persist();
			};

			return <button onClick={handleClick}>Create</button>;
		};

		const App = () => {
			env.reset({ coins: { ARK }, httpClient, storage: database });

			return (
				<EnvironmentProvider env={env}>
					<Details />
					<Create />
				</EnvironmentProvider>
			);
		};

		const { getByRole } = render(<App />, { withProviders: false });

		userEvent.click(getByRole("button"));

		await waitFor(() => expect(getByRole("heading")).toHaveTextContent("Counter 1"));

		const profiles = await database.get<any>("profiles");

		expect(profiles).toBeUndefined();
	});
});
