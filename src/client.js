const net = require('net')
const http = require('http')
const ip = require('ip')
const events = require('events');
const eventEmitter = new events.EventEmitter();
const readlineSync = require('readline-sync');
const readline = require('readline');
const HOST = '192.168.137.1' //Server IP;
const PORT_TCP = 5353 //Server PORT
const PORT_HTTP = 8081 //Server PORT
const MY_HOST = ip.address()
//var MY_PORT = 8000

var username = readlineSync.question('Inserte nombre de usuario: ');
var MY_PORT = readlineSync.question('PUERTO: ');
var u_activos = []
var s_activos = []
var palabras_reservadas = ['exit', 'cls']
var offset


function crearSockets(arreglo) {

	var rl = readline.createInterface({
  		input: process.stdin,
  		output: process.stdout
	})

	for(let clientNode of arreglo){
		//console.log('Usuario: '+ clientNode.user_name + "IP: " + clientNode.user_ip)
		let socket = new net.Socket()
		socket.connect(clientNode.user_port, clientNode.user_ip,MY_PORT,MY_HOST, () => {

			let newUser = {
				message : '@1111',
				user_name : username,
				user_ip : MY_HOST,
				user_port : MY_PORT,
			}
			socket.write(JSON.stringify(newUser))
			s_activos.push(socket)
			let client = {
				user_name : clientNode.user_name,
				user_ip : clientNode.user_ip,
				user_port : clientNode.user_port,
				sock : socket
			}
			u_activos.push(client)
		})

		socket.on('data', (data) => {

			data = JSON.parse(data)
			
			if(data.message == '@1111'){
					s_activos.push(socket)
					var client = {
					user_name : data.user_name,
					user_ip : data.user_ip,
					user_port : data.user_port
					}
					u_activos.push(client)
					console.log(client.user_name + " se ha conectado al chat D")
	
			} else {
				let mensajeObj = data
				hora = msToTime(mensajeObj.timestamp + mensajeObj.offset)
				console.log("("+ hora +") | "+ mensajeObj.from + " : " + mensajeObj.message)
			}
		})
		socket.on('error', (err) => {
			if(err) {
				var i=0;
				while( i < s_activos.length && socket !== s_activos[i]){
					i++ 
				}
				if(i < s_activos.length){
						s_activos.splice(i,1);
				} else {
					//console.log(err)
				}
			}
		})
	}
	

	rl.on('line', (userInput) => {
		var send = true
		palabras_reservadas.forEach((palabra) => {
			if(userInput == palabra)
				send = false
		})

		if(send){
			var mensajeObj = {
	  			from: username,
	  			to: 'all',
	  			message: userInput,
	  			timestamp: armarTimeStamp(),
	  			offset: offset
			}
			hora = msToTime(mensajeObj.timestamp + mensajeObj.offset)
			console.log("("+ hora +") | "+ mensajeObj.from + "(yo) : " + mensajeObj.message)
			for(let s of s_activos){ 	
				s.write(JSON.stringify(mensajeObj))
			}
		} else {
			if(userInput == 'exit'){
				process.stdout.write('\033c')
				console.log('Gracias por utilizar nuestra sala de chat vuelva pronto')
				process.exit()
			} else { 
				if(userInput == 'cls'){
					process.stdout.write('\033c')
				}

			}
		}
	})

}


/********************Sincronizacion****************************/

var client = new net.Socket();
eventEmitter.on('registrado', () => {
	//console.log('evento registrado')

client.connect(PORT_TCP, HOST, () => {

    console.log('CONNECTED TO NTP SERVER');
    var T1 = armarTimeStamp()
    client.write(T1.toString());
    

});

client.on('data', (data) => {
	var T4 = armarTimeStamp()

  	// obtenemos hora del servidor
  	var times = data.toString().split(",");
  	var T1 = parseInt(times[0]);
  	var T2 = parseInt(times[1]);
  	var T3 = parseInt(times[2]);

	  offset = ((T2 - T1) + (T3 -T4)) / 2;
	  client.destroy()

})

client.on('close', (err) => {
	if (err) {
    	return console.log('something bad happened', err)
  	}

  	//console.log(`client closed`)
})
})
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

/**************************************************************/

/***************************HTTP*******************************/
var url = `http://${HOST}:${PORT_HTTP}/register?username=${username}&ip=${MY_HOST}&port=${MY_PORT}`

eventEmitter.on('get', () => {
	//console.log('get evento')
	//console.log(username)
	http.get(url, (response) => {
		response.setEncoding('utf8');
		response.on('data', function(data){
			if(data.toString() != 'El usuario ya existe, elija otro nick'){
				eventEmitter.emit('registrado');
				crearSockets(JSON.parse(data))
			}
			else{
				eventEmitter.emit('repetido');	
			}
		})
		response.on('error', console.error);
	}).on('error', console.error);

}	)

eventEmitter.emit('get')

/**************************************************************/

eventEmitter.on('repetido', () => {
	//console.log('evento repetido')
	username = readlineSync.question('Inserte nombre de usuario: ');
	url = `http://${HOST}:${PORT_HTTP}/register?username=${username}&ip=${MY_HOST}&port=${MY_PORT}`
	eventEmitter.emit('get')
})

/*************************Recibo-Mensajes**********************/
net.createServer((socket) => {
	
	socket.on('data', (data) =>{
		//console.log('String: ' + data)
		data = JSON.parse(data)
		//console.log("Obj: " + data)
		
		if(data.message == '@1111'){//primera vez
			//verificar si no esta
			//console.log('entro nueva conexion')
				//console.log("entro al connect")
				s_activos.push(socket)
				var client = {
				user_name : data.user_name,
				user_ip : data.user_ip,
				user_port : data.user_port,
				sock : socket
				}
				u_activos.push(client)
				console.log(client.user_name + " se ha conectado al chat")
		} else {
			let mensajeObj = data
			//console.log(msToTime(mensajeObj.timestamp))
			//console.log(msToTime(mensajeObj.offset))
			hora = msToTime(mensajeObj.timestamp + mensajeObj.offset)
			console.log("("+ hora +") | "+ mensajeObj.from + " : " + mensajeObj.message)
		}
	})

	socket.on('error', (err) =>{
		if(err) {
			var i=0;
			while(i < s_activos.length && socket !== s_activos[i]){
				i++ 
			}
			if( i < s_activos.length){
					s_activos.splice(i,1);
			} else { 
				//console.log(err)
			}


			
			
		}
	})


}).listen(MY_PORT, (err) => {
	if (err) {
    	return console.log('something bad happened', err)
  	}

})
/**************************************************************/


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