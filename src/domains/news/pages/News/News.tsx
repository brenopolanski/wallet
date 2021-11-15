import { Blockfolio as FTX, BlockfolioResponse as FTXResponse, BlockfolioSignal as FTXSignal } from "@payvo/sdk-news";
import { Contracts } from "@payvo/sdk-profiles";
import { SvgCollection } from "app/assets/svg";
import { EmptyResults } from "app/components/EmptyResults";
import { Header } from "app/components/Header";
import { HeaderSearchBar } from "app/components/Header/HeaderSearchBar";
import { Page, Section } from "app/components/Layout";
import { Pagination } from "app/components/Pagination";
import { useEnvironmentContext } from "app/contexts";
import { useActiveProfile } from "app/hooks";
import { httpClient, toasts } from "app/services";
import { FTXAd } from "domains/news/components/FTXAd";
import { NewsCard, NewsCardSkeleton } from "domains/news/components/NewsCard";
import { NewsOptions } from "domains/news/components/NewsOptions";
import { AVAILABLE_CATEGORIES } from "domains/news/news.constants";
import { AvailableNewsCategories } from "domains/news/news.contracts";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface NewsFilters {
	categories: AvailableNewsCategories[];
	coins: string[];
	searchQuery?: string;
}

interface Properties {
	itemsPerPage?: number;
}

export const News = ({ itemsPerPage = 15 }: Properties) => {
	const activeProfile = useActiveProfile();
	const { persist } = useEnvironmentContext();

	const [isLoading, setIsLoading] = useState(true);
	const [ftx] = useState(() => new FTX(httpClient));

	const [totalCount, setTotalCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);

	const [searchQuery, setSearchQuery] = useState("");

	const [{ categories, coins }, setFilters] = useState<NewsFilters>(() => {
		let initialFilters: NewsFilters;

		try {
			// @ts-ignore
			initialFilters = JSON.parse(activeProfile.settings().get(Contracts.ProfileSetting.NewsFilters));
		} catch {
			initialFilters = { categories: [], coins: ["ARK"] };
		}

		return initialFilters;
	});

	const [news, setNews] = useState<FTXSignal[]>([]);

	const skeletonCards = Array.from({ length: 8 }).fill({});

	const { t } = useTranslation();

	useEffect(() => window.scrollTo({ behavior: "smooth", top: 0 }), [currentPage, coins]);

	useEffect(() => {
		const fetchNews = async () => {
			setIsLoading(true);
			setNews([]);

			if (categories.length > 0 && coins.length > 0) {
				const query = {
					coins,
					page: currentPage,
					...(categories.length && categories.length !== AVAILABLE_CATEGORIES.length && { categories }),
					...(searchQuery && { query: searchQuery }),
				};

				try {
					const { data, meta }: FTXResponse = await ftx.findByCoin(query);

					setNews(data);
					setTotalCount(meta.total);
				} catch {
					toasts.error(t("NEWS.PAGE_NEWS.ERRORS.NETWORK_ERROR"));
				}
			}

			setIsLoading(false);
		};

		fetchNews();
	}, [ftx, currentPage, categories, coins, searchQuery, t]);

	useEffect(() => {
		const updateSettings = async () => {
			activeProfile.settings().set(Contracts.ProfileSetting.NewsFilters, JSON.stringify({ categories, coins }));
			await persist();
		};

		updateSettings();
	}, [activeProfile, categories, coins, persist]);

	const handleSelectPage = (page: number) => {
		setCurrentPage(page);
	};

	const handleFilterSubmit = useCallback((data: any) => {
		setCurrentPage(1);
		setFilters(data);
	}, []);

	return (
		<Page isBackDisabled={true}>
			<Section backgroundClassName="bg-theme-background">
				<Header
					title={t("NEWS.PAGE_NEWS.TITLE")}
					subtitle={
						<div className="flex items-center space-x-2">
							<span className="font-semibold text-theme-secondary-text">
								{t("NEWS.PAGE_NEWS.POWERED_BY")}
							</span>
							<SvgCollection.FTX width={65} height={20} className="text-theme-text" />
						</div>
					}
					extra={
						<HeaderSearchBar
							label={t("COMMON.SEARCH")}
							onSearch={(query) => setSearchQuery(query)}
							resetFields={searchQuery === ""}
							maxLength={32}
						/>
					}
				/>
			</Section>

			<Section className="flex-1" backgroundClassName="bg-theme-secondary-background">
				<div className="container flex space-x-5 xl:space-x-8">
					<div className="flex-none w-2/3">
						{isLoading && (
							<div className="space-y-5">
								{skeletonCards.map((_, key: number) => (
									<NewsCardSkeleton key={key} />
								))}
							</div>
						)}

						{!isLoading && news.length === 0 && (
							<EmptyResults
								className="rounded-lg border-2 border-theme-primary-100 dark:border-theme-secondary-800"
								title={t("COMMON.EMPTY_RESULTS.TITLE")}
								subtitle={t("COMMON.EMPTY_RESULTS.SUBTITLE")}
							/>
						)}

						{!isLoading && news.length > 0 && (
							<>
								<div className="space-y-5">
									{news.map((data, index) => (
										<NewsCard key={index} {...data} />
									))}

									<FTXAd />
								</div>

								<div className="flex justify-center mt-10 w-full">
									<Pagination
										totalCount={totalCount}
										itemsPerPage={itemsPerPage}
										onSelectPage={handleSelectPage}
										currentPage={currentPage}
									/>
								</div>
							</>
						)}
					</div>
					<div className="relative w-1/3">
						<NewsOptions
							selectedCategories={categories}
							selectedCoins={coins}
							onSubmit={handleFilterSubmit}
						/>
					</div>
				</div>
			</Section>
		</Page>
	);
};
