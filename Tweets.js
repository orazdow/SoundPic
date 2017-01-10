const mediaproc = require('./tweetmedia');
const path = require('path');
const ObjectId = require('mongodb').ObjectID;


function pushTweets(T, params, collection){
T.get('search/tweets', params,(err, data, response)=>{

var tweets = data.statuses;
collection.insert(tweets, { ordered: false })

 .catch(function(err) {
  //catch fails on duplicates.
 });

});

}


function getMedia(T, collection){
var opts = { 'entities.media.media_url': { $exists: true }, 'vidhandled' : { $exists: false } };
collection.find(opts).toArray(function(err, docs){

if(err){console.log(err); return;}

console.log(docs.length);

for(var i = 0; i < docs.length; i++){
  
  var tdata = {
    pathname : '',
    mediaurl : '',
    type : '',
    vidpath : '',
    mongo_id : null,
    inreply_id : '',
    atuser : '',
    mentions : []
  }

setFields(tdata, docs[i], i);

if(tdata.type === 'photo'){

mediaproc.download(tdata.mediaurl, tdata.pathname, tdata, (imgpath, tdata1)=>{
  console.log(imgpath);

   mediaproc.makeVid(imgpath, tdata1, (vidpath, tdata2)=>{
    tdata2.vidpath = vidpath;

     mediaproc.upload(T, tdata2, (data, id)=>{
   
     collection.update({ "_id" : ObjectId(id) }, 
      {$set : {"vidhandled": true }}, {upsert:false});
       console.log('done:',data.text, id);

     })
    
	
  });


});


    }

 }

});



function setFields(tdata, doc, i){

tdata.type = doc.extended_entities.media[0].type;
tdata.inreply_id  = doc.id_str; 
tdata.atuser = '@'+doc.user.screen_name;
tdata.mentions = doc.entities.user_mentions;
tdata.mongo_id = doc._id;

tdata.mentions.forEach((el, i)=>{
  if(el.screen_name === 'Sound_Pic'){   
    tdata.mentions.splice(i,1);
  } 
});

if(tdata.type === 'photo'){
     tdata.pathname = path.join(__dirname, '/media/img'+i+'.jpg'); 
     tdata.mediaurl = doc.entities.media[0].media_url_https;
  }else if(tdata.type === 'video'){
     tdata.pathname = path.join(__dirname, '/media/vid'+i+'.mp4'); 
     var bestindex = midBitrateIndex(doc.extended_entities.media[0].video_info.variants);
      tdata.mediaurl = doc.extended_entities.media[0].video_info.variants[bestindex].url;
     }else if(tdata.type === 'animated_gif'){
      //handle gifs as photos for now
        tdata.pathname = path.join(__dirname, '/media/img'+i+'.jpg'); 
        tdata.mediaurl = doc.entities.media[0].media_url_https;
     }
   else{
    console.log('error');
    process.exit(1);
  }

function midBitrateIndex(arr){ 
   for (var i = 0; i < arr.length; i++) {
      arr[i].index = i;
    } 
   var bitrates = arr.filter((a)=>{
         return a.content_type === 'video/mp4';
   });
   bitrates.sort((a, b)=>{
       return a.bitrate - b.bitrate;
   });
  
   if(bitrates.length > 2){
    return bitrates[bitrates.length -2].index;
   }else{
    return bitrates[bitrates.length -1].index;
   }

}

}


}



module.exports = {

	pushTweets : pushTweets,
	getMedia : getMedia

}
