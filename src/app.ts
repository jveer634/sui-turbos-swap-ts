import { MIST_PER_SUI } from "@mysten/sui/utils";
import { Fee, getFeeType, Mode, setUp } from "./utils";

const tokenA = "0x2::sui::SUI";
const tokenB =
	"0xf427e3a0f0817f5425c091d323941c4be96e272cc895787bd6f910c2ffd66a90::usdc::USDC";

const main = async () => {
	const { sdk, client, signer } = setUp(Mode.Development);
	const receiver = signer.toSuiAddress();
	const pools = await sdk.pool.getPools();

	const fee = getFeeType(Mode.Development, Fee["3000BPS"]);

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

	console.log("Calculated swap result is: ", swapResult);

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
