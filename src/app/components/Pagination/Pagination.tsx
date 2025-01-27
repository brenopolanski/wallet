import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import cn from "classnames";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { styled } from "twin.macro";

import { PaginationProperties } from "./Pagination.models";
import { PaginationButton, PaginationWrapper } from "./Pagination.styles";
import { PaginationSearch } from "./PaginationSearch";

const Wrapper = styled.nav`
	${PaginationWrapper}
`;

const PaginationButtonStyled = styled.button`
	${PaginationButton}
`;

const Pagination = ({
	totalCount,
	itemsPerPage = 4,
	onSelectPage,
	currentPage = 1,
	className,
}: PaginationProperties) => {
	const [buttonsDisabled, setButtonsDisabled] = useState(false);

	const { t } = useTranslation();

	const totalPages = Math.ceil(totalCount / itemsPerPage);

	const buttonCount = useMemo(() => (currentPage < 100 ? 7 : 5), [currentPage]);
	const subRangeLength = useMemo(() => Math.floor(buttonCount / 2), [buttonCount]);

	const paginationButtons = useMemo(() => {
		let buttons;

		if (totalPages <= buttonCount) {
			buttons = Array.from({ length: totalPages }).map((_, index) => index + 1);
		} else if (currentPage <= subRangeLength + 1) {
			buttons = Array.from({ length: buttonCount }).map((_, index) => index + 1);
		} else if (currentPage >= totalPages - subRangeLength) {
			buttons = Array.from({ length: buttonCount }).map((_, index) => totalPages - buttonCount + index + 1);
		} else {
			buttons = Array.from({ length: buttonCount }).map((_, index) => currentPage - subRangeLength + index);
		}

		return buttons;
	}, [currentPage, totalPages, buttonCount, subRangeLength]);

	const showFirst = useMemo(() => !paginationButtons.includes(1), [paginationButtons]);
	const showPrevious = useMemo(() => currentPage > 1, [currentPage]);
	const showNext = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
	const showLast = useMemo(
		() => totalPages !== currentPage + 1 && !paginationButtons.includes(totalPages),
		[currentPage, totalPages, paginationButtons],
	);

	if (totalPages <= 1) {
		return <></>;
	}

	const handleSelectPage = (page?: number) => {
		setButtonsDisabled(false);

		if (page) {
			onSelectPage(page);
		}
	};

	return (
		<Wrapper data-testid="Pagination" className={className}>
			{showFirst && (
				<Button
					data-testid="Pagination__first"
					variant="secondary"
					onClick={() => onSelectPage((currentPage = 1))}
				>
					<Icon name="DoubleChevronLeftSmall" size="sm" />
				</Button>
			)}

			{showPrevious && (
				<Button
					data-testid="Pagination__previous"
					variant="secondary"
					onClick={() => onSelectPage((currentPage -= 1))}
				>
					<Icon name="ChevronLeftSmall" className="mr-2" size="sm" />
					{t("COMMON.PREVIOUS")}
				</Button>
			)}

			<div className="flex relative px-2 rounded bg-theme-primary-100 dark:bg-theme-secondary-800">
				{paginationButtons[0] !== 1 && (
					<PaginationSearch
						onClick={() => setButtonsDisabled(true)}
						onSelectPage={handleSelectPage}
						totalPages={totalPages}
						isDisabled={buttonsDisabled}
					>
						<span>…</span>
					</PaginationSearch>
				)}

				{paginationButtons.map((page) => (
					<PaginationButtonStyled
						key={page}
						type="button"
						aria-current={currentPage === page || undefined}
						aria-label={t("COMMON.PAGE_#", { page })}
						disabled={buttonsDisabled}
						className={cn({ "current-page": currentPage === page })}
						onClick={() => onSelectPage(page)}
					>
						{page}
					</PaginationButtonStyled>
				))}

				{paginationButtons[paginationButtons.length - 1] !== totalPages && (
					<PaginationSearch
						onClick={() => setButtonsDisabled(true)}
						onSelectPage={handleSelectPage}
						totalPages={totalPages}
						isDisabled={buttonsDisabled}
					>
						<span>…</span>
					</PaginationSearch>
				)}
			</div>

			{showNext && (
				<Button
					data-testid="Pagination__next"
					variant="secondary"
					onClick={() => onSelectPage((currentPage += 1))}
				>
					{t("COMMON.NEXT")}
					<Icon name="ChevronRightSmall" className="ml-2" size="sm" />
				</Button>
			)}

			{showLast && (
				<Button
					data-testid="Pagination__last"
					variant="secondary"
					onClick={() => onSelectPage((currentPage = totalPages))}
				>
					<Icon name="DoubleChevronRightSmall" size="sm" />
				</Button>
			)}
		</Wrapper>
	);
};

export { Pagination };
