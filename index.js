const discord = require("discord.js");
const fs = require("fs");

discord.login(config.discordtoken);

discord.on('ready',function(){
	console.log("Bot is online!");
})