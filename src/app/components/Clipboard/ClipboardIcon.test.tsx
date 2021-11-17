import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { translations } from "app/i18n/common/i18n";
import React from "react";
import { render, screen } from "utils/testing-library";

import { Clipboard } from "./Clipboard";

describe("ClipboardIcon", () => {
	beforeAll(() => {
		(navigator as any).clipboard = {
			writeText: jest.fn().mockResolvedValue("test"),
		};
	});

	afterAll(() => {
		(navigator as any).clipboard.writeText.mockRestore();
	});

	it("should render with tooltip in the dark mode", () => {
		render(
			<Clipboard variant="icon" data="" tooltipDarkTheme>
				<span>Hello!</span>
			</Clipboard>,
		);

		userEvent.hover(screen.getByTestId("clipboard-icon__wrapper"));

		expect(screen.getByRole("tooltip")).toHaveAttribute("data-theme", "dark");
	});

	it("should change the tooltip content when clicked", async () => {
		const { baseElement, getByTestId } = render(
			<Clipboard variant="icon" data="">
				<span>Hello!</span>
			</Clipboard>,
		);

		userEvent.hover(getByTestId("clipboard-icon__wrapper"));

		expect(baseElement).toHaveTextContent(translations.CLIPBOARD.TOOLTIP_TEXT);
		expect(baseElement).not.toHaveTextContent(translations.CLIPBOARD.SUCCESS);

		userEvent.click(getByTestId("clipboard-icon__wrapper"));

		await waitFor(() => expect(baseElement).not.toHaveTextContent(translations.CLIPBOARD.TOOLTIP_TEXT));

		expect(baseElement).toHaveTextContent(translations.CLIPBOARD.SUCCESS);
	});
});
