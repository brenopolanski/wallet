import userEvent from "@testing-library/user-event";
import { Dropdown, DropdownOptionGroup } from "app/components/Dropdown";
import { clickOutsideHandler } from "app/hooks/click-outside";
import React from "react";
import { render, screen } from "utils/testing-library";

const options = [
	{ label: "Option 1", value: "1" },
	{ label: "Option 2", value: "2" },
];

describe("Dropdown", () => {
	it("should render", () => {
		const { container } = render(<Dropdown />);

		expect(container).toMatchSnapshot();
	});

	it("should render a small one", () => {
		const { container } = render(<Dropdown toggleSize="sm" />);

		expect(container).toMatchSnapshot();
	});

	it("should render a large one", () => {
		const { container } = render(<Dropdown toggleSize="lg" />);

		expect(container).toMatchSnapshot();
	});

	it("should render toggle icon", () => {
		const { container, getByTestId } = render(<Dropdown />);

		expect(container).toMatchSnapshot();
		expect(getByTestId("dropdown__toggle")).toBeInTheDocument();
	});

	it("should render with options", () => {
		const { container } = render(<Dropdown options={options} />);

		expect(container).toMatchSnapshot();
	});

	it("should open dropdown options on icon click", () => {
		const { getByTestId } = render(<Dropdown options={options} />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getByTestId("dropdown__content")).toBeInTheDocument();
	});

	it("shouldn't open dropdown by disableToggle param on icon click", () => {
		const { getByTestId } = render(<Dropdown options={options} disableToggle={true} />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(screen.queryByTestId("dropdown__content")).not.toBeInTheDocument();
	});

	it("should select option by click", () => {
		const onSelect = jest.fn();
		const { getByTestId } = render(<Dropdown options={options} onSelect={onSelect} />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getByTestId("dropdown__content")).toBeInTheDocument();

		const firstOption = getByTestId("dropdown__option--0");

		expect(firstOption).toBeInTheDocument();

		userEvent.click(firstOption);

		expect(onSelect).toHaveBeenCalledWith({ label: "Option 1", value: "1" });
	});

	it("should select option with enter key", () => {
		const onSelect = jest.fn();
		const { getByTestId } = render(<Dropdown options={options} onSelect={onSelect} />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getByTestId("dropdown__content")).toBeInTheDocument();

		userEvent.tab();
		userEvent.keyboard("{enter}");

		expect(onSelect).toHaveBeenCalledWith({ label: "Option 1", value: "1" });
	});

	it("should select option with space key", () => {
		const onSelect = jest.fn();
		const { getByTestId } = render(<Dropdown options={options} onSelect={onSelect} />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getByTestId("dropdown__content")).toBeInTheDocument();

		userEvent.tab();
		userEvent.keyboard("{space}");

		expect(onSelect).toHaveBeenCalledWith({ label: "Option 1", value: "1" });
	});

	it("should ignore triggering onSelect callback if not exists", () => {
		const { getByTestId } = render(<Dropdown options={options} />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getByTestId("dropdown__content")).toBeInTheDocument();

		const firstOption = getByTestId("dropdown__option--0");

		expect(firstOption).toBeInTheDocument();

		userEvent.click(firstOption);

		expect(screen.queryAllByRole("listbox")).toHaveLength(0);
	});

	it("should close dropdown content when click outside", () => {
		const onSelect = () => ({});
		const { getByTestId } = render(
			<div>
				<div data-testid="dropdown__outside" className="mt-16">
					outside elememt to be clicked
				</div>
				<div className="m-16">
					<Dropdown options={options} onSelect={onSelect} />
				</div>
			</div>,
		);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getByTestId("dropdown__content")).toBeInTheDocument();

		const firstOption = getByTestId("dropdown__option--0");

		expect(firstOption).toBeInTheDocument();

		const outsideElement = getByTestId("dropdown__outside");

		expect(outsideElement).toBeInTheDocument();

		userEvent.click(outsideElement);

		expect(screen.queryAllByRole("listbox")).toHaveLength(0);
	});

	it("should close dropdown with escape key", () => {
		const { getByTestId } = render(<Dropdown options={options} />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getByTestId("dropdown__content")).toBeInTheDocument();

		userEvent.keyboard("{esc}");

		expect(screen.queryAllByRole("listbox")).toHaveLength(0);
	});

	it("should render with custom toggle content as react element", () => {
		const { container } = render(<Dropdown toggleContent={<div>custom toggle</div>} />);

		expect(container).toMatchSnapshot();
	});

	it("should render with custom toggle content as function", () => {
		const { container } = render(
			<Dropdown toggleContent={(isOpen: boolean) => <div>Dropdown is open: {isOpen}</div>} />,
		);

		expect(container).toMatchSnapshot();
	});

	it("should render a bottom position", () => {
		const { getByTestId, container } = render(<Dropdown options={options} position="bottom" />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(container).toMatchSnapshot();
	});

	it("should render a bottom-left position", () => {
		const { getByTestId, container } = render(<Dropdown options={options} position="bottom-left" />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(container).toMatchSnapshot();
	});

	it("should render a left position", () => {
		const { getByTestId, container } = render(<Dropdown options={options} position="left" />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(container).toMatchSnapshot();
	});

	it("should render a top-left position", () => {
		const { getByTestId, container } = render(<Dropdown options={options} position="top-left" />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(container).toMatchSnapshot();
	});

	it("should render a top", () => {
		const { getByTestId, container } = render(<Dropdown options={options} position="top" />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(container).toMatchSnapshot();
	});

	it("should render a top-right", () => {
		const { getByTestId, container } = render(<Dropdown options={options} position="top-right" />);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(container).toMatchSnapshot();
	});

	it("should render dropdown group options with divider, icon and secondary label", () => {
		const primaryOptions: DropdownOptionGroup = {
			key: "primary",
			options: [
				{
					label: "Primary Options 1.1",
					value: "value 1.1",
				},
				{
					label: "Primary Options 1.2",
					value: "value 1.2",
				},
			],
			title: "Primary Options 1",
		};

		const secondaryOptions: DropdownOptionGroup = {
			hasDivider: true,
			key: "secondary",
			options: [
				{
					icon: "icon-1",
					iconPosition: "end",
					label: "Secondary Options 1.1",
					value: "value 1.1",
				},
				{
					icon: "icon-2",
					iconPosition: "start",
					label: "Secondary Options 1.2",
					secondaryLabel: "secondary label",
					value: "value 1.2",
				},
			],
			title: "Secondary Options 1",
		};
		const { getByTestId, container } = render(
			<Dropdown options={[primaryOptions, secondaryOptions]} position="top-right" />,
		);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(container).toMatchSnapshot();
	});

	it("should render without options one", () => {
		const primaryOptions: DropdownOptionGroup = {
			key: "primary",
			options: [],
			title: "Primary Options 1",
		};

		const secondaryOptions: DropdownOptionGroup = {
			hasDivider: true,
			key: "secondary",
			options: [],
			title: "Secondary Options 1",
		};
		const { getByTestId, container } = render(
			<Dropdown options={[primaryOptions, secondaryOptions]} position="top-right" />,
		);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(container).toMatchSnapshot();
	});

	it("should render with a disabled option", () => {
		const { getByTestId, container } = render(
			<Dropdown options={[{ disabled: true, label: "Disabled Option", value: "disabled" }]} />,
		);

		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		userEvent.click(getByTestId("dropdown__option--0"));

		// Keep it open
		expect(toggle).toBeInTheDocument();

		expect(container).toMatchSnapshot();
	});
});

describe("Dropdown ClickOutside Hook", () => {
	it("should not call callback if clicked on target element", () => {
		const element = document;
		const reference = { current: element };
		const callback = jest.fn();
		clickOutsideHandler(reference, callback);

		userEvent.click(element.body);

		expect(callback).not.toHaveBeenCalled();
	});

	it("should call callback if clicked outside target element", () => {
		const div = document.createElement("div");
		const reference = { current: div };

		const callback = jest.fn();
		clickOutsideHandler(reference, callback);

		userEvent.click(document.body);

		expect(callback).toHaveBeenCalledWith();
	});

	it("should do nothing if callback is not provided", () => {
		const div = document.createElement("div");
		const reference = { current: div };

		clickOutsideHandler(reference, null);

		userEvent.click(document.body);
	});
});

describe("Dropdown positioning", () => {
	it("should render content below toggle", () => {
		const documentClientHeightSpy = jest.spyOn(document.body, "clientHeight", "get").mockReturnValue(50);
		const getComputedStyleSpy = jest.spyOn(window, "getComputedStyle").mockReturnValueOnce({ marginTop: "10px" });

		const { getByTestId } = render(
			<Dropdown>
				<span>hello</span>
			</Dropdown>,
		);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getByTestId("dropdown__content")).toHaveAttribute("style", "opacity: 1;");

		documentClientHeightSpy.mockRestore();
		getComputedStyleSpy.mockRestore();
	});

	it("should render content below toggle and reduce its height", () => {
		const getBoundingClientRectSpy = jest
			.spyOn(Element.prototype, "getBoundingClientRect")
			.mockReturnValue({ height: 90, top: 0 });
		const toggleHeightSpy = jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValueOnce(10);
		const dropdownHeightSpy = jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(100);
		const documentClientHeightSpy = jest.spyOn(document.body, "clientHeight", "get").mockReturnValue(100);
		const elementClientHeightSpy = jest.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(100);

		const { getByTestId } = render(
			<Dropdown>
				<span>hello</span>
			</Dropdown>,
		);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getByTestId("dropdown__content")).toHaveAttribute(
			"style",
			"opacity: 1; height: 60px; overflow-y: scroll;",
		);

		getBoundingClientRectSpy.mockRestore();
		toggleHeightSpy.mockRestore();
		dropdownHeightSpy.mockRestore();
		documentClientHeightSpy.mockRestore();
		elementClientHeightSpy.mockRestore();
	});

	it("should render content above toggle and apply a negative margin", () => {
		const getBoundingClientRectSpy = jest
			.spyOn(Element.prototype, "getBoundingClientRect")
			.mockReturnValue({ height: 50, top: 100 });
		const offsetHeightSpy = jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(50);
		const documentClientHeightSpy = jest.spyOn(document.body, "clientHeight", "get").mockReturnValue(150);

		const { getByTestId } = render(
			<Dropdown>
				<span>hello</span>
			</Dropdown>,
		);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getByTestId("dropdown__content")).toHaveAttribute("style", "margin-top: -100px; opacity: 1;");

		getBoundingClientRectSpy.mockRestore();
		offsetHeightSpy.mockRestore();
		documentClientHeightSpy.mockRestore();
	});

	it("shouldn't do resize if no ref found", () => {
		const reference = { current: null };
		Object.defineProperty(reference, "current", {
			get: jest.fn(() => null),
			set: jest.fn(() => null),
		});
		const useReferenceSpy = jest.spyOn(React, "useRef").mockReturnValue(reference);
		const getBoundingClientRectSpy = jest.spyOn(Element.prototype, "getBoundingClientRect");
		const documentClientHeightSpy = jest.spyOn(document.body, "clientHeight", "get").mockReturnValue(100);

		const { getByTestId } = render(
			<Dropdown>
				<span>hello</span>
			</Dropdown>,
		);
		const toggle = getByTestId("dropdown__toggle");

		userEvent.click(toggle);

		expect(getBoundingClientRectSpy).not.toHaveBeenCalled();

		getBoundingClientRectSpy.mockRestore();
		documentClientHeightSpy.mockRestore();
		useReferenceSpy.mockRestore();
	});
});
