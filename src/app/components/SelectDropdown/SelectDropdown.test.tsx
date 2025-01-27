import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "utils/testing-library";

import { Select } from "./SelectDropdown";

enum OptionType {
	base = "base",
	group = "group",
}

const options = [
	{
		label: "Option 1",
		value: "1",
	},
	{
		label: "Option 2",
		value: "2",
	},
	{
		label: "Option 3",
		value: "3",
	},
];

const optionGroup = [
	{
		options: [
			{
				label: "Option 1",
				value: "1",
			},
			{
				label: "Option 2",
				value: "2",
			},
		],
		title: "Group1",
	},
	{
		options: [
			{
				label: "Item 1",
				value: "3",
			},
			{
				label: "Item 2",
				value: "4",
			},
		],
		title: "Group2",
	},
];

const getOptions = (optType: OptionType) => {
	if (optType === OptionType.base) {
		return options;
	}

	return optionGroup;
};

describe("SelectDropdown", () => {
	it.each([OptionType.base, OptionType.group])("should render option %s", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])("should render option %s with custom label", (optType) => {
		const { container } = render(
			<Select options={getOptions(optType)} renderLabel={(option) => <span>{`Label ${option.label}`}</span>} />,
		);

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"), { target: { value: "Opt" } });

		expect(container).toMatchSnapshot();
		expect(screen.queryByText("Label Option 1")).toBeInTheDocument();
	});

	it.each([OptionType.base, OptionType.group])("should render invalid option %s", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} isInvalid />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])("should render disabled option %s", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} disabled />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])("should render option %s without caret", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} showCaret={false} />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])(
		"should trigger menu when clicking on caret in option %s",
		async (optType) => {
			render(<Select options={getOptions(optType)} showCaret />);

			fireEvent.click(screen.getByTestId("SelectDropdown__caret"));

			await screen.findByTestId("SelectDropdown__option--0");

			fireEvent.click(screen.getByTestId("SelectDropdown__caret"));

			await waitFor(() => expect(screen.queryByTestId("SelectDropdown__option--0")).not.toBeInTheDocument());
		},
	);

	it.each([OptionType.base, OptionType.group])("should render option %s with initial default value", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} defaultValue="3" />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])("should render option %s with wrong default value", (optType) => {
		const { container } = render(<Select options={getOptions(optType)} defaultValue="5" />);

		expect(container).toMatchSnapshot();
	});

	it("should render with empty options", () => {
		const { container } = render(<Select options={[]} defaultValue="4" />);

		expect(container).toMatchSnapshot();
	});

	it("should render with options values as numbers", () => {
		const { container } = render(<Select options={[{ label: "Value 1", value: 1 }]} defaultValue="4" />);

		expect(container).toMatchSnapshot();
	});

	it.each([OptionType.base, OptionType.group])("should toggle select list options %s", (optType) => {
		render(<Select options={getOptions(optType)} />);

		const selectDropdown = screen.getByTestId("SelectDropdown__input");

		fireEvent.change(selectDropdown, { target: { value: "Opt" } });

		const firstOption = screen.getByTestId("SelectDropdown__option--0");

		expect(firstOption).toBeInTheDocument();

		fireEvent.click(firstOption);
	});

	it.each([OptionType.base, OptionType.group])("should select option %s", (optType) => {
		render(<Select options={getOptions(optType)} />);

		const selectDropdown = screen.getByTestId("SelectDropdown__input");

		fireEvent.change(selectDropdown, { target: { value: "Opt" } });

		const firstOption = screen.getByTestId("SelectDropdown__option--0");

		expect(firstOption).toBeInTheDocument();

		fireEvent.mouseDown(firstOption);

		expect(screen.getByTestId("select-list__input")).toHaveValue("1");
	});

	it.each([OptionType.base, OptionType.group])("should highlight option %s", (optType) => {
		render(<Select options={getOptions(optType)} />);

		const selectDropdown = screen.getByTestId("SelectDropdown__input");

		fireEvent.change(selectDropdown, { target: { value: "Opt" } });
		fireEvent.keyDown(selectDropdown, { code: 9, key: "Tab" });

		const firstOption = screen.getByTestId("SelectDropdown__option--0");

		expect(firstOption).toBeInTheDocument();

		expect(firstOption).toHaveClass("is-selected");
	});

	it.each([OptionType.base, OptionType.group])("should select options %s with arrow keys", (optType) => {
		render(<Select options={getOptions(optType)} />);

		const selectDropdown = screen.getByTestId("SelectDropdown__input");

		fireEvent.change(selectDropdown, { target: { value: "Opt" } });
		fireEvent.keyDown(selectDropdown, { code: 9, key: "Tab" });
		fireEvent.keyDown(selectDropdown, { code: 8, key: "Backspace" });

		const firstOption = screen.getByTestId("SelectDropdown__option--0");

		expect(firstOption).toBeInTheDocument();

		fireEvent.mouseOver(firstOption);
		fireEvent.keyDown(selectDropdown, { code: 40, key: "ArrowDown" });

		expect(firstOption).toHaveClass("is-highlighted");

		fireEvent.keyDown(firstOption, { code: 13, key: "Enter" });

		expect(screen.getByTestId("select-list__input")).toHaveValue("1");
	});

	it("should highlight first option after reach to the end of the match options", () => {
		const options = [
			{
				label: "Option 1",
				value: "1",
			},
			{
				label: "Option 2",
				value: "2",
			},
			{
				label: "Item 1",
				value: "3",
			},
			{
				label: "Item 2",
				value: "4",
			},
		];

		render(<Select options={options} />);

		const selectDropdown = screen.getByTestId("SelectDropdown__input");

		fireEvent.change(selectDropdown, { target: { value: "Opt" } });

		const firstOption = screen.getByTestId("SelectDropdown__option--0");

		expect(firstOption).toBeInTheDocument();

		fireEvent.keyDown(selectDropdown, { code: 40, key: "ArrowDown" });

		expect(firstOption).toHaveClass("is-highlighted");

		fireEvent.keyDown(selectDropdown, { code: 40, key: "ArrowDown" });

		const secondOption = screen.getByTestId("SelectDropdown__option--1");

		expect(secondOption).toHaveClass("is-highlighted");

		fireEvent.keyDown(selectDropdown, { code: 40, key: "ArrowDown" });

		expect(firstOption).toHaveClass("is-highlighted");
	});

	it.each([OptionType.base, OptionType.group])(
		"should show suggestion when typing has found at least one match in option %s",
		(optType) => {
			render(<Select options={getOptions(optType)} />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");

			fireEvent.change(selectDropdown, { target: { value: "Opt" } });

			expect(screen.getByTestId("Input__suggestion")).toHaveTextContent("Option 1");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should select first matching option with enter in option %s",
		(optType) => {
			render(<Select options={getOptions(optType)} />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");

			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			fireEvent.keyDown(selectDropdown, { code: 13, key: "Enter" });

			expect(screen.getByTestId("select-list__input")).toHaveValue("1");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should select first matching option with tab in option %s",
		(optType) => {
			render(<Select options={getOptions(optType)} />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");

			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			fireEvent.keyDown(selectDropdown, { code: 9, key: "Tab" });

			expect(screen.getByTestId("select-list__input")).toHaveValue("1");
		},
	);

	it.each([OptionType.base, OptionType.group])("should select new option with enter in option %s", (optType) => {
		render(<Select options={getOptions(optType)} />);
		const selectDropdown = screen.getByTestId("SelectDropdown__input");

		fireEvent.change(selectDropdown, { target: { value: "Opt" } });
		fireEvent.keyDown(selectDropdown, { code: 13, key: "Enter" });

		expect(selectDropdown).toHaveValue("Option 1");

		fireEvent.keyDown(selectDropdown, { code: 40, key: "ArrowDown" });
		fireEvent.keyDown(selectDropdown, { code: 13, key: "Enter" });

		expect(selectDropdown).toHaveValue("Option 2");
	});

	it.each([OptionType.base, OptionType.group])(
		"should not select non-matching option after key input and tab in option %s",
		(optType) => {
			render(<Select options={getOptions(optType)} />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");

			fireEvent.change(selectDropdown, { target: { value: "Optt" } });
			fireEvent.keyDown(selectDropdown, { code: 9, key: "Tab" });

			expect(screen.getByTestId("select-list__input")).not.toHaveValue();
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should not select first matched option after random key enter in option %s",
		(optType) => {
			render(<Select options={getOptions(optType)} />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");

			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			fireEvent.keyDown(selectDropdown, { code: 65, key: "A" });

			expect(screen.getByTestId("select-list__input")).not.toHaveValue();
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should clear selection when changing input in option %s",
		(optType) => {
			render(<Select options={getOptions(optType)} />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");

			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			fireEvent.keyDown(selectDropdown, { code: 13, key: "Enter" });

			expect(screen.getByTestId("select-list__input")).toHaveValue("1");

			fireEvent.change(selectDropdown, { target: { value: "test" } });
			fireEvent.keyDown(selectDropdown, { code: 65, key: "A" });
			fireEvent.keyDown(selectDropdown, { code: 65, key: "B" });

			expect(screen.getByTestId("select-list__input")).not.toHaveValue();
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should select match on blur if available in option %s",
		async (optType) => {
			render(<Select options={getOptions(optType)} />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");

			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			fireEvent.blur(selectDropdown);

			await waitFor(() => expect(selectDropdown).toHaveValue("Option 1"));
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should clear input on blur if there is no match in option %s",
		async (optType) => {
			render(<Select options={getOptions(optType)} />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");

			fireEvent.change(selectDropdown, { target: { value: "Foobar" } });
			fireEvent.blur(selectDropdown);

			await waitFor(() => expect(selectDropdown).not.toHaveValue());
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should not clear input on blur if selected in option %s",
		(optType) => {
			render(<Select options={getOptions(optType)} />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");

			fireEvent.change(selectDropdown, { target: { value: "Opt" } });
			fireEvent.keyDown(selectDropdown, { code: 13, key: "Enter" });

			expect(selectDropdown).toHaveValue("Option 1");

			fireEvent.blur(selectDropdown);

			expect(selectDropdown).toHaveValue("Option 1");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should select an option by clicking on it in option %s",
		async (optType) => {
			render(<Select options={getOptions(optType)} />);

			fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

			await screen.findByTestId("SelectDropdown__option--0");

			fireEvent.mouseDown(screen.getByTestId("SelectDropdown__option--0"));

			expect(screen.getByTestId("select-list__input")).toHaveValue("1");
		},
	);

	it("should not open the dropdown on reset", () => {
		const initialValue = options[0].value;

		const Component = () => {
			const [selected, setSelected] = useState<any>(initialValue);
			const onChange = (x: any) => setSelected(x?.value);

			return (
				<>
					<Select onChange={onChange} defaultValue={selected} options={options} />
					<button type="button" data-testid="btn-reset" onClick={() => setSelected(null)}>
						Reset
					</button>
				</>
			);
		};

		render(<Component />);

		// check dropdown not open
		expect(screen.getByTestId("select-list__input")).toHaveValue(initialValue);
		expect(screen.queryByText("Option 2")).not.toBeInTheDocument();

		// set null value
		fireEvent.click(screen.getByTestId("btn-reset"));

		// check value reset and dropdown not open
		expect(screen.getByTestId("select-list__input")).not.toHaveValue();
		expect(screen.queryByText("Option 2")).not.toBeInTheDocument();
	});

	it.each([OptionType.base, OptionType.group])("should allow entering free text in option %s", (optType) => {
		render(<Select options={getOptions(optType)} allowFreeInput />);
		const selectDropdown = screen.getByTestId("SelectDropdown__input");

		fireEvent.change(selectDropdown, { target: { value: "Test" } });

		expect(screen.getByTestId("select-list__input")).toHaveValue("Test");
	});

	it.each([OptionType.base, OptionType.group])(
		"should allow entering free text and handle blur event in option %s",
		(optType) => {
			render(<Select options={getOptions(optType)} allowFreeInput={true} />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");

			fireEvent.change(selectDropdown, { target: { value: "Test" } });
			fireEvent.blur(selectDropdown);

			expect(screen.getByTestId("select-list__input")).toHaveValue("Test");
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should render option %s with default value when free text is allowed",
		(optType) => {
			const { container } = render(<Select options={getOptions(optType)} defaultValue="3" allowFreeInput />);

			expect(screen.getByTestId("select-list__input")).toHaveValue("3");
			expect(container).toMatchSnapshot();
		},
	);

	it.each([OptionType.base, OptionType.group])(
		"should hide dropdown in option %s when no matches found in free text mode",
		(optType) => {
			render(<Select options={getOptions(optType)} defaultValue="3" allowFreeInput />);
			const selectDropdown = screen.getByTestId("SelectDropdown__input");
			fireEvent.change(selectDropdown, { target: { value: options[0].label } });

			expect(screen.getByTestId("select-list__input")).toHaveValue(options[0].label);

			fireEvent.change(selectDropdown, { target: { value: "Unmatched" } });

			expect(() => screen.getByTestId("SelectDropdown__option--0")).toThrow(/Unable to find an element by/);
		},
	);

	it.each([OptionType.base, OptionType.group])("should show all options %s when empty input", (optType) => {
		render(<Select options={getOptions(optType)} defaultValue="3" allowFreeInput />);
		const selectDropdown = screen.getByTestId("SelectDropdown__input");
		fireEvent.change(selectDropdown, { target: { value: options[0].label } });

		expect(screen.getByTestId("select-list__input")).toHaveValue(options[0].label);

		fireEvent.change(selectDropdown, { target: { value: "" } });

		expect(screen.getByTestId("select-list__input")).not.toHaveValue();
		expect(screen.getByTestId("SelectDropdown__option--0")).toBeInTheDocument();
		expect(screen.getByTestId("SelectDropdown__option--1")).toBeInTheDocument();
		expect(screen.getByTestId("SelectDropdown__option--2")).toBeInTheDocument();
	});
});
