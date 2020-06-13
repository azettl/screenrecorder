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
        // Clear Data from the Previous Recording
            videoElem.srcObject    = null;
            videoElem.src          = "";
            chunksElem.innerHTML   = "";
            aSingleChunkRecordings = [];
            aFullChunkRecordings   = [];

            if (oFullObjectURL) {
                window.URL.revokeObjectURL(oFullObjectURL);
            }

        // Change Button Text to "Stop Capture" and Hide the Download Button + One Second Chunks Section
            buttonElem.innerHTML      = '<i class="fa fa-stop-circle" aria-hidden="true"></i> Stop Capture';
            webmDowElem.style.display = "none";
            chunksHElem.style.display = "none";

        // Try to Record the Screen
        try {
            // Get the Current Screen and assign it to the Video Elements Source Object 
            // and the currentVideo Constant. Stop the Recording when the User Stops Sharing his Screen
            // via the "inactive" Event.
                const currentVideo = videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(
                    {
                        video: {
                            cursor: "always"
                        },
                        audio: true
                    }
                );

                currentVideo.addEventListener(
                    'inactive', 
                    (event) => {
                        stopCapture(event);
                    }
                );

            // Define the MediaRecorder for the Full Video Recording and Push the Data to the 
            // aFullChunkRecordings Array whenever Data is Available.
                const mediaRecorder = new MediaRecorder(
                    currentVideo, 
                    {
                        mimeType: 'video/webm'
                    }
                );

                mediaRecorder.addEventListener(
                    'dataavailable', 
                    (event) => {
                        if (event.data && event.data.size > 0) {
                            aFullChunkRecordings.push(event.data);
                        }
                    }
                );

                // Start Recording and Set the isRecordingRunning Variable to TRUE
                mediaRecorder.start(10);
                isRecordingRunning = true;

                // Define the MediaRecorders for the Single One Second Chunks
                var singleChunks = [];

                // The First Chunk is handled Outside of the Interval and Push the Data to the 
                // singleChunks Array whenever Data is Available. When the Recording Stops then
                // the singleChunks Array gets pushed into the aSingleChunkRecordings Array as 
                // a BLOB.
                    const mediaRecorderCunk = new MediaRecorder(
                        currentVideo, 
                        {
                            mimeType: 'video/webm'
                        }
                    );    

                    mediaRecorderCunk.addEventListener(
                        'dataavailable', 
                        (event) => {
                            if (event.data && event.data.size > 0) {
                                singleChunks.push(event.data);
                            }
                        }
                    );

                    mediaRecorderCunk.onstop = function(e){
                        aSingleChunkRecordings.push(new Blob(singleChunks));
                    };

                    // Start the Recording and Stop after One Second
                    mediaRecorderCunk.start(10);
                    setTimeout(
                        function(){
                            mediaRecorderCunk.stop()
                        }, 
                        1000
                    );

                // The Other Chunks are handled Inside the Interval and Push the Data to the 
                // singleChunks Array whenever Data is Available. When the Recording Stops then
                // the singleChunks Array gets pushed into the aSingleChunkRecordings Array as 
                // a BLOB.
                    oSingleChunkInterval = setInterval(()=>{
                        const mediaRecorderCunk = new MediaRecorder(
                            currentVideo, 
                            {
                                mimeType: 'video/webm'
                            }
                        );    

                        mediaRecorderCunk.addEventListener(
                            'dataavailable', 
                            (event) => {
                                if (event.data && event.data.size > 0) {
                                    singleChunks.push(event.data);
                                }
                            }
                        );

                        mediaRecorderCunk.onstop = function(e){
                            aSingleChunkRecordings.push(new Blob(singleChunks));
                        };
                        
                        // Start the Recording and Stop after One Second
                        mediaRecorderCunk.start(10);
                        setTimeout(
                            function(){
                                mediaRecorderCunk.stop()
                            }, 
                            1000
                        );
                    }, 
                    1000
                );
        } catch(err) {
            console.error("Error: " + err);
        }
    } 

function stopCapture(evt) {
  loaderElem.style.display = "block";
  clearInterval(oSingleChunkInterval);
  let tracks = videoElem.srcObject.getTracks();
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

      chunksElem.appendChild(videoChunkDivElem);
      iChunkCount++;
    }
  );
  loaderElem.style.display = "none";
} 