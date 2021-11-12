import { FormProperties } from "app/components/Form/Form.contracts";
import React from "react";
import { FormProvider } from "react-hook-form";

export const Form = React.forwardRef<HTMLFormElement, FormProperties>(
	({ children, context, onSubmit, ...properties }, reference) => (
		<FormProvider {...context}>
			<form
				data-testid="Form"
				ref={reference}
				className="space-y-5"
				onSubmit={context.handleSubmit(onSubmit)}
				{...properties}
			>
				{children}
			</form>
		</FormProvider>
	),
);

Form.displayName = "Form";
