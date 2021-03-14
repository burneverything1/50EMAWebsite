document.addEventListener('DOMContentLoaded', getStocks)

var baseUrl = 'https://50EMAWebsite.burneverything.repl.co/'

function getStocks() {
  var req = new XMLHttpRequest()
  req.open('GET', (baseUrl + '/load-database'), true)
  req.addEventListener('load', function() {
    if (req.status >= 200 && req.status <= 400){
      console.log(req.responseText)
      createTable(JSON.parse(req.responseText))
    }
  })
  req.send()
}

function createTable(req_array) {
  var body = document.getElementById('stockbody')

  // clear existing rows
  while (body.firstChild){
    body.removeChild(body.lastChild)
  }

  let dates = []

  req_array.forEach(dbkey =>{
    // pull info from dbkey
    let dbkey_array = dbkey.split('*')
    let ticker = dbkey_array[0]
    dates.push(dbkey_array[2])
    let price_type = dbkey_array[1]

    // insert elements
    let row = body.insertRow()
    let s_ticker = row.insertCell(0)
    s_ticker.innerHTML = ticker
    let p_type = row.insertCell(1)
    p_type.innerHTML = price_type

  })
  createHeaderTable(dates)
}

function createHeaderTable(date_array) {
  for (i = 0; i < 7; i++) {
    document.getElementById(`date${i}`).innerHTML = date_array[i]
  }
}