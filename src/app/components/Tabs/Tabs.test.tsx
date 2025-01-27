import React from "react";
import { fireEvent, render } from "utils/testing-library";

import { Tab, TabList, TabPanel, Tabs } from "./Tabs";

describe("Tabs", () => {
	it("should render", () => {
		const { container, asFragment } = render(
			<Tabs>
				<TabList>
					<Tab tabId={1}>First</Tab>
					<Tab tabId={2}>Second</Tab>
					<Tab tabId={3}>Third</Tab>
				</TabList>
				<div className="mt-5">
					<TabPanel tabId={1}>1</TabPanel>
					<TabPanel tabId={2}>2</TabPanel>
					<TabPanel tabId={3}>3</TabPanel>
				</div>
			</Tabs>,
		);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render wit counts", () => {
		const { container, asFragment } = render(
			<Tabs>
				<TabList noBackground>
					<Tab tabId={1} count={1}>
						First
					</Tab>
					<Tab tabId={2} count={2}>
						Second
					</Tab>
					<Tab tabId={3} count={3}>
						Third
					</Tab>
				</TabList>
				<div className="mt-5">
					<TabPanel tabId={1}>1</TabPanel>
					<TabPanel tabId={2}>2</TabPanel>
					<TabPanel tabId={3}>3</TabPanel>
				</div>
			</Tabs>,
		);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render without background", () => {
		const { container, asFragment } = render(
			<Tabs>
				<TabList noBackground>
					<Tab tabId={1}>First</Tab>
					<Tab tabId={2}>Second</Tab>
					<Tab tabId={3}>Third</Tab>
				</TabList>
				<div className="mt-5">
					<TabPanel tabId={1}>1</TabPanel>
					<TabPanel tabId={2}>2</TabPanel>
					<TabPanel tabId={3}>3</TabPanel>
				</div>
			</Tabs>,
		);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should react to use effect call", () => {
		const { container, asFragment, getByTestId } = render(
			<Tabs activeId={2}>
				<TabList>
					<Tab tabId={1}>First</Tab>
					<Tab tabId={2}>Second</Tab>
				</TabList>
				<TabPanel tabId={1}>1</TabPanel>
				<TabPanel tabId={2}>2</TabPanel>
			</Tabs>,
		);

		fireEvent.click(getByTestId("tabs__tab-button-1"));

		expect(container).toBeInTheDocument();
		expect(getByTestId("tab-pabel__active-panel")).toHaveTextContent("1");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle switching tabs", () => {
		const { getByTestId } = render(
			<Tabs activeId={1}>
				<TabList>
					<Tab tabId={1}>First</Tab>
					<div>separator</div>
					<Tab tabId={2}>Second</Tab>
				</TabList>
				<TabPanel tabId={1}>1</TabPanel>
				<TabPanel tabId={2}>2</TabPanel>
			</Tabs>,
		);

		const firstTab = getByTestId("tabs__tab-button-1");
		const secondTab = getByTestId("tabs__tab-button-2");

		expect(firstTab).toHaveAttribute("aria-selected", "true");
		expect(secondTab).toHaveAttribute("aria-selected", "false");

		firstTab.focus();

		expect(firstTab).toHaveFocus();

		// got right to second tab
		fireEvent.keyDown(document.activeElement, { code: "ArrowRight", key: "ArrowRight" });

		expect(firstTab).not.toHaveFocus();
		expect(secondTab).toHaveFocus();

		fireEvent.keyDown(document.activeElement, { code: "Enter", key: "Enter" });

		expect(getByTestId("tab-pabel__active-panel")).toHaveTextContent("2");

		expect(firstTab).toHaveAttribute("aria-selected", "false");
		expect(secondTab).toHaveAttribute("aria-selected", "true");

		// go right to first tab
		fireEvent.keyDown(document.activeElement, { code: "ArrowRight", key: "ArrowRight" });

		expect(firstTab).toHaveFocus();
		expect(secondTab).not.toHaveFocus();

		fireEvent.keyDown(document.activeElement, { code: "Space", key: " " });

		expect(getByTestId("tab-pabel__active-panel")).toHaveTextContent("1");

		// go left to second tab
		fireEvent.keyDown(document.activeElement, { code: "ArrowLeft", key: "ArrowLeft" });

		expect(firstTab).not.toHaveFocus();
		expect(secondTab).toHaveFocus();

		fireEvent.keyDown(document.activeElement, { code: "Enter", key: "Enter" });

		expect(getByTestId("tab-pabel__active-panel")).toHaveTextContent("2");

		// go left to first tab
		fireEvent.keyDown(document.activeElement, { code: "ArrowLeft", key: "ArrowLeft" });

		expect(firstTab).toHaveFocus();
		expect(secondTab).not.toHaveFocus();

		fireEvent.keyDown(document.activeElement, { code: "Space", key: " " });

		expect(getByTestId("tab-pabel__active-panel")).toHaveTextContent("1");

		// tab away
		fireEvent.keyDown(document.activeElement, { code: "Tab", key: "Tab" });
	});
});
