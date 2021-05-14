const Discord = require("discord.js");
const fs = require('fs');
const config = require("./config.json");
var wavConverter = require('wav-converter')
const client = new Discord.Client();
let fileName;
let message;

const express = require('express');
const app = express();
app.set('port', (8081));
app.use(express.static(__dirname + '/static'));
app.set('views', __dirname + '/static/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.get('/user/:id', function(req, res) {
  res.render("discord.html");
});

app.get('/fetchstart', function(req, res) {
  startRecording(message);
});

app.get('/fetchstop', function(req, res) {
  stopRecording(message);
});

app.listen(app.get("port"), function() {
    console.log(`Web server listening on port ${app.get("port")}`)
});

function generateOutputFileName(){
  let date_ob = new Date(Date.now());
  const fileName = `${date_ob.getSeconds()}-${date_ob.getMinutes()}-${date_ob.getHours()}-${date_ob.getDay()}-${date_ob.getDate()}-${date_ob.getFullYear()}`;
  return fileName;
}

function generateOutputFile(fileName) {
  return fs.createWriteStream(`./raw_recordings/${fileName}.pcm`);
}

function convertRawData(fileName){
  var pcmData = fs.readFileSync(`./raw_recordings/${fileName}`);
  var wavData = wavConverter.encodeWav(pcmData, {
    numChannels: 2,
    sampleRate: 48000,
    byteRate: 16
  })
  fs.writeFileSync(`./${fileName}.wav`, wavData)
}
let allMembers;
let totalMembers;
let allUserid = [];
let mainChannel;
let recordingChannel;

client.on('message', (msg, user) => {
  if (msg.content.startsWith(".startUI")) {
    let [command, ...channelName] = msg.content.split(" ");
    msg.reply(`Go to this link: https://istifaa.com/user/${msg.author.id}`);
    message = msg;
    mainChannel = msg.member.voice.channel;
    recordingChannel = msg.member.voice.channel.id;
    allMembers = msg.member.voice.channel.members;
  }
});
var AudioMixer = require('audio-mixer');

let mixer = new AudioMixer.Mixer({
    channels: 2,
    bitDepth: 16,
    sampleRate: 48000
});

let connection;
client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.channelID === null){
      if(newState.member.user.bot) return;
      console.log(`${oldState.member.user.username} joined the voice channel`, newState.channelID);
      if(newState.channelID == recordingChannel){
        let tempInput = new AudioMixer.Input({
            channels: 2,
            bitDepth: 16,
            sampleRate: 48000,
            volume: 100
        });
        mixer.addInput(tempInput);
        try{
          connection.receiver.createStream(oldState.member.user.id, { mode: "pcm", end: "manual"}).pipe(tempInput);
        }catch(err){
          console.log(err);
        }
      }
    }
});

function createStreams(connection){
  for(i=0;i<allUserid.length;i++){
    if(allUserid[i] == "396453448024981516"){
    }else{
      let tempInput = new AudioMixer.Input({
          channels: 2,
          bitDepth: 16,
          sampleRate: 48000,
          volume: 100
      });
      mixer.addInput(tempInput);
      connection.receiver.createStream(allUserid[i], { mode: "pcm", end: "manual"}).pipe(tempInput);
    }
  }
}

function startRecording(msg){
  allUserid = [];
  totalMembers = allMembers.array().length;
  // console.log(allMembers);
  client.guilds.fetch("608510611034472448").me.voice.setDeaf(false);
  for(i = 0;i < allMembers.array().length; i++){
    let botcheck = false;
    if(allMembers.array()[i].user.bot){
      botcheck = true;
    }
    allUserid.push(allMembers.array()[i].user.id);
    // console.log(`${allMembers.array()[i].user.username} - Bot:${botcheck}`);
  }
  mainChannel.join().then(conn => {
      connection = conn;
      fileName = generateOutputFileName();
      createStreams(conn)
      const outputStream = generateOutputFile(fileName);
      mixer.pipe(outputStream);
  })
}

function stopRecording(msg){
    let voiceChannel = msg.member.voice.channel;
    voiceChannel.leave();
}

client.login(config.discordtoken);
client.on('ready', () => {
  console.log('ready!');
});
