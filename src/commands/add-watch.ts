import { commandModule, CommandType } from "@sern/handler";
import { ApplicationCommandOptionType, ChannelType } from "discord.js";
import { publish } from "../plugins/publish.js";

export default commandModule({
	type: CommandType.Slash,
	plugins: [publish()],
	description: "Adds a watched pr",
	options: [
		{
			name: "pr-num",
			description: "number tp the pr to watch",
			type: ApplicationCommandOptionType.Integer,
			required: true,
		},
	],
	//alias : [],
	execute: async (ctx, args) => {
		if (ctx.channel?.type != ChannelType.GuildText)
			return ctx.reply("Not a text channel");

		const prNum = ctx.interaction.options.getInteger("pr-num", true);
		const thread = await ctx.channel.threads.create({
			name: `nix-watch: #${prNum}`,
		});

		await thread.members.add(ctx.user.id);

		await ctx.reply({ content: `Done <#${thread.id}>`, ephemeral: true });
	},
});
