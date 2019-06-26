let express = require('express');
let app = express();
var bodyParser = require('body-parser');

// seting up socket,io server side library
var http = require('http').Server(app);
var io = require('socket.io')(http);

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://rneha725:incorrect@cluster0-synlm.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });

//let's try to serve static files
app.use(express.static(__dirname)); //it searches for index.html
app.use(bodyParser.json()); //todo not sure, but this for get, 
app.use(bodyParser.urlencoded({ extended: false })) // todo, for getting the data passed to the post request in URL

app.get('/messages', (req, res) => {
    client.connect((err) => {
        if (err) console.log("Error in db: " + err);
        else {
            const collection = client.db("messagesDB").collection("messages");
            console.log(collection.find().toArray((err, item)=> {
                res.send(item);
            }));
        }
    });
});

app.get('/cleanMessages', (req, res)=> {
    client.connect((err) => {
        if (err) {
            console.log("Error in db: " + err);
            res.sendStatus(500);
        }
        else {
            const collection = client.db("messagesDB").collection("messages");
            collection.deleteMany({});
            res.sendStatus(200);
        }
    });
    io.emit('refresh');
})

app.post('/messages', (req, res) => {
    try {
        console.log("Sent message is: " + JSON.stringify(req.body));
        client.connect((err) => {
            if (err) console.log("Error in db: " + err);
            else {
                const collection = client.db("messagesDB").collection("messages");
                collection.insertOne(req.body, (err) => {
                    if (err) console.log("Error in saving: " + err);
                    else console.log("saved");
                });
            }
        });

        //emitting the event to the client
        io.emit('message', req.body);
        res.sendStatus(200);
    } catch(e) {
        console.log("Error in posting data: " + JSON.stringify(e));
    }
});

//iondicates connected client/server
io.on('connection', (socket) => {
    console.log("user connected");
})

//why replaced with http
var server = http.listen(3000, () => {
    console.log("server on " + JSON.stringify(server.address().port));
});

server.on('close', (err) => {
    console.log("Closing the server...");
    client.close();
})