/**
 * Main File for the Screenrecording
 */

// Define Element Constants
const videoElem   = document.getElementById("video");
const buttonElem  = document.getElementById("button");
const loaderElem  = document.getElementById("loader");
const chunksElem  = document.getElementById("videoChunks");
const chunksHElem = document.getElementById("videoChunksHeading");
const mp4DowElem  = document.getElementById("resultLinkMP4");
const webmDowElem = document.getElementById("resultLinkWEBM");

var chunks = [];
var running = false;
var chunkRecordings = [];
var chunkRecordingsRaw = [];
var recordingMP4 = null;
var recordingWEBM = null;
var int = null;
// Options for getDisplayMedia()

window.onload = function(){
  loaderElem.style.display = "none";
};

var displayMediaOptions = {
  video: {
    cursor: "always"
  },
  audio: true
};

// Set event listeners for the start and stop buttons
buttonElem.addEventListener("click", function(evt) {
    if(running){
        stopCapture();
    }else{
        startCapture();
    }
}, false);


async function startCapture() {

    videoElem.srcObject = null;
    let videoChunks = chunksElem;
    videoChunks.innerHTML = "";
    videoElem.src = "";
    chunkRecordings = [];
    chunkRecordingsRaw = [];
    chunks = [];

    if (recordingMP4) {
      window.URL.revokeObjectURL(recordingMP4);
    }
    if (recordingWEBM) {
      window.URL.revokeObjectURL(recordingWEBM);
    }
  buttonElem.innerHTML = '<i class="fa fa-stop-circle" aria-hidden="true"></i> Stop Capture';
  mp4DowElem.style.display = "none";
  webmDowElem.style.display = "none";
  chunksHElem.style.display = "none";

  try {
    var currentVideo = videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    currentVideo.addEventListener('inactive', e => {
      stopCapture(e);
    });

    const mediaRecorder = new MediaRecorder(currentVideo, {mimeType: 'video/webm'});
    mediaRecorder.addEventListener('dataavailable', event => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    });

    var singleChunks = [];
    // First Chunk
    const mediaRecorderCunk = new MediaRecorder(currentVideo, {mimeType: 'video/webm'});    
    mediaRecorderCunk.ondataavailable = e => singleChunks.push(e.data);
    mediaRecorderCunk.onstop = function(e){
        chunkRecordings.push(new Blob(singleChunks));
        chunkRecordingsRaw.push(singleChunks);
    };
    mediaRecorderCunk.start(10);
    setTimeout(
        function(){
            mediaRecorderCunk.stop()
        }, 
        1000
    );
    // Other Chunks
    int = setInterval(()=>{
        const mediaRecorderCunk = new MediaRecorder(currentVideo, {mimeType: 'video/webm'});    
        mediaRecorderCunk.ondataavailable = e => singleChunks.push(e.data);
        mediaRecorderCunk.onstop = function(e){
            chunkRecordings.push(new Blob(singleChunks));
            chunkRecordingsRaw.push(singleChunks);
        };
        mediaRecorderCunk.start(10);
        setTimeout(
            function(){
                mediaRecorderCunk.stop()
            }, 
            1000
        );
    }, 1000);

    mediaRecorder.start(10);
    running = true;
    dumpOptionsInfo();
  } catch(err) {
    console.error("Error: " + err);
  }
} 

function stopCapture(evt) {
  loaderElem.style.display = "block";
  clearInterval(int);
  let tracks = videoElem.srcObject.getTracks();
  let videoChunks = chunksElem;
  tracks.forEach(track => track.stop());
  
  recordingMP4 = window.URL.createObjectURL(new Blob(chunks, {type: 'video/mp4'}));
  recordingWEBM = window.URL.createObjectURL(new Blob(chunks, {type: 'video/webm'}));
  running = false;
  buttonElem.innerHTML = '<i class="fa fa-play-circle" aria-hidden="true"></i> Start Capture';
  mp4DowElem.addEventListener('progress', e => console.log(e));
  mp4DowElem.href = recordingMP4;
  mp4DowElem.style.display = "inline-block";
  webmDowElem.addEventListener('progress', e => console.log(e));
  webmDowElem.href = recordingWEBM;
  webmDowElem.style.display = "inline-block";
  chunksHElem.style.display = "inline-block";

  

  videoElem.srcObject = null;
  videoElem.src = recordingWEBM;
  videoElem.play();

  var iChunkCount = 1;
  chunkRecordings.forEach(
    function(chunkRecording){
      var videoChunkDivElem = document.createElement("div");
      videoChunkDivElem.classList.add("chunk");

      var videoChunkHeadElem = document.createElement("h3");
      videoChunkHeadElem.innerText = "Chunk #" + iChunkCount;
      videoChunkDivElem.appendChild(videoChunkHeadElem);

      var videoChunkElem = document.createElement("video");
      videoChunkElem.setAttribute("controls", "true");

      var videoChunkBlob = window.URL.createObjectURL(chunkRecording);
      videoChunkElem.src = videoChunkBlob;
      videoChunkDivElem.appendChild(videoChunkElem);

      var videoChunkAElem = document.createElement("a");
      videoChunkAElem.innerHTML = '<i class="fa fa-arrow-circle-down" aria-hidden="true"></i> Download WEBM';
      videoChunkAElem.classList.add("button");
      videoChunkAElem.href = videoChunkBlob;
      videoChunkAElem.download = "screenrecording-chunk-" + iChunkCount + ".webm";
      videoChunkDivElem.appendChild(videoChunkAElem);

      videoChunks.appendChild(videoChunkDivElem);
      iChunkCount++;
    }
  );

  
  var videoChunkElem = document.createElement("video");
  videoChunkElem.setAttribute("controls", "true");
  videoChunkElem.classList.add("chunkResult");

  var removed = chunkRecordingsRaw;
  var newChunks = [];
  removed.forEach(
    function(chunkRecording){
        newChunks.push(new Blob(chunkRecording));
    }
  );

  var newvideoChunkBlob = window.URL.createObjectURL(new Blob(newChunks, {type: 'video/webm'}));
  videoChunkElem.src = newvideoChunkBlob;
  loaderElem.style.display = "none";
 // window.URL.revokeObjectURL(videoChunkBlob);
  //videoChunks.appendChild(videoChunkElem);
  //videoElem.play();
} 

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];
 
  console.info("Track settings:");
  console.info(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.info("Track constraints:");
  console.info(JSON.stringify(videoTrack.getConstraints(), null, 2));
}