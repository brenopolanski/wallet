import { DateTime } from "@payvo/sdk-intl";
import { images } from "app/assets/images";
import { CircularProgressBar } from "app/components/CircularProgressBar";
import { Divider } from "app/components/Divider";
import { Image } from "app/components/Image";
import { Page, Section } from "app/components/Layout";
import React from "react";
import { useTranslation } from "react-i18next";
import tw, { styled } from "twin.macro";
import { shouldUseDarkColors } from "utils/electron-utils";

// eslint-disable-next-line import/no-relative-parent-imports
import { version } from "../../../../../package.json";

const { PayvoLogo } = images.common;

const LogoContainer = styled.div`
	${tw`flex items-center justify-center w-5 h-5 mr-2 pl-px rounded text-theme-background bg-theme-secondary-500 dark:bg-theme-secondary-700`};
`;

export const Splash = ({ year }: any) => {
	const { t } = useTranslation();

	const currentYear = year || DateTime.make().format("YYYY");

	return (
		<Page navbarVariant="logo-only">
			<Section className="flex flex-col flex-1 justify-center text-center select-none">
				<div className="flex justify-center mx-auto max-w-md">
					<Image name="WelcomeBanner" />
				</div>

				<div data-testid="Splash__text" className="mt-8">
					<h1 className="text-4xl font-extrabold">{t("SPLASH.BRAND")}</h1>
					<p className="animate-pulse text-theme-secondary-text">{t("SPLASH.LOADING")}</p>
					<div className="flex justify-center mt-4">
						<div className="animate-spin">
							<CircularProgressBar
								showValue={false}
								value={20}
								strokeColor={
									shouldUseDarkColors()
										? "var(--theme-color-secondary-800)"
										: "var(--theme-color-success-200)"
								}
								strokeWidth={2}
								size={40}
								progressColor="var(--theme-color-primary-600)"
							/>
						</div>
					</div>
				</div>
				<div
					data-testid="Splash__footer"
					className="flex fixed right-0 left-0 bottom-5 justify-center items-center text-xs font-semibold text-theme-secondary-500 dark:text-theme-secondary-700"
				>
					<div>
						{currentYear} {t("SPLASH.COPYRIGHT")}
					</div>

					<Divider type="vertical" />

					<div>{t("SPLASH.RIGHTS")}</div>

					<Divider type="vertical" />

					<LogoContainer>
						<PayvoLogo height={12} />
					</LogoContainer>

					<div>{t("SPLASH.PRODUCT")}</div>

					<Divider type="vertical" />

					<div>
						{t("SPLASH.VERSION")} {version}
					</div>
				</div>
			</Section>
		</Page>
	);
};
