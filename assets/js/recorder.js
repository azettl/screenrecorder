const videoElem = document.getElementById("video");
const logElem = document.getElementById("log");
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");
const chunks = [];
const recording = null;
// Options for getDisplayMedia()

var displayMediaOptions = {
  video: {
    cursor: "always"
  },
  audio: false
};

// Set event listeners for the start and stop buttons
startElem.addEventListener("click", function(evt) {
  startCapture();
}, false);

stopElem.addEventListener("click", function(evt) {
  stopCapture();
}, false); console.log = msg => logElem.innerHTML += `${msg}<br>`;
console.error = msg => logElem.innerHTML += `<span class="error">${msg}</span><br>`;
console.warn = msg => logElem.innerHTML += `<span class="warn">${msg}<span><br>`;
console.info = msg => logElem.innerHTML += `<span class="info">${msg}</span><br>`; 

async function startCapture() {
  logElem.innerHTML = "";

  if (recording) {
    window.URL.revokeObjectURL(recording);
  }

  try {
    var currentVideo = videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

    mediaRecorder = new MediaRecorder(currentVideo, {mimeType: 'video/webm'});
    mediaRecorder.addEventListener('dataavailable', event => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    });
    mediaRecorder.start(10);

    dumpOptionsInfo();
  } catch(err) {
    console.error("Error: " + err);
  }
} 

function stopCapture(evt) {
  let tracks = videoElem.srcObject.getTracks();

  tracks.forEach(track => track.stop());

  recording = window.URL.createObjectURL(new Blob(chunks, {type: 'video/webm'}));

    document.getElementById("resultLink").addEventListener('progress', e => console.log(e));
    document.getElementById("resultLink").href = recording;

  videoElem.srcObject = null;
} 

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];
 
  console.info("Track settings:");
  console.info(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.info("Track constraints:");
  console.info(JSON.stringify(videoTrack.getConstraints(), null, 2));
}