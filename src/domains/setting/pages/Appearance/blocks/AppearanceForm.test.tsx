import { screen } from "@testing-library/react";
import React from "react";
import { env, render } from "utils/testing-library";

import { AppearanceForm } from "./AppearanceForm";

describe("AppearanceForm", () => {
	it("should render", () => {
		const profile = env.profiles().create("empty profile");

		const { asFragment } = render(<AppearanceForm profile={profile} />);

		expect(screen.getAllByRole("radiogroup")).toHaveLength(2);

		expect(screen.getByTestId("AppearanceFooterButtons__save")).toBeDisabled();

		expect(asFragment()).toMatchSnapshot();
	});
});
