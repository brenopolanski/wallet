import { act, renderHook } from "@testing-library/react-hooks";
import { translations as errorTranslations } from "domains/error/i18n";
import { Offline } from "domains/error/pages";
import React from "react";
import { render, screen } from "utils/testing-library";

import { useNetworkStatus } from "./network-status";

let eventMap: any;

describe("useNetworkStatus", () => {
	const TestNetworkStatus: React.FC = () => {
		const isOnline = useNetworkStatus();

		return isOnline ? <h1>My App</h1> : <Offline />;
	};

	beforeEach(() => {
		jest.restoreAllMocks();

		eventMap = {};

		jest.spyOn(window, "addEventListener").mockImplementation((eventName, callback) => {
			eventMap[eventName] = callback;
		});
	});

	afterEach(() => {
		jest.spyOn(window, "removeEventListener").mockImplementation((eventName) => {
			delete eventMap[eventName];
		});
	});

	it("should be online", () => {
		jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);

		render(<TestNetworkStatus />);

		expect(screen.getByText("My App")).toBeInTheDocument();
	});

	it("should be offline", () => {
		jest.spyOn(window.navigator, "onLine", "get").mockReturnValueOnce(false);

		render(<TestNetworkStatus />);

		expect(screen.getByTestId("Offline__text")).toHaveTextContent(errorTranslations.OFFLINE.TITLE);
		expect(screen.getByTestId("Offline__text")).toHaveTextContent(errorTranslations.OFFLINE.DESCRIPTION);
	});

	it("should trigger event", () => {
		jest.spyOn(window.navigator, "onLine", "get").mockReturnValueOnce(false);
		const { result } = renderHook(() => useNetworkStatus());

		act(() => {
			eventMap.online();
		});

		expect(result.current.valueOf()).toBe(true);
	});
});
