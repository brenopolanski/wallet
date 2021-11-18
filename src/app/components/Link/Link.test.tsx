import { buildTranslations } from "app/i18n/helpers";
import { toasts } from "app/services";
import electron from "electron";
import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { Link } from "./Link";

const translations = buildTranslations();

describe("Link", () => {
	it("should render", () => {
		const { asFragment } = render(<Link to="/test">Test</Link>);

		expect(screen.getByTestId("Link")).toHaveTextContent("Test");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render external", () => {
		render(
			<Link to="https://payvo.com/" isExternal>
				ARK.io
			</Link>,
		);

		expect(screen.getByTestId("Link")).toHaveAttribute("rel", "noopener noreferrer");
		expect(screen.getByTestId("Link__external")).toBeInTheDocument();
	});

	it("should render external without children", () => {
		const { asFragment } = render(<Link to="https://payvo.com" isExternal />);

		expect(screen.getByTestId("Link__external")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should open an external link", () => {
		const ipcRendererMock = jest.spyOn(electron.ipcRenderer, "send").mockImplementation();

		const externalLink = "https://payvo.com/";

		const { asFragment } = render(<Link to={externalLink} isExternal />);

		fireEvent.click(screen.getByTestId("Link"));

		expect(ipcRendererMock).toHaveBeenCalledWith("open-external", externalLink);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show a toast when trying to open an invalid external link", () => {
		const externalLink = "invalid-url";

		const toastSpy = jest.spyOn(toasts, "error");

		const { asFragment } = render(<Link to={externalLink} isExternal />);

		fireEvent.click(screen.getByTestId("Link"));

		expect(toastSpy).toHaveBeenCalledWith(translations.COMMON.ERRORS.INVALID_URL.replace("{{url}}", "invalid-url"));
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with tooltip", () => {
		const { asFragment, baseElement } = render(
			<Link to="/test" tooltip="Custom Tooltip">
				Test
			</Link>,
		);
		const link = screen.getByTestId("Link");

		fireEvent.mouseEnter(link);

		expect(baseElement).toHaveTextContent("Custom Tooltip");

		fireEvent.click(link);

		expect(asFragment()).toMatchSnapshot();
	});
});
