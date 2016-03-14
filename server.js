// Patch console.x methods in order to add timestamp information

require ( 'console-stamp' ) ( console, 'dd/mm/yyyy HH:MM:ss' );

// var bodyParser  = require ( 'body-parser' );
var express     = require ( 'express' );
var fs          = require ( 'fs' );
var http        = require ( 'http' );

var config      = require ( './config' );

var app = express ( );
var host = config.host || process.env.HOST || '127.0.0.1';
var httpOptions = {

    headers : {
    
        'Content-Type': 'application/json-rpc'
        
        },
    host : 'api.random.org',
    method : 'POST',
    path : '/json-rpc/1/invoke'
    
    };
var port = config.port || process.env.PORT || 8080;
var wordList = { };


// load word list

fs.readFile ( 'diceware.wordlist.asc', 'ascii', function ( err, data ) {

    if ( err ) throw err;
    
    var t;
    
    data = data.match ( /\d{5}\t.+/g );
    
    for ( i = 0; i < data.length; i++ ) {
    
        t = data [ i ].split ( '\t' );
        
        wordList [ t [ 0 ] ] = t [ 1 ];
        
        }
    } );


// configure app to use bodyParser(), this will let us get the data from a POST

// app.use ( bodyParser.urlencoded ( { extended : true } ) );
// app.use ( bodyParser.json ( ) );

var router = express.Router ( ); // get an instance of the express Router


// middleware to use for all requests

router.use ( function ( request, response, next ) {

    // do logging
        
    // console.log ( '' );
    
    next ( ); // go to the next routes and don't stop here
    
    } );


// test route to make sure everything is working (accessed at GET http://127.0.0.1:8080/api)

router.get ( '/', function ( request, response ) {

    response.json ( { message: 'Welcome to the dice phrase api!' } );
    
    } );


// more routes for our API will happen here

// on routes that end in /dicephrase/
// ----------------------------------------------------
router.route ( '/dicephrase/:wordCount' )

    // get a dice phrase ( accessed at GET http://127.0.0.1:8080/api/dicephrase )
    
    .get ( function ( request, response ) {
    
        var wordCount = Math.min ( Math.max ( parseInt ( request.params.wordCount ), 1 ), 10 );
        
        var ct = 5 * wordCount;
        var httpCallback = function ( httpResponse ) {

            var s = '';
            
            httpResponse.on ( 'data', function ( chunk ) {
            
                s += chunk;
                
                } );

            httpResponse.on ( 'end', function ( ) {
            
                var a = JSON.parse ( s ) [ 'result' ] [ 'random' ] [ 'data' ];
                var key;
                var numbers = [ ];
                var words = [ ];
                
                for ( i = 0, j = 5; j <= ct; i += 5, j += 5 ) {
                
                    key = a.slice ( i, j ).join ( '' );
                    
                    numbers.push ( parseInt ( key ) );
                    
                    words.push ( wordList [ key ] );
                
                    }
                    
                response.json ( { numbers : numbers, phrase : words.join ( ' ' ), words : words } );
                
                } );
            };
            
        var apiReq = http.request ( httpOptions, httpCallback );
        
        apiReq.write ( JSON.stringify ( {
        
            jsonrpc : '2.0',
            method : 'generateIntegers',
            params : {
                apiKey : config.randomOrgApiKey,
                n : ct,
                min : 1,
                max : 6
                },
            id: 1
            
            } ) );
            
        apiReq.end ( );
        
        } );


// all routes will be prefixed with /api

app.use ( '/api', router );


// start the server

app.listen ( port, host );

console.log ( 'dice phrase running on http://' + host + ':' + port + '/api/...' );
