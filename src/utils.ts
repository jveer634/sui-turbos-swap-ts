import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Network, TurbosSdk } from "turbos-clmm-sdk";

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import "dotenv/config";

export enum Mode {
	"Production",
	"Development",
}

export enum Fee {
	"100BPS" = "100BPS",
	"500BPS" = "500BPS",
	"3000BPS" = "3000BPS",
	"10000BPS" = "10000BPS",
}

// NOTE: Here I am only considering ED25519 Private Key, change it accordingly to your requirement
export const setUp = (mode: Mode) => {
	let sdk: TurbosSdk;
	let client: SuiClient;

	if (mode == Mode.Development) {
		sdk = new TurbosSdk(Network.devnet);
		client = new SuiClient({
			url: getFullnodeUrl("testnet"),
		});
	} else {
		sdk = new TurbosSdk(Network.mainnet);
		client = new SuiClient({
			url: getFullnodeUrl("mainnet"),
		});
	}

	const senderKeypair = decodeSuiPrivateKey(process.env.KEY as string);
	const signer = Ed25519Keypair.fromSecretKey(senderKeypair.secretKey);

	return { sdk, client, signer };
};

// Helper function to get the Fee type
export const getFeeType = (mode: Mode, fee: Fee) => {
	if (mode == Mode.Development) {
		return `0x800d280a8c03db824964d49e76fc8504c10c2d63b81c962af287e1157f15c920::fee${fee
			.toString()
			.toLowerCase()}::FEE${fee.toString().toUpperCase()}`;
	} else {
		return `0x84d1ad43e95e9833670fcdb2f2d9fb7618fe1827e3908f2c2bb842f3dccb80af::fee${fee
			.toString()
			.toLowerCase()}::FEE${fee.toString().toUpperCase()}`;
	}
};
