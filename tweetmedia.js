const fs = require('fs');
const spawn = require('child_process').spawn;
const https = require('https');
const ObjectId = require('mongodb').ObjectID;


var download = function(url, fname, tdata, cb) {
  var file = fs.createWriteStream(fname);
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb(fname, tdata));
    });
  });
}


var makeVid = function(fname, tdata, cb){

var outpath = fname.substring(0,fname.lastIndexOf('.')) + '.mp4';

try{
const proc = spawn('java -jar imgtovid.jar', [fname, outpath], {cwd: './media', shell: true}); 
proc.on('exit', ()=>{

  tdata.vidpath = outpath;
	cb(tdata);
});
}
catch(err){
console.log(err);
}

}



var upload = function(T, tdata, cb){
 console.log('uploading: '+ tdata.vidpath); 

T.postMediaChunked({ file_path: tdata.vidpath }, (err, data)=> {
 
  var mediaid = data.media_id_string;
  
  var mentions = '';
  for(var i = 0; i < tdata.mentions.length; i++){
    mentions += ' @'+tdata.mentions[i].screen_name ;
  }

  var tweettext = tdata.atuser+mentions+' Here is your sound pic';
  
  var opts = {status : tweettext, media_ids : mediaid, in_reply_to_status_id : tdata.inreply_id};
  
  T.post('statuses/update', opts , function (err, data, response) {
    if(err){
      console.log(err)
    }
    else{
      cb(data, tdata.mongo_id);
    }
    
  });


});


}

var update = function(collection, tdata, cb){
collection.update({ "_id" : ObjectId(tdata.mongo_id) },  
{$set : {"vidhandled": true }}, {upsert:false}, (err, res)=>{
     cb(tdata.mongo_id);
});

}


module.exports = {
	download : download,
	makeVid : makeVid,
  upload : upload,
  update : update
}