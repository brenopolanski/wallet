import { getStyles } from "app/components/Button/Button.styles";
import { Icon } from "app/components/Icon";
import { useClipboard } from "app/hooks";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { styled } from "twin.macro";
import { ButtonVariant, Size } from "types";

import { ClipboardButtonProperties } from "./Clipboard.contracts";

type ButtonProperties = {
	variant?: ButtonVariant;
	size?: Size;
} & React.ButtonHTMLAttributes<any>;
const StyledButton = styled.button<ButtonProperties>(getStyles);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ClipboardButton = ({ data, variant, options, children, ...properties }: ClipboardButtonProperties) => {
	const [hasCopied, copy] = useClipboard({
		resetAfter: 1000,
		...options,
	});

	return (
		<div className="relative">
			<StyledButton
				type="button"
				variant="secondary"
				onClick={() => copy(data)}
				data-testid="clipboard-button__wrapper"
				{...properties}
			>
				<div className="flex items-center space-x-2">{children}</div>
			</StyledButton>

			<AnimatePresence>
				{hasCopied && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1, transition: { duration: 0.3 } }}
						exit={{ opacity: 0, transition: { duration: 0.3 } }}
						className="flex absolute inset-0 justify-center items-center rounded bg-theme-primary-100 dark:bg-theme-secondary-800"
						data-testid="clipboard-button__checkmark"
					>
						<Icon name="Checkmark" className="text-theme-primary-600 dark:text-theme-secondary-200" />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
