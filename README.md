## Movie Database

My own take on a IMDB like movie database with some social media like integrations.

### Config

1.	Run npm install in a command window to install the modules.
2.	Run mongod -–dbpath=<databasepath> to start mongodb.
3.	Run node create-database.js in a command window to init the database.
4.	Run node server.js to start the server.

The server will by default be running at https://localhost:3000/ which will render the home page.

The server can also use HTTPS by making `USE_HTTPS` equal true in `server.js` and adding `cert.pem` and `key.pem` in the src directory.

