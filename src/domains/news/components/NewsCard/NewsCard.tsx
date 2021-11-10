import { BlockfolioSignal as FTXSignal } from "@payvo/news";
import { Networks } from "@payvo/sdk";
import { Card } from "app/components/Card";
import { Divider } from "app/components/Divider";
import { Label } from "app/components/Label";
import { Link } from "app/components/Link";
import { TimeAgo } from "app/components/TimeAgo";
import { useEnvironmentContext } from "app/contexts";
import { NetworkIcon } from "domains/network/components/NetworkIcon";
import { AvailableNewsCategories } from "domains/news/news.contracts";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Linkify from "react-linkify";
import { assertNetwork } from "utils/assertions";

type Properties = {
	coverImage?: string;
} & FTXSignal;

export const NewsCard = ({ text, category, author, created_at: createdAt, coverImage }: Properties) => {
	const { env } = useEnvironmentContext();
	const { t } = useTranslation();

	const network = useMemo(
		() =>
			env
				.availableNetworks()
				.find((network: Networks.Network) => network.isLive() && author.coin === network.coin()),
		[author, env],
	);

	assertNetwork(network);

	return (
		<div data-testid="NewsCard">
			<Card className="bg-theme-background">
				<div className="flex flex-col p-5 space-y-6 bg-theme-background">
					<div className="flex justify-between w-full">
						<div className="flex items-center space-x-4">
							<NetworkIcon network={network} size="lg" noShadow />

							<div>
								<h4 className="text-lg font-semibold" data-testid={`NewsCard__asset-${network.coin()}`}>
									{network.coin()}
								</h4>
								<div className="flex items-center space-x-4">
									<p
										className="text-sm font-semibold text-theme-secondary-500 dark:text-theme-secondary-700"
										data-testid="NewsCard__author"
									>
										{author.name}, {author.title}
									</p>

									<Divider type="vertical" />

									<p
										className="text-sm font-semibold text-theme-secondary-500 dark:text-theme-secondary-700"
										data-testid="NewsCard__date-created"
									>
										<TimeAgo date={createdAt} />
									</p>
								</div>
							</div>
						</div>

						<div className="flex flex-col justify-end">
							<Label color="warning" variant="solid">
								<span className="text-sm mx-1" data-testid="NewsCard__category">
									#{t(`NEWS.CATEGORIES.${(category as AvailableNewsCategories).toUpperCase()}`)}
								</span>
							</Label>
						</div>
					</div>

					<Divider />

					<div className="whitespace-pre-line text-theme-secondary-text" data-testid="NewsCard__content">
						<Linkify
							componentDecorator={(pathname: string, text: string, key: number) => (
								<Link to={pathname} key={key} isExternal>
									{text}
								</Link>
							)}
						>
							{text}
						</Linkify>
					</div>

					{coverImage && (
						<div className="flex justify-center p-1 -mx-10 border-t-2 border-theme-primary-100 dark:border-theme-secondary-800">
							<img src={coverImage} alt="Payvo Banner" />
						</div>
					)}
				</div>
			</Card>
		</div>
	);
};
