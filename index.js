const Twit = require('twit');
const config = require('./config');
const Tweets = require('./Tweets');
const Mongoclient = require('mongodb').MongoClient;

const T = new Twit(config);
const url = "mongodb://localhost:27017/twitterbot";
const getParams = {  q: '@Sound_Pic', count: 100 };
const interval = 1000 * 60 * 1;


Mongoclient.connect(url, mongoConnect);

function runApp(collection){
    console.log('running');
 
    Tweets.pushTweets(T, getParams, collection);
    Tweets.getMedia(T, collection);
   
    setTimeout(()=>{
	 runApp(collection);	
	}, interval);

}


function mongoConnect(err, db){
  if(err){
  console.log(err);
}
    else{  
	console.log('...'); 
	var collection = db.collection('tweets');
	collection.createIndex({ "id" : 1 }, { unique : true });

    runApp(collection);
   }
}


