import { render, screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import React, { useEffect } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

const HelloWorld = () => {
	const form = useFormContext();

	const { setValue, register, watch } = form;

	const { amount, isSendAllSelected } = watch();

	useEffect(() => {
		register("amount");
		register("isSendAllSelected");
	}, [register]);

	useEffect(() => {
		if (!isSendAllSelected) {
			console.log("'send all' not selected");
			return;
		}

		console.log("'send all' selected, setting amount");
		setValue("amount", Math.random());
	}, [isSendAllSelected, setValue]);

	return (
		<div>
			<p data-testid="amount">{amount ?? "empty"}</p>
			<div>
				<button
					type="button"
					data-testid="button"
					onClick={() => setValue("isSendAllSelected", !isSendAllSelected)}
				>
					click me
				</button>
			</div>
		</div>
	);
};

describe("HelloWorld", () => {
	it("with renderHook", async () => {
		const { result } = renderHook(() => useForm({ mode: "onChange" }));

		render(
			<FormProvider {...result.current}>
				<HelloWorld />
			</FormProvider>,
		);

		expect(screen.getByTestId("amount")).toHaveTextContent("empty");

		userEvent.click(screen.getByTestId("button"));

		await waitFor(() => expect(screen.getByTestId("amount")).not.toHaveTextContent("empty"));
	});

	it("without renderHook", async () => {
		const Wrapper = ({ children }: any) => {
			const form = useForm({ mode: "onChange" });

			return <FormProvider {...form}>{children}</FormProvider>;
		};

		render(<HelloWorld />, { wrapper: Wrapper });

		expect(screen.getByTestId("amount")).toHaveTextContent("empty");

		userEvent.click(screen.getByTestId("button"));

		await waitFor(() => expect(screen.getByTestId("amount")).not.toHaveTextContent("empty"));
	});
});
