import { Octokit } from "@octokit/rest";
import { EventType, Service, eventModule } from "@sern/handler";
import axios from "axios";
import { AnyThreadChannel, FetchedThreads } from "discord.js";
import { parse } from "node-html-parser";

const second = 1000;
const minute = 60 * second;

export default eventModule({
	type: EventType.Discord,
	name: "ready",
	execute: async () => {
		setInterval(checkPrs, 5 * minute);
	},
});

async function checkPrs() {
	const client = Service("@sern/client");
	const octokit = Service("octokit");

	const guilds = await Promise.all(
		(await client.guilds.fetch()).map((g) => g.fetch()),
	);

	const threads = (
		await Promise.all(guilds.map((g) => g.channels.fetchActiveThreads()))
	)
		.map((t) => t.threads)
		.map((t) => t.toJSON())
		.flat()
		.filter((t) => !t.locked)
		.filter((t) => t.name.startsWith("nix-watch"));

	for (const thread of threads) {
		//Check if the pr is not merged
		if (thread.name.startsWith("nix-watch:")) {
			await handleNotMerged(octokit, thread);
		}

		//Check if the pr has been merged
		if (thread.name.startsWith("nix-watch-merged:")) {
			await handleMerged(thread);
		}
	}
}

async function handleNotMerged(octokit: Octokit, thread: AnyThreadChannel) {
	const prNum = Number(thread.name.substring(12)); // start-pos: length of "nix-watch: #" - 1 cuz index starts at 0

	const pulled =
		(await octokit.rest.pulls
			.checkIfMerged({
				owner: "NixOS",
				repo: "nixpkgs",
				pull_number: prNum,
			})
			.then((r) => r.status)
			.catch(() => 404)) == 204;

	if (pulled) {
		await Promise.all([
			thread.send(
				`Pr has been merged https://github.com/NixOS/nixpkgs/pull/${prNum}`,
			),
			thread.send(
				`Switching to checking: https://nixpk.gs/pr-tracker.html?pr=${prNum}`,
			),
			thread.setName(`nix-watch-merged: #${prNum}`),
		]);
	}
}

async function handleMerged(thread: AnyThreadChannel) {
	const prNum = Number(thread.name.substring(19)); // start-pos: length of "nix-watch-merged: #" - 1 cuz index starts at 0
	const res = await axios.get(`https://nixpk.gs/pr-tracker.html`, {
		responseType: "document",
		params: {
			pr: prNum,
		},
	});
	const document = parse(res.data);
	const acceptedToBranch = document.querySelectorAll("span.state-accepted+a");

	for (const a of acceptedToBranch) {
		if (a.innerText == "nixos-unstable") {
			await Promise.all([
				thread.send("Pr made its way to unstable"),
				thread.setName(`nix-watch-in-unstable: #${prNum}`),
			]);
			thread.setLocked(true);
			return;
		}
	}
}
