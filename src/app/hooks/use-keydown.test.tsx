import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useKeydown } from "app/hooks/use-keydown";
import React from "react";

describe("useKeydown", () => {
	const Component = (properties: { keyName: string; callback: () => void }) => {
		useKeydown(properties.keyName, properties.callback);

		return <div />;
	};

	it("should run a callback when mapped button is pressed", () => {
		const callback = jest.fn();

		render(<Component keyName="Enter" callback={callback} />);

		userEvent.keyboard("{enter}");

		expect(callback).toHaveBeenCalledWith(expect.any(KeyboardEvent));
	});

	it("should do nothing when not mapped button is pressed", () => {
		const callback = jest.fn();

		render(<Component keyName="Escape" callback={callback} />);

		userEvent.keyboard("{enter}");

		expect(callback).not.toHaveBeenCalled();
	});
});
