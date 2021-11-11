import { clickOutsideHandler } from "app/hooks/click-outside";
import { fireEvent } from "utils/testing-library";

describe("ClickOutside Hook", () => {
	it("should not call callback if clicked on target element", () => {
		const element = document;
		const reference = { current: element };
		const callback = jest.fn();
		clickOutsideHandler(reference, callback);

		fireEvent.mouseDown(element);

		expect(callback).not.toHaveBeenCalled();
	});

	it("should call callback if clicked outside target element", () => {
		const div = document.createElement("div");
		const reference = { current: div };

		const callback = jest.fn();
		clickOutsideHandler(reference, callback);

		fireEvent.mouseDown(document);

		expect(callback).toHaveBeenCalledWith();
	});

	it("should do nothing if callback is not provided", () => {
		const div = document.createElement("div");
		const reference = { current: div };

		clickOutsideHandler(reference, null);

		fireEvent.mouseDown(document);
	});

	it("should cover the removeEvent", () => {
		const div = document.createElement("div");
		const reference = { current: div };
		const handler = clickOutsideHandler(reference, () => "test")();

		expect(handler).toBeUndefined();
	});
});
