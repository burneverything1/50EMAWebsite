const express = require('express')
var app = express()
app.use(express.static('public'))
//require('dotenv').config();
const schedule = require('node-schedule')

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const fs = require('fs');

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
  // check if ticker is given
  if (!req.query.ticker){
    res.send('You didnt include a ticker')
    return
  }
  let ticker = req.query.ticker.toUpperCase()

  await get7EMA(ticker)
  await get7Day(ticker)
  res.send()
})

app.get('/load-database', async (req, res) => {
  // wait for get_payload
  let payload = {}
  payload = await get_payload()
  res.send(payload)
  let d = Date(Date.now())
  let log_alert = '\ndatabase keys loaded to client' + ' ' + d.toString()
  fs.appendFile('log.txt', log_alert,(err)=>{
    if (err){
      console.log(err)
    }
  })
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
  clear_db()
  res.send('cleared database')
})

function clear_db (){
  db.list().then(keys => {
    keys.forEach(element =>{
      db.delete(element).then(() => {});
    })
  });
  let d = Date(Date.now)
  let log_alert = '\ndeleted database ' + d.toString()
  fs.appendFile('log.txt', log_alert, (err) =>{
    if (err){
      console.log(err)
    }
  })
}

// schedule delete database for every night
schedule.scheduleJob('0 0 * * *', clear_db)


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
      let d = Date(Date.now())
      let log_alert = '\nGot EMA of ' + ticker + ' ' + d.toString()
      fs.appendFile('log.txt', log_alert, (err) =>{
        if (err){
          console.log(err)
        }
      })
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
  let ticker = alpharesponse["Meta Data"]["1: Symbol"]
  for (i = 0; i < 7; i++){
    let date = Object.keys(alpharesponse["Technical Analysis: EMA"])[i]
    let emaPrice = alpharesponse["Technical Analysis: EMA"][date]["EMA"]
    let emaDaykey = `${ticker}*EMA*${date}`
    db.set(emaDaykey, emaPrice)
  }
  let d = Date(Date.now())
  let log_alert = '\nsaved EMA as ' + ticker + ' ' + d.toString()
  fs.appendFile('log.txt', log_alert, (err)=>{
    if (err){
      console.log(err)
    }
  })
}

function get7Day (ticker) {
  // make request to alphavantqage for price data
  var req = new XMLHttpRequest()
  req.open('GET', `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=compact&apikey=${alphavantagekey}`)
  req.addEventListener('load', async function(){
    if (req.status >= 200 && req.status <= 400){
      reqsave = JSON.parse(req.responseText)
      let d = Date(Date.now())
      let log_alert = '\ngot 7day for ' + ticker + ' ' + d.toString()
      fs.appendFile('log.txt', log_alert, (err)=>{
        if (err){
          console.log(err)
        }
      })
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
  let ticker = alpharesponse["Meta Data"]["2. Symbol"]
  for (i = 0; i < 7; i++) {
    let date = Object.keys(alpharesponse["Time Series (Daily)"])[i]
    let day7price = alpharesponse["Time Series (Daily)"][date]["4. close"]
    let day7key = `${ticker}*7day*${date}`
    db.set(day7key, day7price)
  }
  let d = Date(Date.now())
  let log_alert = '\nsaved 7day as ' + ticker + ' ' + d.toString()
  fs.appendFile('log.txt', log_alert, (err)=>{
    if (err){
      console.log(err)
    }
  })
}