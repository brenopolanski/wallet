import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { translations } from "domains/setting/i18n";
import React from "react";
import * as reactHookForm from "react-hook-form";

import { AppearanceViewingMode } from "./AppearanceViewingMode";

describe("AppearanceViewingMode", () => {
	it("should render", () => {
		const watch = jest.fn();
		const setValue = jest.fn();

		jest.spyOn(reactHookForm, "useFormContext").mockImplementationOnce(() => ({ setValue, watch } as any));

		const { asFragment } = render(<AppearanceViewingMode />);

		expect(watch).toHaveBeenCalledWith("viewingMode");
		expect(asFragment()).toMatchSnapshot();
	});

	it.each(["light", "dark"])("should allow to change the value", (viewingMode: string) => {
		const watch = jest.fn();
		const setValue = jest.fn();

		jest.spyOn(reactHookForm, "useFormContext").mockImplementationOnce(() => ({ setValue, watch } as any));

		render(<AppearanceViewingMode />);

		expect(screen.getAllByRole("radio")).toHaveLength(2);

		const buttonText = translations.APPEARANCE.OPTIONS.VIEWING_MODE.VIEWING_MODES[viewingMode.toUpperCase()];

		userEvent.click(screen.getByText(buttonText));

		expect(setValue).toHaveBeenCalledWith("viewingMode", viewingMode, {
			shouldDirty: true,
			shouldValidate: true,
		});
	});
});
