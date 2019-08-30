const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require("cors")
const express = require("express")

admin.initializeApp(functions.config().firebase);



/* Express with CORS */
var bodyParser = require('body-parser');

const app2 = express()

app2.use(cors({ origin: true }))
app2.set('port', (process.env.PORT || 5000));
app2.use(express.static(__dirname + '/src'));
app2.set('views', __dirname + '/src');
app2.engine('html', require('ejs').renderFile);
app2.set('view engine', 'html');
app2.use(bodyParser.urlencoded({
  extended: false
}));
app2.use(bodyParser.json());

app2.get("/index", (request, response) => {
    response.render(__dirname  + "/src/index.html");
})

app2.post("/index", (request, response) => {

    var quote = request.body.text;
    var author = request.body.author;
    var url = request.body.url;

    admin.database().ref('count').transaction(function (current_value) {
        var quoteId = (current_value || 0) + 1;

        admin.database().ref("quotes/" + quoteId).set({
            "text": quote,
            "url": url,
            "author": author
        })

        return quoteId;
    });
    response.render(__dirname  + "/src/progress.html",  {'quote': quote, 'author': author, 'url': url});
})

app2.get("/quotes", async (request, response) => {
    var data = []
    var sizeOfList;
    admin.database().ref("count").on("value", function(snapshot) {
        sizeOfList = parseInt(snapshot.val());
        var msg;
        for (var i = 0; i <= 5; i++) {
            var rand = parseInt(getRndInteger(1, parseInt(sizeOfList)));
            admin.database().ref("quotes/" + rand + "/").on("value", function(snapshot) {
                data.push(snapshot.val());
                if (data.length == 5)
                    response.status(200).json(data);                
            });
        }
      }, function (errorObject) {
        response.status(500).send("Something went wrong");
      });

})

const api2 = functions.https.onRequest(app2)

module.exports = {
  api2
}


// ------------------------ Utilities ------------------------------
/**
 * Generate random integer for the given range.
 * @param {range lower value} min 
 * @param {range upper value} max 
 */
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}
