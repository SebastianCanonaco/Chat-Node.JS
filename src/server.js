const http = require('http')
const net = require('net')
const url = require('url')
const fs = require('fs'),
    path = require('path'),    
    filePath = path.join(__dirname, 'index.html');


const HOST = '10.9.10.236'
const PORT_TCP = 5353
const PORT_HTTP = 8081
var activos = []
var respuestaCompleta


function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

function userExists(username){
	var i = 0;
	var N = activos.length

	while(i < N && username != activos[i].user_name)
		i++
		
	return (i < N)
}

const tcpServer = net.createServer((socket) => {

	//sincronizacion NTP
	socket.on('data', (data) => {
		console.log('sincronizacion NTP empieza')

		var T2 = armarTimeStamp();

		var T3 = armarTimeStamp();

		socket.write(data.toString() + ',' + T2.toString() + ',' + T3.toString())
	})

	socket.on('close', (err) => {
		if (err) {
	    	return console.log('something bad happened', err)
	  	}
  	  	console.log(`server tcp is closed`)	
	})

	socket.on('error', (err) => {
		if (err) {
	    	return console.log('timeout', err)
	  	}
  	});
}).listen(PORT_TCP, (err) => {
	if (err) {
    	return console.log('something bad happened', err)
  	}

  	console.log(`server tcp is listening on ${PORT_TCP}` + 'hora: ' + msToTime(armarTimeStamp()))
})

function armarHTML(activos){
	
	var ret = fs.readFileSync(filePath, {encoding: 'utf-8'})
	for(let user of activos){
		time = msToTime(user.timestamp)
		ret += `<tr><th scope="row">${user.user_name}</th><td>${user.user_ip}</td><td>${user.user_port}</td><td>${time}</td></tr><tr>`
	}
	ret +=   "</tbody></table></body></html>"
	return ret

}

const httpServer = http.createServer((request, response) => {
	if(request.method == 'GET'){
		var urlPathname = url.parse(request.url).pathname
		console.log(urlPathname)
		if(urlPathname == "/get_actives/" || urlPathname == "/favicon.ico"){
			//devolver la hora
			//abrir archivo html
			//
			console.log("entro")

			response.end(armarHTML(activos))
		} else {
			var urlObj = url.parse(request.url, true)
			var clientNode = {
				user_name : urlObj.query.username,
				user_ip : urlObj.query.ip,
				user_port : urlObj.query.port,
				timestamp : armarTimeStamp()
			}
			
			//ver si no esta ya el nodo
			
			if(!userExists(clientNode.user_name)){
				//devolver al cliente lista de activos
				//response.statusCode
				response.end(JSON.stringify(activos))
				activos.push(clientNode)//cambiar al final luego
				for(let user of activos)
				console.log("User: " + user.user_name)
			} else {
				response.end('El usuario ya existe, elija otro nick')
			}
		}
	}
	
}).listen(PORT_HTTP, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server http is listening on ${PORT_HTTP}`)
})

function armarTimeStamp(){
	var monthNames = [
		"Jan", "Feb", "Mar",
		"Apr", "May", "Jun", "Jul",
		"Aug", "Sep", "Oct",
		"Nov", "Dec"
	  ];

	  var dayNames = ["Sun","Mon", "Tue", "Wed",
		"Thu", "Fri", "Sat",
	  ];
	  var date = new Date();
	  var dayWeekIndex= date.getDay()
	  var dayMonth = date.getDate();
	  var monthIndex = date.getMonth();
	  var year = date.getFullYear();
	  var h = addZero(date.getHours());
      var m = addZero(date.getMinutes());
      var s = addZero(date.getSeconds());
	  var hms = h + ":" + m + ":" + s;
	  //console.log(date.getDay())
	  //console.log(dayNames[dayWeekIndex] + ', ' +dayMonth+' '+ monthNames[monthIndex] +' ' + year+' '+hms)
	  //console.log(Date.parse(dayNames[dayWeekIndex] + ', ' +dayMonth+' '+ monthNames[monthIndex] +' ' + year+' '+hms))
	  //console.log(msToTime(Date.parse(dayNames[dayWeekIndex] + ', ' +dayMonth+' '+ monthNames[monthIndex] +' ' + year+' '+hms)))
	  return Date.parse(dayNames[dayWeekIndex] + ', ' +dayMonth+' '+ monthNames[monthIndex] +' ' + year+' '+hms + " GMT");
	
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}



