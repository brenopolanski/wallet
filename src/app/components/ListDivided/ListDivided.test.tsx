import React from "react";
import { render, screen } from "utils/testing-library";

import { ListDivided } from "./ListDivided";

describe("ListDivided", () => {
	it("should render an empty list divided", () => {
		const { asFragment } = render(<ListDivided items={[]} />);

		expect(screen.getByTestId("list-divided__empty")).toHaveTextContent("empty");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render an list divided with items", () => {
		const item = {
			content: (
				<div className="flex flex-row mt-2">
					<div className="flex justify-center items-center mr-6 w-24 h-24 rounded border-2 border-dashed border-theme-secondary-500" />
					<div className="relative w-24 h-24 rounded bg-theme-secondary-500">
						<img
							src="https://randomuser.me/api/portraits/men/3.jpg"
							className="object-cover rounded"
							alt="random avatar"
						/>
					</div>
				</div>
			),
			isFloatingLabel: true,
			itemLabelClass: "text-2xl font-semibold text-theme-secondary-text",
			itemLabelDescriptionClass: "text-sm font-semibold text-theme-secondary-700",
			itemValueClass: "",
			label: "New Profile",
			labelClass: "",
			labelDescription: "Select Profile Image",
			value: "",
		};
		const { asFragment } = render(<ListDivided items={[item]} />);

		expect(screen.getAllByRole("listitem")).toHaveLength(1);
		expect(asFragment()).toMatchSnapshot();
	});
});
