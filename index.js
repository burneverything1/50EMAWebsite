var express = require('express')
var app = express()
app.use(express.static('public'))
//require('dotenv').config();

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var fs = require('fs');

const Database = require("@replit/database")
const db = new Database()

app.use(express.json())
app.use(express.urlencoded({ extended: false}))
app.set('port', 3000)

// get env
/*
Trying to store keys on different file

var stocktwitskey = process.env.alphavantagekey
console.log(process.env.alphavantagekey)
console.log(stocktwitskey)
*/

var stocktwitskey = 'ba52e2cfa75086be'
var alphavantagekey = 'U289CFULY2G94EU9'

app.get('/', (req,res) =>{
    res.sendFile(__dirname + '/public/home.html')
})

/*
app.get('/get-prices', (req, res) => {
  var req = new XMLHttpRequest();
  req.open('GET', `https://api.stocktwits.com/api/2/trending/symbols/equities.json?access_token=${stocktwitskey}`)
  req.addEventListener('load', function(){
    if (req.status >=200 && req.status <=400){
      console.log(req.responseText)
    }
    else {
      console.log("Error in network request: " + req.statusText)
    }
  })
  req.send(null)


})
*/
var reqsave = {}

app.get('/get-ema', (req, res) => {
  get7EMA('IBM')
})

app.get('/get-7day', (req, res) => {
  get7Day('IBM')
})

app.get('/delete-database', (req, res) => {
  db.list().then(keys => {
    console.log(keys)
    keys.forEach(element =>{
      console.log(element)
      db.delete(element).then(() => {});
    })
  });
})


app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});


function get7EMA (ticker) {
  // make request to Alphavantage for EMA price data
  var req = new XMLHttpRequest()
  req.open('GET', `https://www.alphavantage.co/query?function=EMA&symbol=${ticker}&interval=daily&time_period=50&series_type=close&apikey=${alphavantagekey}`)
  req.addEventListener('load', function(){
    if (req.status >= 200 && req.status <= 400){
      reqsave = JSON.parse(req.responseText)
      console.log('Got EMA of ' + ticker)
      store7EMA(reqsave)
    }
    else {
      console.log("Error in network request: " + req.statusText)
    }
  })
  req.send()
}

function store7EMA (alpharesponse) {
  // save last 7 days of EMA price data
  for (i = 0; i < 7; i++){
    let ticker = alpharesponse["Meta Data"]["1: Symbol"]
    let date = Object.keys(alpharesponse["Technical Analysis: EMA"])[i]
    let lastEMA = alpharesponse["Technical Analysis: EMA"][date]["EMA"]
    let lastdaykey = `${ticker}-EMA-${date}`
    console.log('saved EMA as ' + lastdaykey)
    db.set(lastdaykey, lastEMA).then(() => {});
  }
}

function get7Day (ticker) {
  // make request to alphavantqage for price data
  var req = new XMLHttpRequest()
  req.open('GET', `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=compact&apikey=${alphavantagekey}`)
  req.addEventListener('load', function(){
    if (req.status >= 200 && req.status <= 400){
      console.log('got 7day for ' + ticker)
    }
    else {
      console.log("Error in network request: " + req.statusText)
    }
  })
  req.send()
}

function store7day (alpharesponse) {
  // save last 7 days of EMA price data
  for (i = 9; i < 7; i++) {

  }
}

function store7Day () {

}