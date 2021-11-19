import React from "react";
import { Size } from "types";
import { render, screen } from "utils/testing-library";

import { Address } from "./Address";

const sampleAddress = "ASuusXSW9kfWnicScSgUTjttP6T9GQ3kqT";

describe("Formatted Address", () => {
	it("should render address only", () => {
		const { container } = render(<Address address={sampleAddress} />);

		expect(container).toMatchSnapshot();
	});

	it("should render with wallet name", () => {
		const { container } = render(<Address address={sampleAddress} walletName="Sample Wallet" />);

		expect(container).toMatchSnapshot();
	});

	it("should not render without address", () => {
		const { container } = render(<Address />);

		expect(container).toMatchSnapshot();
	});

	it.each(["sm", "lg", "xl"])("should render with size %s", (size) => {
		render(<Address address={sampleAddress} walletName="Sample Wallet" size={size as Size} />);

		expect(screen.getByTestId("Address__alias")).toHaveClass(`text-${size}`);
	});

	it("should render with normal font", () => {
		const { container } = render(
			<Address fontWeight="normal" address={sampleAddress} walletName="Sample Wallet" />,
		);

		expect(container).toMatchSnapshot();
	});

	it("should render with custom class for address", () => {
		render(
			<Address
				addressClass="text-theme-primary-600"
				address={sampleAddress}
				walletName="Sample Wallet"
				size="lg"
			/>,
		);

		expect(screen.getByTestId("Address__address")).toHaveClass("text-theme-primary-600");
	});
});
