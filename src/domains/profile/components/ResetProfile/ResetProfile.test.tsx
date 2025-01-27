import { Contracts } from "@payvo/sdk-profiles";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render, waitFor } from "utils/testing-library";

import { ResetProfile } from "./ResetProfile";

let profile: Contracts.IProfile;

describe("ResetProfile", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		profile.settings().set(Contracts.ProfileSetting.Theme, "dark");
		env.persist();
	});

	it("should render", async () => {
		const { getByTestId, asFragment, findByTestId } = render(<ResetProfile isOpen profile={profile} />);

		await findByTestId("modal__inner");

		expect(getByTestId("ResetProfile__submit-button")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should reset profile", async () => {
		const onReset = jest.fn();

		const { getByTestId, findByTestId } = render(<ResetProfile isOpen profile={profile} onReset={onReset} />);

		const theme = profile.settings().get(Contracts.ProfileSetting.Theme);

		await findByTestId("modal__inner");

		fireEvent.click(getByTestId("ResetProfile__submit-button"));

		await waitFor(() => expect(profile.settings().get(Contracts.ProfileSetting.Theme)).not.toBe(theme));

		expect(onReset).toHaveBeenCalledWith();
	});
});
