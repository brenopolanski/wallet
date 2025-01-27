import { ControlButton } from "app/components/ControlButton";
import { Icon } from "app/components/Icon";
import { Input } from "app/components/Input";
import { clickOutsideHandler, useDebounce } from "app/hooks";
import cn from "classnames";
import React, { ChangeEvent, FC, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import tw, { styled } from "twin.macro";

import { HeaderSearchBarProperties } from "./HeaderSearchBar.contracts";

const SearchBarInputWrapper = styled.div`
	${tw`min-width[448px] dark:border dark:border-theme-secondary-800`}
`;

export const HeaderSearchBar: FC<HeaderSearchBarProperties> = ({
	offsetClassName,
	placeholder,
	label = "Search",
	noToggleBorder,
	onSearch,
	extra,
	maxLength,
	onReset,
	defaultQuery = "",
	debounceTimeout = 500,
	resetFields = false,
}) => {
	const { t } = useTranslation();

	const [searchbarVisible, setSearchbarVisible] = useState(false);
	const [query, setQuery] = useState(defaultQuery);

	const reference = useRef(null);
	useEffect(() => clickOutsideHandler(reference, () => setSearchbarVisible(false)), [reference]);

	const [debouncedQuery] = useDebounce(query, debounceTimeout);
	useEffect(() => onSearch?.(debouncedQuery), [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleQueryReset = useCallback(() => {
		setQuery("");
		onReset?.();
	}, [onReset]);

	useEffect(() => {
		if (resetFields) {
			handleQueryReset();
		}
	}, [resetFields, handleQueryReset]);

	return (
		<div data-testid="HeaderSearchBar" className="relative">
			<ControlButton
				isChanged={!!query}
				noBorder={noToggleBorder}
				onClick={() => setSearchbarVisible(true)}
				type="button"
			>
				<div className="flex items-center space-x-3 h-5">
					<span>{label}</span>
					<Icon name="MagnifyingGlass" size="lg" />
				</div>
			</ControlButton>

			{searchbarVisible && (
				<SearchBarInputWrapper
					data-testid="HeaderSearchBar__input"
					ref={reference}
					className={cn(
						"absolute z-20 flex items-center text-base px-10 -mx-10 py-4 rounded-lg shadow-xl bg-theme-background transform",
						offsetClassName || "top-1/2 -translate-y-1/2",
						{
							"right-0": noToggleBorder,
							"right-3": !noToggleBorder,
						},
					)}
				>
					{extra && (
						<div className="flex items-center">
							<div>{extra}</div>
							<div className="mr-8 h-10 border-l border-theme-secondary-300 dark:border-theme-secondary-800" />
						</div>
					)}

					<button
						data-testid="header-search-bar__reset"
						className={cn("focus:outline-none transition-all duration-300", { "mr-4": query !== "" })}
						onClick={handleQueryReset}
						type="button"
					>
						<Icon
							className={cn(
								"text-theme-text transition-all duration-300",
								{ "w-0": query === "" },
								{ "w-4": query !== "" },
							)}
							name="Cross"
							size="md"
						/>
					</button>

					<div className="flex-1">
						<Input
							className="-ml-4"
							placeholder={placeholder || `${t("COMMON.SEARCH")}...`}
							value={query}
							maxLength={maxLength}
							isFocused
							ignoreContext
							onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
							noBorder
							noShadow
						/>
					</div>

					<Icon
						className="text-theme-primary-300 dark:text-theme-secondary-600"
						name="MagnifyingGlass"
						size="lg"
					/>
				</SearchBarInputWrapper>
			)}
		</div>
	);
};
