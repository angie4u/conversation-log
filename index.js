const path = require('path');
var restify=require('restify');
var bodyParser = require('body-parser');
var fs = require('fs');
const { AzureBlobTranscriptStore, BlobStorage } = require('botbuilder-azure');


var server=restify.createServer();
server.listen(8081, function(){
    console.log("%s is running at %s", server.name, server.url);
});

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false});

const ENV_FILE = path.join(__dirname, '.env');
const env = require('dotenv').config({ path: ENV_FILE });

let transcriptStore = new AzureBlobTranscriptStore({
    storageAccountOrConnectionString: process.env.connectionString,
    containerName: process.env.containerName
});

server.get('/', 
    function(req, res, next) {
    fs.readFile(__dirname + '/index.html', function (err, data) {
        if (err) {
            next(err);
            return;
        }
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(data);
        next();
    });
});

server.post('/transcript', urlencodedParser, 
  async function(req, res, next) {
    if(!req.body) 
        return res.sendStatus(400)

    console.log(req.body);

    var channelId = req.body.channelId;
    var conversationId = req.body.conversationId;
    var token = req.body.token;

    var log = await retrieveHistory(channelId, conversationId, token, transcriptStore);
    
    res.send(log);
    // res.writeHead(200);
    // res.end();
    //return next();
  },
//   function(req, res, next) {
//     res.send(req.someData);
//     return next();
//   }
);

async function retrieveHistory(channelId, conversationId, token, transcriptStore){
 
    let continuationToken = "";
    var count = 0;

    // WebChat and Emulator require modifying the activity.Id to display the same activity again within the same chat window
    let updateActivities = [ 'webchat', 'emulator', 'directline' ].includes(channelId);
    // let incrementId = 0;
    // if (channelId.includes("|"))
    // {
    //     incrementId = parseInt(channelId.split('|')[1]) || 0;
    // }
    
    var pagedTranscript = await transcriptStore.getTranscriptActivities(channelId, conversationId, token);

    var transcriptLog = "<Transcript Log>\n";
    pagedTranscript.items.forEach(item => {
        transcriptLog = transcriptLog + item.text + "\n";
    });

    return transcriptLog;

}





