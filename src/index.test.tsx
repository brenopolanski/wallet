import userEvent from "@testing-library/user-event";
import { translations } from "app/i18n/common/i18n";
import React from "react";
import { Prompt, Route, Switch, useHistory } from "react-router-dom";
import { render, screen } from "utils/testing-library";

import { AppRouter } from "./index";

jest.mock("react-dom", () => ({ render: jest.fn() }));

describe("Application root", () => {
	it("should show confirmation modal", async () => {
		const Component = () => {
			const history = useHistory();

			return (
				<>
					<h1>First</h1>
					<Prompt message={() => "block"} />
					<button onClick={() => history.push("/second")}>Navigate</button>
				</>
			);
		};

		render(
			<AppRouter>
				<Switch>
					<Route path="/" exact>
						<Component />
					</Route>
					<Route path="/second" exact>
						<h2>Second</h2>
					</Route>
				</Switch>
			</AppRouter>,
		);

		expect(screen.getByText("First")).toBeInTheDocument();

		userEvent.click(screen.getByText("Navigate"));

		await screen.findByTestId("ConfirmationModal");
		userEvent.click(screen.getByText(translations.NO));

		// Same page without confirmation modal
		expect(screen.getByText("First")).toBeInTheDocument();
		expect(screen.queryByTestId("ConfirmationModal")).not.toBeInTheDocument();

		userEvent.click(screen.getByText("Navigate"));

		await screen.findByTestId("ConfirmationModal");
		userEvent.click(screen.getByText(translations.YES));

		expect(screen.getByText("Second")).toBeInTheDocument();
	});
});
