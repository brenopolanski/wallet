import { Slider } from "app/components/Slider";
import { WalletCard } from "app/components/WalletCard";
import React, { memo } from "react";

import { WalletGridProperties } from "./Wallets.contracts";

export const WalletsGrid = memo(
	({ actions, onWalletAction, isVisible, isLoading, wallets, sliderOptions }: WalletGridProperties) => {
		if (!isVisible) {
			return <></>;
		}

		const skeletonSlides = Array.from({ length: 3 }).fill({});
		const data = isLoading ? skeletonSlides : wallets;

		return (
			<div data-testid="WalletsGrid" className="w-full">
				<Slider data={data} options={sliderOptions}>
					{(walletData: any) => (
						<WalletCard
							{...walletData}
							actions={actions}
							onWalletAction={onWalletAction}
							isLoading={isLoading}
							className="w-full"
						/>
					)}
				</Slider>
			</div>
		);
	},
);

WalletsGrid.displayName = "WalletsGrid";
