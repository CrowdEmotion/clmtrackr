var fs = require('fs');

// http://stackoverflow.com/a/171256/384336
function merge_options(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

function putYuv2Rgb(ctx, width, height, yuvBuffer) {
  var idata = ctx.createImageData(width, height);
  var buffer = idata.data;
  var len = buffer.length;
  
  for(var i=0, p=0; i < len; i += 4, p += 3) {

      /// get YUV bytes
      y = yuvBuffer[p];
      u = yuvBuffer[p + 1] - 128;
      v = yuvBuffer[p + 2] - 128;

      /// convert to RGB and copy to canvas buffer
      buffer[i]     = y + v * 1.402 + 0.5;
      buffer[i + 1] = y - u * 0.344 - v * 0.714 + 0.5;
      buffer[i + 2] = y + u * 1.772 + 0.5;
      buffer[i + 3] = 255;
  }

  /// update canvas with converted buffer
  ctx.putImageData(idata, 0, 0);    
}

function putYuv420p2Rgb(ctx, width, height, data) {
  var idata = ctx.createImageData(width, height);
  var buffer = idata.data;

  var size = width * height;  // data.length;

  for (var i=0; i < height; i++) {
    for (var j=0; j < width; j++) {
      
      var Y = data[i*width + j];
      var U = data[Math.floor((i/2)*(width/2)+(j/2)) + size];
      var V = data[Math.floor((i/2)*(width/2)+(j/2)) + size + Math.floor(size / 4)];

      var R = Y + 1.402 * (V - 128);
      var G = Y - 0.344 * (U - 128) - 0.714 * (V - 128);
      var B = Y + 1.772 * (U - 128);

      if (R < 0){ R = 0; } if (G < 0){ G = 0; } if (B < 0){ B = 0; }
      if (R > 255 ){ R = 255; } if (G > 255) { G = 255; } if (B > 255) { B = 255; }

      // blue component's value from the pixel at column 200, row 50
      // blueComponent = imageData.data[((50*(imageData.width*4)) + (200*4)) + 2];
      // var index = (i*(width*4)) + (j*4);
      var index = (j + i * width) * 4;

      buffer[index +0] = R;
      buffer[index +1] = G;
      buffer[index +2] = B;
      buffer[index +3] = 255;
    }
  }
      
  // update canvas with converted buffer
  ctx.putImageData(idata, 0, 0);
}

function putDataInCanvas(ctx, width, height, data) {
  var idata = ctx.createImageData(width, height);
  var buffer = idata.data;
  var len = buffer.length;
  
  for(var i=0, p=0; i < len; i += 4, p += 3) {

      /// get YUV bytes
      y = data[p];
      u = data[p + 1];
      v = data[p + 2];

      /// convert to RGB and copy to canvas buffer
      buffer[i]     = y;
      buffer[i + 1] = u;
      buffer[i + 2] = v;
      buffer[i +3] = 255;
  }

  /// update canvas with converted buffer
  ctx.putImageData(idata, 0, 0);    
}


var demux = require('node-demux');
var clmtrackr_js = require('./clm.js');
// var clmtrackr_js = require('./clmtrackr.js');

var canvas = null, canvasCC = null, videoMetadata = null;

var pModel_js = require('../models/model_pca_20_svm_emotionDetection.js');
var emotion_classifier_js = require('../examples/js/emotion_classifier.js');
var emotionmodel2_js = require('../examples/js/emotionmodel2.js');

// var Canvas = typeof document == 'undefined' ? require('canvas') : null;
// var canvas = (typeof document == 'undefined' ? new Canvas(200, 200) : document.createElement('canvas'));
// console.log(canvas);

var ctrack = new clm.tracker({useWebGL : false});
ctrack.init(pModel); 

var ec = new emotionClassifier();
ec.init(emotionModel);
 
var start;
var nframes;
 
var video = new demux();
video.on('error', function(err) {
    console.log(err);
});
video.on('metadata', function(metadata) {
	nframes = 0;
  console.log(metadata);

  /*
  { width: 640,
    height: 480,
    display_aspect_ratio: 1.3333333333333333,
    num_frames: 168,
    frame_rate: 25,
    duration: 6.934,
    pixel_format: 'yuv420p' }
  */
  
  videoMetadata = metadata;
  canvas = new Canvas(metadata.width, metadata.height);
  canvas.tagName = 'CANVAS';
  canvasCC = canvas.getContext('2d');
});
video.on('start', function() {
    start = Date.now();
    console.log("start demuxing");
});
video.on('end', function() {
    var time = (Date.now() - start) / 1000;
    console.log("finished demuxing");
    console.log("  total time: " + time.toFixed(3) + "sec");
    console.log("  average frames per second: " + (nframes/time).toFixed(3) + "fps");
});
video.on('frame', function(frameIdx, data) {
  // if(frameIdx == 0)
  //   video.stop();

  // if(frameIdx < 69)
  //   return;

  nframes++;
  // console.log(data.constructor); // == Buffer
  
  // ctrack.start(vid);

  // canvasCC.clearRect(0, 0, videoMetadata.width, videoMetadata.height);
  // var img = new Image;
  // img.onload = function(){
  //   console.log('!');
  //   ctrack.track(canvas);
  // };
  // img.onerror = function(e){
  //   console.log(e);
  // };
  // img.src = data;
  
  // canvasCC.drawImage(img, 0, 0, videoMetadata.width, videoMetadata.height);

  // putYuv2Rgb(canvasCC, videoMetadata.width, videoMetadata.height, data);
  putYuv420p2Rgb(canvasCC, videoMetadata.width, videoMetadata.height, data);
  // putDataInCanvas(canvasCC, videoMetadata.width, videoMetadata.height, data);
  
  console.log("received frame " + frameIdx + " (size: " + data.length + ")");
  
  // console.log(canvas.toDataURL());
  // 
  // var out = fs.createWriteStream(__dirname + '/_i_'+ frameIdx +'.png'), stream = canvas.pngStream();
  // stream.on('data', function(chunk){ out.write(chunk); });
  // stream.on('end', function(){ console.log('saved png'); });  
  
  if(ctrack.track(canvas)) {
    console.log('=> FOUND');
    
    var cp = ctrack.getCurrentParameters();    
    // var er = ec.predict(cp);
    var er = ec.meanPredict(cp);
    console.log(er);
    
  } else {
    console.log('=> NOT FOUND');
  }

});

// var vfile = "../examples/videos/meg.mp4";
var vfile = '/Users/diego/Movies/video.mp4';
// var vfile = "/Users/diego/Movies/ce/25004a6452.mp4";
video.load(vfile);
video.play();


// fs.readFile('../examples/media/audrey_crop.jpg', function(err, data){
//   if (err) throw err;
//   var img = new Image;
//   img.src = data;
// 
//   var canvas = new Canvas(img.width, img.height);
//   var ctx = canvas.getContext('2d');
//   ctx.drawImage(img, 0, 0, img.width, img.height);
//   fs.writeFileSync('_i_audrey_crop.data', canvas.toDataURL());
// });


// fs.readFile('meg-1.rgb', function(err, data){
//   if (err) throw err;
//   
//   var width=640, height=480;
//   var canvas = new Canvas(width, height);
//   var ctx = canvas.getContext('2d');
//   var idata = ctx.createImageData(width, height);
// 
//   for(var i=0, p=0; i < idata.data.length; i += 4, p += 3) {
//       idata.data[i]    = data[p];
//       idata.data[i +1] = data[p +1];
//       idata.data[i +2] = data[p +2];
//       idata.data[i +3] = 255;
//   }
//   
//   ctx.putImageData(idata, 0, 0);  
//   fs.writeFileSync('_i_meg_rgb.data', canvas.toDataURL());
// });
