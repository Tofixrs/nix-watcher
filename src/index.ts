import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { Sern, single, makeDependencies } from "@sern/handler";
import { Octokit } from "@octokit/rest";

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN,
});

/**
 * Where all of your dependencies are composed.
 * '@sern/client' is usually your Discord Client.
 * Use this function to access all of your dependencies.
 * This is used for external event modules as well
 */
await makeDependencies(({ add }) => {
	add(
		"@sern/client",
		single(() => client),
	);
	add(
		"octokit",
		single(() => octokit),
	);
});

//View docs for all options
Sern.init({
	commands: "dist/commands",
	events: "dist/events", //(optional)
});

await client.login(process.env.TOKEN);
