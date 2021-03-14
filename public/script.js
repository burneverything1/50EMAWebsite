document.addEventListener('DOMContentLoaded', getStocks)
document.addEventListener('DOMContentLoaded', bindbuttons)

var baseUrl = 'https://50EMAWebsite.burneverything.repl.co/'

function getStocks() {
  // pull the currently saved stock prices from database and create table
  let req = new XMLHttpRequest()
  req.open('GET', (baseUrl + '/load-database'), true)
  req.addEventListener('load', () => {
    if (req.status >= 200 && req.status <= 400){
      payload = JSON.parse(req.responseText)
      // check if database is too full


      createTable(payload.keys, payload.price_array)
    }
  })
  req.send()
}

function bindbuttons(){
  document.getElementById('submitstocksearch').addEventListener('click', (event) =>{
    event.stopImmediatePropagation()
    event.preventDefault()
  
    let input = document.getElementById('stocksearch').value
    
    // check for ticker
    if (input === ""){
      console.log('Need stock ticker')
      return
    }
    // check for no symbols

    let req = new XMLHttpRequest()
    req.open('GET', baseUrl + `/get-prices?ticker=${input}`, true)
    req.addEventListener('load', () =>{
      if (req.status >= 200 && req.status <= 400){
        console.log('got prices for ' + input)
        setTimeout(()=>{getStocks()}, 1500)
      }
    })
    req.send()
  })
  document.getElementById('cleardatabase').addEventListener('click', (event) =>{
    event.stopImmediatePropagation()
    event.preventDefault()

    let req = new XMLHttpRequest()
    req.open('GET', baseUrl + '/delete-database', true)
    req.addEventListener('load', () =>{
      if (req.status >= 200 && req.status <= 400) {
        console.log('database cleared')
        setTimeout(()=>{getStocks()}, 1500)
      }
    })
    req.send()
  })
}

function createTable(keys, prices) {
  // use database prices to create HTML table
  var body = document.getElementById('stockbody')

  // clear existing rows
  while (body.firstChild){
    body.removeChild(body.lastChild)
  }

  let dates = []
  let tickers = []
  let price_types = []

  keys.forEach(dbkey =>{
    // pull info from dbkey into arrays
    let dbkey_array = dbkey.split('*')
    tickers.push(dbkey_array[0])
    price_types.push(dbkey_array[1])
    dates.push(dbkey_array[2])

  })
  // create rows
  for (i = 0; i < dates.length; i++){
    // every 7, create row
    if (i % 7 == 0){
      let row = body.insertRow()
      let s_ticker = row.insertCell(0)
      s_ticker.innerHTML = tickers[i]
      let p_type = row.insertCell(1)
      p_type.innerHTML = price_types[i]

      // date cells
      for (j = 2; j < 9; j++){
        let d_cell = row.insertCell(j)
        d_cell.innerHTML = prices[i + (j - 2)]
        d_cell.className = 'dollars'
      }
    }

  }

  createHeaderTable(dates)
}

function createHeaderTable(date_array) {
  // create header row with dates from last 7 days
  for (i = 0; i < 7; i++) {
    document.getElementById(`date${i}`).innerHTML = date_array[i]
  }
}