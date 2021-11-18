import { Contracts } from "@payvo/sdk-profiles";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render, screen } from "utils/testing-library";

import { ProfileCard } from "./ProfileCard";

let profile: Contracts.IProfile;

const options = [
	{ label: "Option 1", value: "1" },
	{ label: "Option 2", value: "2" },
];

describe("ProfileCard", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	it("should render", () => {
		const { container, asFragment } = render(<ProfileCard profile={profile} />);

		expect(container).toBeInTheDocument();
		expect(screen.getByText(profile.name())).toBeInTheDocument();
		expect(screen.getByTestId("ProfileAvatar__svg")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render the profile with avatar image", () => {
		profile.settings().set(Contracts.ProfileSetting.Avatar, "avatarImage");

		const { container, asFragment } = render(<ProfileCard profile={profile} />);

		expect(container).toBeInTheDocument();
		expect(screen.getByText(profile.name())).toBeInTheDocument();
		expect(screen.getByTestId("ProfileAvatar__image")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render the settings icon", () => {
		const { container } = render(<ProfileCard profile={profile} actions={options} showSettings />);

		expect(container).toMatchSnapshot();
		expect(screen.getByTestId("dropdown__toggle")).toBeInTheDocument();
	});

	it("should hide the settings icon", () => {
		const { container } = render(<ProfileCard profile={profile} actions={options} showSettings={false} />);

		expect(container).toMatchSnapshot();
	});

	it("should open dropdown settings on icon click", () => {
		render(<ProfileCard profile={profile} actions={options} />);
		const toggle = screen.getByTestId("dropdown__toggle");

		fireEvent.click(toggle);

		expect(screen.getByTestId("dropdown__content")).toBeInTheDocument();
	});

	it("should select an option in the settings", () => {
		const onSelect = jest.fn();
		render(<ProfileCard profile={profile} actions={options} onSelect={onSelect} />);
		const toggle = screen.getByTestId("dropdown__toggle");

		fireEvent.click(toggle);

		expect(screen.getByTestId("dropdown__content")).toBeInTheDocument();

		const firstOption = screen.getByTestId("dropdown__option--0");

		expect(firstOption).toBeInTheDocument();

		fireEvent.click(firstOption);

		expect(onSelect).toHaveBeenCalledWith({ label: "Option 1", value: "1" });
	});

	it("should ignore triggering onSelect callback if not exists", () => {
		render(<ProfileCard profile={profile} actions={options} />);
		const toggle = screen.getByTestId("dropdown__toggle");

		fireEvent.click(toggle);

		expect(screen.getByTestId("dropdown__content")).toBeInTheDocument();

		const firstOption = screen.getByTestId("dropdown__option--0");

		expect(firstOption).toBeInTheDocument();

		fireEvent.click(firstOption);

		expect(screen.queryAllByRole("listbox")).toHaveLength(0);
	});
});
