import userEvent from "@testing-library/user-event";
import { buildTranslations } from "app/i18n/helpers";
import { toasts } from "app/services";
import electron from "electron";
import React from "react";
import { render } from "utils/testing-library";

import { Link } from "./Link";

const translations = buildTranslations();

describe("Link", () => {
	it("should render", () => {
		const { asFragment, getByTestId } = render(<Link to="/test">Test</Link>);

		expect(getByTestId("Link")).toHaveTextContent("Test");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render external", () => {
		const { getByTestId } = render(
			<Link to="https://payvo.com/" isExternal>
				ARK.io
			</Link>,
		);

		expect(getByTestId("Link")).toHaveAttribute("rel", "noopener noreferrer");
		expect(getByTestId("Link__external")).toBeInTheDocument();
	});

	it("should render external without children", () => {
		const { asFragment, getByTestId } = render(<Link to="https://payvo.com" isExternal />);

		expect(getByTestId("Link__external")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should open an external link", () => {
		const ipcRendererMock = jest.spyOn(electron.ipcRenderer, "send").mockImplementation();

		const externalLink = "https://payvo.com/";

		const { asFragment, getByTestId } = render(<Link to={externalLink} isExternal />);

		userEvent.click(getByTestId("Link"));

		expect(ipcRendererMock).toHaveBeenCalledWith("open-external", externalLink);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show a toast when trying to open an invalid external link", () => {
		const externalLink = "invalid-url";

		const toastSpy = jest.spyOn(toasts, "error");

		const { asFragment, getByTestId } = render(<Link to={externalLink} isExternal />);

		userEvent.click(getByTestId("Link"));

		expect(toastSpy).toHaveBeenCalledWith(translations.COMMON.ERRORS.INVALID_URL.replace("{{url}}", "invalid-url"));
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with tooltip", () => {
		const { asFragment, baseElement, getByTestId } = render(
			<Link to="/test" tooltip="Custom Tooltip">
				Test
			</Link>,
		);
		const link = getByTestId("Link");

		userEvent.hover(link);

		expect(baseElement).toHaveTextContent("Custom Tooltip");

		userEvent.click(link);

		expect(asFragment()).toMatchSnapshot();
	});
});
