import { EmptyBlock } from "app/components/EmptyBlock";
import { ExchangeCard, ExchangeCardSkeleton } from "domains/exchange/components/ExchangeCard";
import { Exchange } from "domains/exchange/contracts";
import React from "react";
import { useTranslation } from "react-i18next";

interface ExchangeGridProperties {
	exchanges: Exchange[];
	isLoading: boolean;
	onClick: (exchangeId: string) => void;
}

export const ExchangeGrid = ({ exchanges, isLoading, onClick }: ExchangeGridProperties) => {
	const { t } = useTranslation();

	if (isLoading) {
		return (
			<div data-testid="ExchangeGrid">
				<div className="grid grid-cols-3 w-full gap-4.5">
					{Array.from({ length: 3 }).map((_, index) => (
						<ExchangeCardSkeleton key={index} />
					))}
				</div>
			</div>
		);
	}

	if (exchanges.length === 0) {
		return (
			<EmptyBlock data-testid="ExchangeGrid__empty-message">
				{t("EXCHANGE.PAGE_EXCHANGES.EMPTY_MESSAGE")}
			</EmptyBlock>
		);
	}

	return (
		<div data-testid="ExchangeGrid" className="grid grid-cols-3 w-full gap-4.5">
			{exchanges.map((exchange: Exchange) => (
				<ExchangeCard key={exchange.slug} exchange={exchange} onClick={() => onClick(exchange.slug)} />
			))}
		</div>
	);
};
