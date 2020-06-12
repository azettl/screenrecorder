const videoElem = document.getElementById("video");
const buttonElem = document.getElementById("button");
var chunks = [];
var recording = null;
var running = false;
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
  if (recording) {
    window.URL.revokeObjectURL(recording);
  }
  buttonElem.innerHTML = '<i class="fa fa-stop-circle" aria-hidden="true"></i> Stop Capture';
  document.getElementById("resultLink").style.display = "none";

  try {
    var currentVideo = videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    currentVideo.addEventListener('inactive', e => {
      stopCapture(e);
    });

    mediaRecorder = new MediaRecorder(currentVideo, {mimeType: 'video/webm'});
    mediaRecorder.addEventListener('dataavailable', event => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    });
    mediaRecorder.start(10);
    running = true;
    dumpOptionsInfo();
  } catch(err) {
    console.error("Error: " + err);
  }
} 

function stopCapture(evt) {
  let tracks = videoElem.srcObject.getTracks();

  tracks.forEach(track => track.stop());
  
  recording = window.URL.createObjectURL(new Blob(chunks, {type: 'video/webm'}));
  running = false;
  
  buttonElem.innerHTML = '<i class="fa fa-play-circle" aria-hidden="true"></i> Start Capture';
    document.getElementById("resultLink").addEventListener('progress', e => console.log(e));
    document.getElementById("resultLink").href = recording;
    document.getElementById("resultLink").style.display = "inline-block";

} 

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];
 
  console.info("Track settings:");
  console.info(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.info("Track constraints:");
  console.info(JSON.stringify(videoTrack.getConstraints(), null, 2));
}