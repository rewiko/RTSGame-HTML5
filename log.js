/**
 * @author rewiko
 */
/*
    The log_rts 

        A simple class to log user
*/
	

    var log_rts = function(client_bdd) {

       this.client_bdd=client_bdd;

    }; //log_rts.constructor
  
    log_rts.prototype.log_user = function(client,login){
    	
    		client_bdd=this.client_bdd;
    	 	client_bdd.query('SELECT id_user from user_rts where login_user=$1',[login], function(err, result) {
		        		// verrif password pwd =d[1].value 
		        		if(!err&& result.rowCount>0){
		        			id_user=result.rows[0].id_user;
		        			client_bdd.query('INSERT INTO connexion_rts VALUES (default,NOW(),$1,$2)', [client.manager.handshaken[client.id].address.address,id_user], function(err, result) {
				     		 	console.log("err :",err);
				     		 	console.log("result :",result);
				     		 	console.log("inscritpion log ",client.manager.handshaken[client.id].address.address,uuid_user);
			     		 	
			     		 		//emit si err ou result et mail de confirmation 
					    	 	//output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
						 	});
	     		 	
			      		}
		        		
		        		 
		        	});    
    }; // log_rts.prototype.log_user

    

//server side we set the 'game_core' class to a global type, so that it can use it anywhere.
if( 'undefined' != typeof global ) {
    module.exports = global.log_rts = log_rts;
}