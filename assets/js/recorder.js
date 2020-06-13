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
    const gifDowElem  = document.getElementById("resultLinkGIF");
    const chunkLeElem = document.getElementById("singleChunkLengthInSec");

// Define Global Variables
    var isRecordingRunning     = false;

    var oSingleChunkInterval   = null;
    var oFullObjectURL         = null;

    var aSingleChunkRecordings = [];
    var aFullChunkRecordings   = [];
    var aMediaRecordersChunks  = [];
    var iMediaRecordersChunkC  = 0;

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

                mediaRecorder.addEventListener(
                    'inactive', 
                    (event) => {
                        mediaRecorder.stop();
                    }
                );

                // Start Recording and Set the isRecordingRunning Variable to TRUE
                mediaRecorder.start(10);
                isRecordingRunning = true;

                // Define the MediaRecorders for the Single One Second Chunks
                var iSingleChunkLengthInMS = parseInt(chunkLeElem.value) * 1000;
                var singleChunks           = [];

                // The First Chunk is handled Outside of the Interval and Push the Data to the 
                // singleChunks Array whenever Data is Available. When the Recording Stops then
                // the singleChunks Array gets pushed into the aSingleChunkRecordings Array as 
                // a BLOB.
                    aMediaRecordersChunks[iMediaRecordersChunkC] = new MediaRecorder(
                        currentVideo, 
                        {
                            mimeType: 'video/webm'
                        }
                    );    

                    aMediaRecordersChunks[iMediaRecordersChunkC].addEventListener(
                        'dataavailable', 
                        (event) => {
                            if (event.data && event.data.size > 0) {
                                singleChunks.push(event.data);
                            }
                        }
                    );

                    aMediaRecordersChunks[iMediaRecordersChunkC].onstop = function(e){
                        aSingleChunkRecordings.push(new Blob(singleChunks));
                    };

                    aMediaRecordersChunks[iMediaRecordersChunkC].addEventListener(
                        'inactive', 
                        (event) => {
                            aMediaRecordersChunks[iMediaRecordersChunkC].stop();
                        }
                    );

                    // Start the Recording and Stop after One Second
                    aMediaRecordersChunks[iMediaRecordersChunkC].start(10);
                    setTimeout(
                        function(){
                            if(aMediaRecordersChunks[iMediaRecordersChunkC].state == "recording"){
                                aMediaRecordersChunks[iMediaRecordersChunkC].stop();
                            }
                        }, 
                        iSingleChunkLengthInMS
                    );

                // The Other Chunks are handled Inside the Interval and Push the Data to the 
                // singleChunks Array whenever Data is Available. When the Recording Stops then
                // the singleChunks Array gets pushed into the aSingleChunkRecordings Array as 
                // a BLOB.
                    oSingleChunkInterval = setInterval(()=>{
                        iMediaRecordersChunkC++;

                        aMediaRecordersChunks[iMediaRecordersChunkC] = new MediaRecorder(
                            currentVideo, 
                            {
                                mimeType: 'video/webm'
                            }
                        );    

                        aMediaRecordersChunks[iMediaRecordersChunkC].addEventListener(
                            'dataavailable', 
                            (event) => {
                                if (event.data && event.data.size > 0) {
                                    singleChunks.push(event.data);
                                }
                            }
                        );

                        aMediaRecordersChunks[iMediaRecordersChunkC].addEventListener(
                            'inactive', 
                            (event) => {
                                aMediaRecordersChunks[iMediaRecordersChunkC].stop();
                            }
                        );

                        aMediaRecordersChunks[iMediaRecordersChunkC].onstop = function(e){
                            aSingleChunkRecordings.push(new Blob(singleChunks));
                        };
                        
                        // Start the Recording and Stop after One Second
                        aMediaRecordersChunks[iMediaRecordersChunkC].start(10);
                        setTimeout(
                            function(){
                                if(aMediaRecordersChunks[iMediaRecordersChunkC].state == "recording"){
                                    aMediaRecordersChunks[iMediaRecordersChunkC].stop();
                                }
                            }, 
                            iSingleChunkLengthInMS
                        );
                    }, 
                    iSingleChunkLengthInMS
                );
        } catch(err) {
            console.error("Error: " + err);
        }
    } 

// Definition of the stopCapture function
    function stopCapture(evt) {
        // Set the isRecordingRunning Variable to FALSE cause the stopped the Recording
            isRecordingRunning = false;

        // Set Button Label to Start Capture
            buttonElem.innerHTML = '<i class="fa fa-play-circle" aria-hidden="true"></i> Start Capture';

        // Change Chunk Header
            var iSingleChunkLengthInMS = parseInt(chunkLeElem.value) * 1000;
            var sSpelledNumber         = "";

            switch (iSingleChunkLengthInMS){
                case 1000:
                    sSpelledNumber = "One";
                    break;
                case 2000:
                    sSpelledNumber = "Two";
                    break;
                case 3000:
                    sSpelledNumber = "Three";
                    break;
                case 4000:
                    sSpelledNumber = "Four";
                    break;
                case 5000:
                    sSpelledNumber = "Five";
                    break;
                case 6000:
                    sSpelledNumber = "Six";
                    break;
                case 7000:
                    sSpelledNumber = "Seven";
                    break;
                case 8000:
                    sSpelledNumber = "Eight";
                    break;
                case 9000:
                    sSpelledNumber = "Nine";
                    break;
                case 10000:
                    sSpelledNumber = "Ten";
                    break;
                case 11000:
                    sSpelledNumber = "Eleven";
                    break;
                case 12000:
                    sSpelledNumber = "Twelve";
                    break;
                case 13000:
                    sSpelledNumber = "Thirteen";
                    break;
                case 14000:
                    sSpelledNumber = "Fourteen";
                    break;
                case 15000:
                    sSpelledNumber = "Fifteen";
                    break;
            }
            chunksHElem.innerHTML = "&#127916; " + sSpelledNumber + " Second Chunks";

        // Display the Loader
            loaderElem.style.display = "block";

        // Stop all the Tracks on the Video Elements Source Object
            let tracks = videoElem.srcObject.getTracks();
            tracks.forEach(track => track.stop());

        // Clear the Interval for the Single Chunk Recording
            clearInterval(oSingleChunkInterval);
  
        // Create a Object URL of the Full Recording as WEBM
            oFullObjectURL = window.URL.createObjectURL(
                new Blob(
                    aFullChunkRecordings, 
                    {
                        type: 'video/webm'
                    }
                )
            );
  
        // Assign the Object URL to the WEBM Download Link for the Full Recording
        // and Display the Download Link and Chunks Section.
            webmDowElem.href          = oFullObjectURL;
            webmDowElem.style.display = "inline-block";
            chunksHElem.style.display = "inline-block";

        // Remove the Old Source Object from the Video Element and Assign the new Object URL
        // then Play the Video
            videoElem.srcObject = null;
            videoElem.src       = oFullObjectURL;

            videoElem.play();

        // Loop through aSingleChunkRecordings and create a div including a header, video of the single
        // chunk and WEBM download link.
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
                videoChunkElem.setAttribute("playsinline", "true");
                videoChunkElem.setAttribute("controlsList", "nodownload");
                 
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

        // Hide the Loader Element
        loaderElem.style.display = "none";
    }

    
    document.addEventListener(
        "DOMContentLoaded", 
        (event) => {
console.log(videoElem.videoWidth);
    var capture, gif, sampleInterval, startTime, timer;
  gif = new GIF({
    workers: 4,
    workerScript: 'assets/js/gif.worker.js',
    width: videoElem.videoWidth,
    height: videoElem.videoHeight
  });
  startTime = null;
  sampleInterval = 100;
  gifDowElem.addEventListener(
    'click', 
    (event) => {
    videoElem.pause();
    videoElem.currentTime = 0;
    gif.abort();
    gif.frames = [];
    videoElem.play();
    }
    );
  gif.on('start', function() {
    return startTime = now();
  });
  gif.on('progress', function(p) {
  });
  gif.on('finished', function(blob) {
    var delta, img;
    img = document.createElement('img');
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
    delta = now() - startTime;
  });
  timer = null;
  capture = function() {
    return gif.addFrame(videoElem, {
      copy: true,
      delay: sampleInterval
    });
  };
  videoElem.addEventListener('play', function() {
    clearInterval(timer);
    return timer = setInterval(capture, sampleInterval);
  });
  videoElem.addEventListener('ended', function() {
    clearInterval(timer);
    return gif.render();
  });});