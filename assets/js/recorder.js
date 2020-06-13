const videoElem = document.getElementById("video");
const buttonElem = document.getElementById("button");
var chunks = [];
var running = false;
var chunkRecordings = [];
var chunkRecordingsRaw = [];
var recordingMP4 = null;
var recordingWEBM = null;
var int = null;
// Options for getDisplayMedia()

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
    if (recordingMP4) {
      window.URL.revokeObjectURL(recordingMP4);
    }
    if (recordingWEBM) {
      window.URL.revokeObjectURL(recordingWEBM);
    }
  buttonElem.innerHTML = '<i class="fa fa-stop-circle" aria-hidden="true"></i> Stop Capture';
  document.getElementById("resultLinkMP4").style.display = "none";
  document.getElementById("resultLinkWEBM").style.display = "none";

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
  clearInterval(int);
  let tracks = videoElem.srcObject.getTracks();
  let videoChunks = document.getElementById("videoChunks");
  tracks.forEach(track => track.stop());
  
  recordingMP4 = window.URL.createObjectURL(new Blob(chunks, {type: 'video/mp4'}));
  recordingWEBM = window.URL.createObjectURL(new Blob(chunks, {type: 'video/webm'}));
  running = false;
  buttonElem.innerHTML = '<i class="fa fa-play-circle" aria-hidden="true"></i> Start Capture';
  document.getElementById("resultLinkMP4").addEventListener('progress', e => console.log(e));
  document.getElementById("resultLinkMP4").href = recordingMP4;
  document.getElementById("resultLinkMP4").style.display = "inline-block";
  document.getElementById("resultLinkWEBM").addEventListener('progress', e => console.log(e));
  document.getElementById("resultLinkWEBM").href = recordingWEBM;
  document.getElementById("resultLinkWEBM").style.display = "inline-block";

  videoElem.srcObject = null;
  videoElem.src = recordingWEBM;

  
  chunkRecordings.forEach(
    function(chunkRecording){
      console.log(chunkRecording);
      var videoChunkElem = document.createElement("video");
      videoChunkElem.setAttribute("controls", "true");
      videoChunkElem.classList.add("chunk");

      var videoChunkBlob = window.URL.createObjectURL(chunkRecording);
      videoChunkElem.src = videoChunkBlob;
      //window.URL.revokeObjectURL(videoChunkBlob);

      videoChunks.appendChild(videoChunkElem);
    }
  );

  
  var videoChunkElem = document.createElement("video");
  videoChunkElem.setAttribute("controls", "true");
  videoChunkElem.classList.add("chunkResult");

  var removed = chunkRecordingsRaw;
  var newChunks = [];
  removed.forEach(
    function(chunkRecording){
        newChunks.push(new Blob(chunkRecording, {type: 'video/webm'}));
    }
  );

  var videoChunkBlob = window.URL.createObjectURL(new Blob(newChunks, {type: 'video/webm'}));
  videoChunkElem.src = videoChunkBlob;
 // window.URL.revokeObjectURL(videoChunkBlob);
  videoChunks.appendChild(videoChunkElem);
  //videoElem.play();
} 

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];
 
  console.info("Track settings:");
  console.info(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.info("Track constraints:");
  console.info(JSON.stringify(videoTrack.getConstraints(), null, 2));
}