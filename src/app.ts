import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Network, TurbosSdk } from "turbos-clmm-sdk";

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import "dotenv/config";
import { MIST_PER_SUI } from "@mysten/sui/utils";

const sdk = new TurbosSdk(Network.devnet);

const tokenA = "0x2::sui::SUI";
const tokenB =
	"0xf427e3a0f0817f5425c091d323941c4be96e272cc895787bd6f910c2ffd66a90::usdc::USDC";

const fee =
	"0x800d280a8c03db824964d49e76fc8504c10c2d63b81c962af287e1157f15c920::fee3000bps::FEE3000BPS";

const main = async () => {
	const client = new SuiClient({
		url: getFullnodeUrl("testnet"),
	});

	const senderKeypair = decodeSuiPrivateKey(process.env.KEY as string);

	const signer = Ed25519Keypair.fromSecretKey(senderKeypair.secretKey);
	const receiver = signer.toSuiAddress();

	const pools = await sdk.pool.getPools();

	const pool = pools.filter(
		(p) => p.types.indexOf(tokenB) != -1 && p.types.indexOf(tokenA) != -1
	);

	console.log("Total matching pools: ", pool.length);

	const p = pool.filter((p) => p.types.includes(fee))[0];

	console.log("Pool Id: ", p.objectId);

	const swapResult = await sdk.trade.computeSwapResultV2({
		address: receiver,
		amountSpecifiedIsInput: true,
		pools: [
			{
				a2b: true,
				amountSpecified: MIST_PER_SUI.toString(),
				pool: p.objectId,
			},
		],
	});

	const nextTickIndex = sdk.math.bitsToNumber(
		swapResult[0].tick_current_index.bits
	);

	const routes = [
		{
			pool: p.objectId,
			a2b: true,
			nextTickIndex,
		},
	];

	console.log(swapResult);

	const tx = await sdk.trade.swap({
		routes,
		coinTypeA: tokenA,
		coinTypeB: tokenB,
		amountA: swapResult[0].amount_a,
		amountB: swapResult[0].amount_b,
		amountSpecifiedIsInput: true,
		slippage: "0.2",
		address: receiver,
	});

	const res = await client.signAndExecuteTransaction({
		transaction: tx,
		signer,
		options: {
			showEffects: true,
		},
	});

	const receipt = await client.waitForTransaction({
		digest: res.digest,
	});

	console.log("Transaction Executed: ", receipt);
};

main();
