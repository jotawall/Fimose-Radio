const Discord = require("discord.js");
const config = require("./config.json");
const ytdl = require("ytdl-core");
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_BANS", "GUILD_EMOJIS_AND_STICKERS", "GUILD_INTEGRATIONS", "GUILD_WEBHOOKS", "GUILD_INVITES", "GUILD_VOICE_STATES", "GUILD_PRESENCES", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGE_TYPING", "DIRECT_MESSAGE_REACTIONS", "DIRECT_MESSAGE_TYPING", "GUILD_MESSAGES", "DIRECT_MESSAGES"], partials: ["CHANNEL"] });
const { getVoiceConnection, joinVoiceChannel, AudioPlayerStatus, createAudioResource, getNextResource, createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice');

client.once("ready", () => {
    console.log("Acordei seu porra, bota uma uma opening foda de anime aí cacete");
    client.user.setActivity('VAMO BOTAR PRA FUDÊ NESSA PORRA', { type: 'WATCHING' });
    client.user.setStatus('dnd');
});
client.on("error", error => {
    console.log(error);
    return;
});

const queue = new Map();

client.once("ready", () => {
  console.log("Tô pronto porra.");
});

client.once("reconnecting", () => {
  console.log("Tô reconectando.");
});

client.once("disconnect", () => {
  console.log("Tô disconectado.");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${config.prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${config.prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${config.prefix}stop`)) {
    stop(message, serverQueue);
    return;
    } else {
    message.channel.send("Coloca um comando válido né seu desgraçado.");
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "Você tem que estar num canal de voz, seu o burro."
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "Eu preciso de permissão pra entrar aí né cacete."
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
   };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`**${song.title}** foi adicionado na fila dessa porra.`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Você tem que estar num canal de voz pra poder parar essa porra."
    );
  if (!serverQueue)
    return message.channel.send("Não tem música nenhum pra pular, gênio.");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Você tem que estar num canal de voz pra eu poder parar, ô Sherlock."
    );
    
  if (!serverQueue)
    return message.channel.send("Não tem música pra parar, ô porra.");
    
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`A música que tá tocando nessa porra é: **${song.title}**`);
}

client.login(config.token);