/**
 * @author rewiko
 */
/*
    The mailer ass

        A simple class to send mail
*/
	var nodemailer = require("nodemailer");

    var mailer = function() {

           this.mailOptions = {
								    from: "RTSGAME <no-reply@rtsgame.com>", // sender address
								    to: "", // list of receivers
								    subject: "Hello ", // Subject line
								    text: "Can you confirm your register? ", // plaintext body
								    html: "<b>Hello world </b><p>Can you confirm your register? </p>" // html body
							  },
		    this.smtpTransport = nodemailer.createTransport("SMTP",{
																    service: "Gmail",
																    auth: {
																        user: "",
																        pass: ""
																    }
															});

    }; //mailer.constructor
  
    mailer.prototype.send = function(){

		        // send mail with defined transport object
		this.smtpTransport.sendMail(this.mailOptions, function(error, response){
		    if(error){
		        console.log(error);
		    }else{
		        console.log("Message sent: " + response.message);
		    }
		
		    // if you don't want to use this transport object anymore, uncomment following line
		    //smtpTransport.close(); // shut down the connection pool, no more messages
		});


    
    }; // mailer.prototype.send

    

//server side we set the 'game_core' class to a global type, so that it can use it anywhere.
if( 'undefined' != typeof global ) {
    module.exports = global.mailer = mailer;
}