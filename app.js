/*  Copyright (c) 2013 Asad Memon
    
    Forked and updated.

    MIT Licensed.
*/

/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström
    
    written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    MIT Licensed.

    Usage : node app.js
*/

    var
        gameport        = process.env.PORT || 4004,

        io              = require('socket.io'),
        express         = require('express'),
        UUID            = require('node-uuid'),

        verbose         = false,
        app             = express.createServer();
        
        var pg = require("pg");

		var conString = "pg://root:root@localhost:5432/rtsgame";
		
		var client_bdd = new pg.Client(conString);
		
		//note: error handling omitted

		client_bdd.connect(function(err) {
		  client_bdd.query('SELECT NOW() AS "theTime"', function(err, result) {
		  	if(err)
		  		console.log("erreur BDD",err);
		  	else 
		    	console.log("launch BDD",result.rows[0].theTime);
		      //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
		  })
		});
		
		var SHA256 = require("crypto-js/sha256");
		
		var mailer = require("./mailer.js");
		var log_rts = require("./log.js");

/* Express server set up. */

//The express server handles passing our content to the browser,
//As well as routing users where they need to go. This example is bare bones
//and will serve any file the user requests from the root of your web server (where you launch the script from)
//so keep this in mind - this is not a production script but a development teaching tool.

        //Tell the server to listen for incoming connections
    app.listen( gameport );
    var remote_addr="";
    //use session
     store  = new express.session.MemoryStore;
app.use(express.cookieParser());
app.use(express.session({ secret: 'something', store: store }));

        //Log something so we know that it succeeded.
    console.log('\t :: Express :: Listening on port ' + gameport );

        //By default, we forward the / path to index.html automatically.
    app.get( '/', function( req, res ){
        res.sendfile( __dirname + '/index.html' );
        req.session.remoteAddress = req.connection.remoteAddress;
		remote_addr=req.session.remoteAddress;
    });


        //This handler will listen for requests on /*, any file from the root of our server.
        //See expressjs documentation for more info on routing.

    app.get( '/*' , function( req, res, next ) {

            //This is the current file they have requested
        var file = req.params[0];

            //For debugging, we can track what files are requested.
        if(verbose) console.log('\t :: Express :: file requested : ' + file);
		console.log('IP: ' + req.connection.remoteAddress + '!');
		
	req.session.remoteAddress = req.connection.remoteAddress;
	remote_addr=req.session.remoteAddress;
		
            //Send the requesting client the file.
        res.sendfile( __dirname + '/' + file );

    }); //app.get *


/* Socket.IO server set up. */

//Express and socket.io can work together to serve the socket.io client files for you.
//This way, when the client requests '/socket.io/' files, socket.io determines what the client needs.
        
        //Create a socket.io instance using our express server
    var sio = io.listen(app);

        //Configure the socket.io connection settings.
        //See http://socket.io/
    sio.configure(function (){

        sio.set('log level', 0);

        sio.set('authorization', function (handshakeData, callback) {
          callback(null, true); // error first callback style
        });

    });

        //Enter the game server code. The game server handles
        //client connections looking for a game, creating games,
        //leaving games, joining games and ending games when they leave.
    game_server = require('./game.server.js');

        //Socket.io will call this function when a client connects,
        //So we can send that client looking for a game to play,
        //as well as give that client a unique ID to use so we can
        //maintain the list if players.
    sio.sockets.on('connection', function (client) {
        
            //Generate a new UUID, looks something like
            //5b2ca132-64bd-4513-99da-90e838ca47d1
            //and store this on their socket/connection
        client.userid = UUID();
        // console.log(client.remoteAddress);
        // var endpoint = client.address();
    // console.log('Client connected from: ' + endpoint.address + ":" + endpoint.port);
		 // var remote_addr=client.remoteAddress;
		 // console.log("remote",remote_addr);
            //tell the player they connected, giving them their id
        client.emit('onconnected', { id: client.userid } );

            //now we can find them a game to play with someone.
            //if no game exists with someone waiting, they create one and wait.
        game_server.findGame(client);

            //Useful to know when someone connects
        console.log('\t socket.io:: player ' + client.userid + ' connected');
        

            //Now we want to handle some of the messages that clients will send.
            //They send messages here, and we send them to the game_server to handle.
        client.on('message', function(m) {

            game_server.onMessage(client, m);

        }); //client.on message
        
        client.on('change_id',function(data){
        	console.log(data);
        	
        	
        	login=data.user;
        	console.log("login est : ",data.user);
        	client_bdd.query('SELECT uuid_user,salt_user,pwd_user  from user_rts where login_user=$1',[data.user], function(err, result) {
        		
        		// verrif password pwd =d[1].value 
        		if(!err&& result.rowCount>0){
        			console.log('ip',client.manager.handshaken[client.id].address.address);
	        		if(SHA256(result.rows[0].uuid_user+ client.manager.handshaken[client.id].address.address+result.rows[0].pwd_user).toString()==data.id_reco){
	        			log("bonne connexion ok");
	        			console.log(data.user,result.rows[0].uuid_user);
	        			 client.emit('onconnected', { id_reco: SHA256(result.rows[0].uuid_user+ client.manager.handshaken[client.id].address.address+result.rows[0].pwd_user).toString(), user:data.user,change_id:1} );
	        			 
	     		 		//mise en place log 
	     		 		var log_write = new log_rts(client_bdd);
			     		log_write.log_user(client,login);
			      		
		        		  	
	        		}
	        		else {
	        			console.log("bad connexion ");
	        			client.emit('onconnected', { id: "unknown" , user:data.user,change_id:1} );
	        		}
        			 
        		}
        		else {
	        			console.log("bad connexion ");
	        			client.emit('onconnected', { id: "unknown" , user:data.user,change_id:1} );
	        	}
        		
        		 
        	});
        	
        });
        
        client.on('connect_form',function(data){
        	d=JSON.parse(data);
        	console.log('connect login ',client.manager.handshaken[client.id].address.address);
        	login=d[0].value;
        	client_bdd.query('SELECT uuid_user,salt_user,pwd_user  from user_rts where login_user=$1',[login], function(err, result) {
        		
        		// verrif password pwd =d[1].value 
        		if(!err&& result.rowCount>0){
        			
	        		if(result.rows[0].pwd_user==SHA256(d[1].value+ result.rows[0].salt_user).toString()){
	        			console.log("bonne connexion ");
	        			 client.emit('onconnected', { id_reco: SHA256(result.rows[0].uuid_user+ client.manager.handshaken[client.id].address.address+result.rows[0].pwd_user).toString(), user:d[0].value,change_id:0} );
			        	uuid_user=result.rows[0].uuid_user;
			        		 	// insert into BDD
	     		 	if(!err){
	     		 		//mise en place log 
	     		 		var log_write = new log_rts(client_bdd);
			     		log_write.log_user(client,login);
			      	}
		        		  		 
		        	
        		
	        			 
	        			 
	        		}
	        		else {
	        			console.log("bad connexion ");
	        			client.emit('onconnected', { id: "unknown", user:d[0].value ,change_id:0} );
	        		}
        			 
        		}
        		else {
	        			console.log("bad connexion ");
	        			client.emit('onconnected', { id: "unknown", user:d[0].value,change_id:0 } );
	        	}
        		
        		 
        	});
        	
        });
        
        client.on('register',function(data){
        	d=JSON.parse(data);
        		console.log('connect register ',client.manager.handshaken[client.id].address.address);
        	//login
        	login=d[0].value;
        	//email
        	email=d[3].value;
        	//anti_bot
        	console.log("register ip :" ,client.manager.handshaken[client.id].address.address);
        	if(d[4].value==""){
        		//second hash password sha256 + salt
	        	salt=Math.random().toString(36).substring(10);
	        	password_hash=SHA256(d[1].value+salt).toString();
	        	uuid_user=UUID();
	        	// insert into BDD
	        	 client_bdd.query('INSERT INTO user_rts VALUES (default,$1,$2,$3,$4,$5,NOW(),default)', [uuid_user,login,password_hash,salt,email], function(err, result) {
	     		 	console.log("err :",err);
	     		 	console.log("result :",result);
	     		 	console.log("bonne connexion ");
	        		client.emit('onconnected', { id_reco: SHA256(uuid_user+ client.manager.handshaken[client.id].address.address+password_hash).toString(), user:login,change_id:1} );
	     		 	// insert into BDD
	     		 	if(!err){
			     		//mise en place log 
	     		 		var log_write = new log_rts(client_bdd);
			     		log_write.log_user(client,login);
	        		}
        		
        		//send mail register activation compte 
        		 var send_mail = new mailer();
        		 send_mail.send();
        		
			        	
	     		 	//emit si err ou result et mail de confirmation 
			     //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
				 });
		   }
		        	
        });
        

            //When this client disconnects, we want to tell the game server
            //about that as well, so it can remove them from the game they are
            //in, and make sure the other player knows that they left and so on.
        client.on('disconnect', function () {

                //Useful to know when soomeone disconnects
            console.log('\t socket.io:: client disconnected ' + client.userid + ' ' + client.game.id);
            
                //If the client was in a game, set by game_server.findGame,
                //we can tell the game server to update that game state.
            if(client.game && client.game.id) {

                //player leaving a game should destroy that game
                game_server.playerDisconnect(client.game.id, client.userid);

            } //client.game_id

        }); //client.on disconnect
     
    }); //sio.sockets.on connection
