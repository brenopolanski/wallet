import { Coins, Networks } from "@payvo/sdk";
// import { ADA } from "@payvo/sdk-ada";
import { ARK } from "@payvo/sdk-ark";
// import { ATOM } from "@payvo/sdk-atom";
// import { BTC } from "@payvo/sdk-btc";
// import { EGLD } from "@payvo/sdk-egld";
// import { ETH } from "@payvo/sdk-eth";
import { LSK } from "@payvo/sdk-lsk";
// import { NEO } from "@payvo/sdk-neo";
// import { TRX } from "@payvo/sdk-trx";
// import { XLM } from "@payvo/sdk-xlm";
// import { XRP } from "@payvo/sdk-xrp";
// import { ZIL } from "@payvo/sdk-zil";

const createNetwork = (coin: Coins.CoinBundle, network: string) =>
	new Networks.Network(coin.manifest, coin.manifest.networks[network]);

export const availableNetworksMock: Networks.Network[] = [
	// createNetwork(ADA, "ada.mainnet"),
	// createNetwork(ADA, "ada.testnet"),
	createNetwork(ARK, "ark.mainnet"),
	createNetwork(ARK, "ark.devnet"),
	createNetwork(ARK, "bind.mainnet"),
	createNetwork(ARK, "bind.testnet"),
	// createNetwork(ATOM, "atom.mainnet"),
	// createNetwork(ATOM, "atom.testnet"),
	// createNetwork(BTC, "btc.livenet"),
	// createNetwork(BTC, "btc.testnet"),
	// createNetwork(EGLD, "egld.mainnet"),
	// createNetwork(EGLD, "egld.testnet"),
	// createNetwork(ETH, "eth.mainnet"),
	// createNetwork(ETH, "eth.rinkeby"),
	// createNetwork(ETH, "eth.ropsten"),
	// createNetwork(LSK, "lsk.mainnet"),
	createNetwork(LSK, "lsk.testnet"),
	// createNetwork(NEO, "neo.mainnet"),
	// createNetwork(NEO, "neo.testnet"),
	// createNetwork(TRX, "trx.mainnet"),
	// createNetwork(TRX, "trx.testnet"),
	// createNetwork(XLM, "xlm.mainnet"),
	// createNetwork(XLM, "xlm.testnet"),
	// createNetwork(XRP, "xrp.mainnet"),
	// createNetwork(XRP, "xrp.testnet"),
	// createNetwork(ZIL, "zil.mainnet"),
	// createNetwork(ZIL, "zil.testnet"),
];
