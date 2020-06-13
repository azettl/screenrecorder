/**
 * Main File for the Screenrecording
 */

// Define Element Constants
    const videoElem   = document.getElementById("video");
    const buttonElem  = document.getElementById("button");
    const loaderElem  = document.getElementById("loader");
    const chunksElem  = document.getElementById("videoChunks");
    const chunksHElem = document.getElementById("videoChunksHeading");
    const webmDowElem = document.getElementById("resultLinkWEBM");

// Define Global Variables
    var isRecordingRunning     = false;

    var oSingleChunkInterval   = null;
    var oFullObjectURL         = null;

    var aSingleChunkRecordings = [];
    var aFullChunkRecordings   = [];

// Hide Loader Element when the DOM Content is Loaded
    document.addEventListener(
        "DOMContentLoaded", 
        (event) => {
            loaderElem.style.display = "none";
        }
    );

// Attach Event Listener to the Start/Stop Recording Button
    buttonElem.addEventListener(
        "click", 
        (event) => {
            if(isRecordingRunning){
                stopCapture();
            }else{
                startCapture();
            }
        }, 
        false
    );

// Definition of the async startCapture function



async function startCapture() {

    videoElem.srcObject = null;
    let videoChunks = chunksElem;
    videoChunks.innerHTML = "";
    videoElem.src = "";
    aSingleChunkRecordings = [];
    aFullChunkRecordings = [];

    if (oFullObjectURL) {
      window.URL.revokeObjectURL(oFullObjectURL);
    }
  buttonElem.innerHTML = '<i class="fa fa-stop-circle" aria-hidden="true"></i> Stop Capture';
  webmDowElem.style.display = "none";
  chunksHElem.style.display = "none";

  try {
    var currentVideo = videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        },
        audio: true
      });
    currentVideo.addEventListener('inactive', e => {
      stopCapture(e);
    });

    const mediaRecorder = new MediaRecorder(currentVideo, {mimeType: 'video/webm'});
    mediaRecorder.addEventListener('dataavailable', event => {
      if (event.data && event.data.size > 0) {
        aFullChunkRecordings.push(event.data);
      }
    });

    var singleChunks = [];
    // First Chunk
    const mediaRecorderCunk = new MediaRecorder(currentVideo, {mimeType: 'video/webm'});    
    mediaRecorderCunk.ondataavailable = e => singleChunks.push(e.data);
    mediaRecorderCunk.onstop = function(e){
        aSingleChunkRecordings.push(new Blob(singleChunks));
    };
    mediaRecorderCunk.start(10);
    setTimeout(
        function(){
            mediaRecorderCunk.stop()
        }, 
        1000
    );
    // Other Chunks
    oSingleChunkInterval = setInterval(()=>{
        const mediaRecorderCunk = new MediaRecorder(currentVideo, {mimeType: 'video/webm'});    
        mediaRecorderCunk.ondataavailable = e => singleChunks.push(e.data);
        mediaRecorderCunk.onstop = function(e){
            aSingleChunkRecordings.push(new Blob(singleChunks));
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
    isRecordingRunning = true;
  } catch(err) {
    console.error("Error: " + err);
  }
} 

function stopCapture(evt) {
  loaderElem.style.display = "block";
  clearInterval(oSingleChunkInterval);
  let tracks = videoElem.srcObject.getTracks();
  let videoChunks = chunksElem;
  tracks.forEach(track => track.stop());
  
  oFullObjectURL = window.URL.createObjectURL(new Blob(aFullChunkRecordings, {type: 'video/webm'}));
  isRecordingRunning = false;
  buttonElem.innerHTML = '<i class="fa fa-play-circle" aria-hidden="true"></i> Start Capture';
  webmDowElem.addEventListener('progress', e => console.log(e));
  webmDowElem.href = oFullObjectURL;
  webmDowElem.style.display = "inline-block";
  chunksHElem.style.display = "inline-block";

  

  videoElem.srcObject = null;
  videoElem.src = oFullObjectURL;
  videoElem.play();

  var iChunkCount = 1;
  aSingleChunkRecordings.forEach(
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
  loaderElem.style.display = "none";
} 