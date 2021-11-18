import React from "react";
import { Column } from "react-table";
import { fireEvent, render, screen, within } from "utils/testing-library";

import { Table } from "./Table";

const data = [
	{
		col1: "column 1",
		col2: "column 2",
		col3: "column 3",
	},
];

const columns: Column<typeof data[number]>[] = [
	{
		Header: "Header 1",
		accessor: "col1",
		className: "flex-row-reverse",
		minimumWidth: true,
	},
	{
		Header: "Header 2",
		accessor: "col2",
		className: "no-border",
	},
	{
		Header: "Header 3",
		accessor: "col3",
		className: "justify-end",
	},
];

describe("Table", () => {
	it("should render", () => {
		const { container } = render(
			<Table columns={columns} data={data}>
				{() => (
					<tr>
						<td>1</td>
						<td>2</td>
					</tr>
				)}
			</Table>,
		);

		expect(container).toMatchSnapshot();
	});

	it("should render empty rows if template not provided", () => {
		const { container } = render(<Table columns={columns} data={data} />);

		expect(container).toMatchSnapshot();
	});

	it("should change sort order on th click", () => {
		render(<Table columns={columns} data={data} />);

		const th = screen.getAllByRole("columnheader")[0];

		fireEvent.click(th);

		expect(th).toHaveTextContent("chevron-down-small.svg");

		expect(within(th).getByRole("img")).toHaveClass("rotate-180");

		fireEvent.click(th);

		expect(within(th).getByRole("img")).not.toHaveClass("rotate-180");
	});

	it("should hide header", () => {
		render(<Table hideHeader columns={columns} data={data} />);

		expect(screen.queryAllByRole("columnheader")).toHaveLength(0);
	});

	it("should render with width class applied to column header", () => {
		render(
			<Table
				columns={[
					{
						Header: "Header 1",
						cellWidth: "width",
					},
				]}
				data={data}
			/>,
		);

		expect(screen.getByTestId("table__th--0")).toHaveClass("width");
	});
});
