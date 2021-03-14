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

app.get('/get-prices', async (req, res) => {
  // check if ticker
  if (!req.query.ticker){
    res.send('You didnt include a ticker')
    return
  }
  let ticker = req.query.ticker
  await get7EMA(ticker)
  await get7Day(ticker)
  res.send()
})

app.get('/load-database', async (req, res) => {
  // wait for get_payload
  let payload = {}
  payload = await get_payload()
  res.send(payload)
  console.log('database keys loaded to client')
})

async function get_payload(){
  // function to get prices from database, async to handle database return time
  let keys = []
  let price_array = []

  keys = await db.list()

  let keys_pull = async function(keys){
    let return_array = []
    for (i = 0; i < keys.length; i++){
      let price = await db.get(keys[i])
      return_array.push(price)
    }
    return return_array
  }

  price_array = await keys_pull(keys)
  
  let payload = {
    "keys": keys,
    "price_array": price_array
  }
  return payload
}

app.get('/delete-database', (req, res) => {
  // clear every key in database
  db.list().then(keys => {
    keys.forEach(element =>{
      console.log('deleted in database: ' + element)
      db.delete(element).then(() => {});
    })
  });
  console.log('deleted database')
  res.send('cleared database')
})


app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});


function get7EMA (ticker) {
  // make request to Alphavantage for EMA price data
  var req = new XMLHttpRequest()
  req.open('GET', `https://www.alphavantage.co/query?function=EMA&symbol=${ticker}&interval=daily&time_period=50&series_type=close&apikey=${alphavantagekey}`)
  req.addEventListener('load', async function(){
    if (req.status >= 200 && req.status <= 400){
      reqsave = JSON.parse(req.responseText)
      console.log('Got EMA of ' + ticker)
      await store7EMA(reqsave)
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
    let emaPrice = alpharesponse["Technical Analysis: EMA"][date]["EMA"]
    let emaDaykey = `${ticker}*EMA*${date}`
    db.set(emaDaykey, emaPrice).then(() => {
      console.log('saved EMA as ' + emaDaykey)
    });
  }
}

function get7Day (ticker) {
  // make request to alphavantqage for price data
  var req = new XMLHttpRequest()
  req.open('GET', `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=compact&apikey=${alphavantagekey}`)
  req.addEventListener('load', async function(){
    if (req.status >= 200 && req.status <= 400){
      reqsave = JSON.parse(req.responseText)
      console.log('got 7day for ' + ticker)
      await store7day(reqsave)
    }
    else {
      console.log("Error in network request: " + req.statusText)
    }
  })
  req.send()
}

function store7day (alpharesponse) {
  // save last 7 days of EMA price data
  for (i = 0; i < 7; i++) {
    let ticker = alpharesponse["Meta Data"]["2. Symbol"]
    let date = Object.keys(alpharesponse["Time Series (Daily)"])[i]
    let day7price = alpharesponse["Time Series (Daily)"][date]["4. close"]
    let day7key = `${ticker}*7day*${date}`
    db.set(day7key, day7price).then(() => {
      console.log('saved 7day as ' + day7key)
    })
  }
}

function store7Day () {

}