/**
 * Main File for the Screenrecording
 */

// Define Element Constants
    const videoElem   = document.getElementById("video");
    const videoCamElem= document.getElementById("videoCam");
    const buttonElem  = document.getElementById("button");
    const loaderElem  = document.getElementById("loader");
    const chunksElem  = document.getElementById("videoChunks");
    const chunksHElem = document.getElementById("videoChunksHeading");
    const webmDowElem = document.getElementById("resultLinkWebM");
    const gifDowElem  = document.getElementById("resultLinkGIF");
    const chunkLeElem = document.getElementById("singleChunkLengthInSec");
    const errorMsElem = document.getElementById("errorMsg");
    const userCamElem = document.getElementById("addUserVideoAudio");

// Define Global Variables
    var isRecordingRunning     = false;

    var oSingleChunkInterval      = null;
    var oFullObjectURL            = null;
    var oCurrentVideoCamObjectURL = null;
    var oCurrentVideoCam          = null;

    var aSingleChunkRecordings = [];
    var aFullChunkRecordings   = [];
    var aMediaRecorderSingleCh = [];

// Hide Loader Element when the DOM Content is Loaded
    document.addEventListener(
        "DOMContentLoaded", 
        (event) => {
            loaderElem.style.display = "none";
        }
    );

// Attach Event Listener to ask for permissions for user audio and video on click of the checkbox
    userCamElem.addEventListener(
        "click", 
        (event) => {
            if(userCamElem.checked){
                getUserVideoAudioMedia();
            }else{
                if (oCurrentVideoCamObjectURL) {
                    window.URL.revokeObjectURL(oCurrentVideoCamObjectURL);
                }

                // Stop all the Tracks on the Video Elements Source Object
                    if(videoCamElem.srcObject){
                        let tracks = videoCamElem.srcObject.getTracks();
                        tracks.forEach(
                            function(track){
                                track.stop();
                            }
                        );
                    }
            
                videoCamElem.srcObject    = null;
                videoCamElem.src          = "";
            }
        }, 
        false
    );

// Attach Event Listener to the Start/Stop Recording Button
    buttonElem.addEventListener(
        "click", 
        (event) => {
            if(isRecordingRunning){
                stopCapture();

                // Track Screen Recording with Fathom 
                    window.fathom.trackGoal('9VXPTH8L', 0);
            }else{
                startCapture();
            }
        }, 
        false
    );

// Define the function to get the user video and audio
    async function getUserVideoAudioMedia() {
    
        try {
            oCurrentVideoCam = await navigator.mediaDevices.getUserMedia(
                {
                    audio: true,
                    video: false
                }
            );
            videoCamElem.srcObject = oCurrentVideoCam;

        /* use the stream */
        } catch(err) {
            switch (err.name){
                case "NotAllowedError":
                    errorMsElem.innerHTML = "&#128165; No Permissions to Record your User Video and Audio or you canceled the Recording.";
                    errorMsElem.style.display = "block";
                    break;
                case "NotSupportedError":
                    errorMsElem.innerHTML = "&#128165; Your Browser does not support User Video and Audio Recording yet.";
                    errorMsElem.style.display = "block";
                    break;
                default:
                    errorMsElem.innerHTML = "&#128165; Error: " + err;
                    errorMsElem.style.display = "block";
                    break;
            }
        }
    }

// Definition of the async startCapture function
    async function startCapture() {
        // Clear Data from the Previous Recording
            videoElem.srcObject    = null;
            videoElem.src          = "";
            chunksElem.innerHTML   = "";
            aSingleChunkRecordings = [];
            aMediaRecorderSingleCh = [];
            aFullChunkRecordings   = [];

            if (oFullObjectURL) {
                window.URL.revokeObjectURL(oFullObjectURL);
            }

        // Change Button Text to "Stop Capture" and Hide the Download Button + One Second Chunks Section
            buttonElem.innerHTML      = '<i class="fa fa-stop-circle" aria-hidden="true"></i> Stop Capture';
            webmDowElem.style.display = "none";
            gifDowElem.style.display  = "none";
            chunksHElem.style.display = "none";
            errorMsElem.style.display = "none";

        // Check if navigator and navigator.mediaDevices are available.
            if(!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                buttonElem.style.display = "none";
                isRecordingRunning   = false;

                errorMsElem.innerHTML = "&#128165; Your Browser does not support Screen Recording yet.";
                errorMsElem.style.display = "block";

                return;
            }

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

                if(userCamElem.checked){
                    currentVideo.addTrack(
                        oCurrentVideoCam.getAudioTracks()[0]
                    );
                }

                currentVideo.addEventListener(
                    'inactive', 
                    (event) => {
                        stopCapture(event);
                        
                        // Track Screen Recording with Fathom 
                            window.fathom.trackGoal('9VXPTH8L', 0);
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
                var iSingleChunkLengthInMS = (parseInt(chunkLeElem.value) * 1000) + 250;

                // The First Chunk is handled Outside of the Interval and Push the Data to the 
                // singleChunks Array whenever Data is Available. When the Recording Stops then
                // the singleChunks Array gets pushed into the aSingleChunkRecordings Array as 
                // a BLOB.
                    var oTempFirstMediaRecorder = new MediaRecorder(
                        currentVideo, 
                        {
                            mimeType: 'video/webm'
                        }
                    );

                    oTempFirstMediaRecorder.id = 0;

                    if(!aMediaRecorderSingleCh[oTempFirstMediaRecorder.id]){
                        aMediaRecorderSingleCh[oTempFirstMediaRecorder.id] = [];
                    }   

                    oTempFirstMediaRecorder.addEventListener(
                        'dataavailable', 
                        (event) => {
                            if (event.data && event.data.size > 0) {
                                aMediaRecorderSingleCh[event.srcElement.id].push(event.data);
                            }
                        }
                    );

                    oTempFirstMediaRecorder.onstop = function(event){
                        aSingleChunkRecordings.push(new Blob(aMediaRecorderSingleCh[event.srcElement.id]));
                    };

                    oTempFirstMediaRecorder.addEventListener(
                        'inactive', 
                        (event) => {
                            event.srcElement.stop();
                        }
                    );

                    // Start the Recording and Stop after One Second
                    oTempFirstMediaRecorder.start(10);
                    setTimeout(
                        function(){
                            if(oTempFirstMediaRecorder.state == "recording"){
                                oTempFirstMediaRecorder.stop();
                            }
                        }, 
                        iSingleChunkLengthInMS
                    );

                // The Other Chunks are handled Inside the Interval and Push the Data to the 
                // singleChunks Array whenever Data is Available. When the Recording Stops then
                // the singleChunks Array gets pushed into the aSingleChunkRecordings Array as 
                // a BLOB.
                    var id = 1;
                    oSingleChunkInterval = setInterval(()=>{
                        var oTempMediaRecorder = new MediaRecorder(
                            currentVideo, 
                            {
                                mimeType: 'video/webm'
                            }
                        );
                        oTempMediaRecorder.id = id;
                        id++;

                        if(!aMediaRecorderSingleCh[oTempMediaRecorder.id]){
                            aMediaRecorderSingleCh[oTempMediaRecorder.id] = [];
                        }

                        oTempMediaRecorder.addEventListener(
                            'dataavailable', 
                            (event) => {
                                if (event.data && event.data.size > 0) {
                                    aMediaRecorderSingleCh[event.srcElement.id].push(event.data);
                                }
                            }
                        );

                        oTempMediaRecorder.addEventListener(
                            'inactive', 
                            (event) => {
                                event.srcElement.stop();
                            }
                        );

                        oTempMediaRecorder.onstop = function(event){
                            aSingleChunkRecordings.push(new Blob(aMediaRecorderSingleCh[event.srcElement.id]));
                        };
                        
                        // Start the Recording and Stop after One Second
                        oTempMediaRecorder.start(10);
                        setTimeout(
                            function(){
                                if(oTempMediaRecorder.state == "recording"){
                                    oTempMediaRecorder.stop();
                                }
                            }, 
                            iSingleChunkLengthInMS
                        );
                    }, 
                    (parseInt(chunkLeElem.value) * 1000)
                );
        } catch(err) {
            
            isRecordingRunning   = false;
            buttonElem.innerHTML = '<i class="fa fa-play-circle" aria-hidden="true"></i> Start Capture';

            switch (err.name){
                case "NotAllowedError":
                    errorMsElem.innerHTML = "&#128165; No Permissions to Record your Screen or you canceled the Recording.";
                    errorMsElem.style.display = "block";
                    break;
                case "NotSupportedError":
                    errorMsElem.innerHTML = "&#128165; Your Browser does not support Screen Recording yet.";
                    errorMsElem.style.display = "block";
                    break;
                default:
                    errorMsElem.innerHTML = "&#128165; Error: " + err;
                    errorMsElem.style.display = "block";
                    break;
            }
        }
    } 

// Definition of the stopCapture function
    function stopCapture(evt) {
        // Set the isRecordingRunning Variable to FALSE cause the stopped the Recording
            isRecordingRunning = false;

        // Stop User Video and Audio Recording
            if(userCamElem.checked){
                userCamElem.click();
            }

        // Set Button Label to Start Capture
            buttonElem.innerHTML = '<i class="fa fa-play-circle" aria-hidden="true"></i> Start Capture';

        // Change Chunk Header
            var sSpelledNumber         = "";

            switch (parseInt(chunkLeElem.value)){
                case 1:
                    sSpelledNumber = "One";
                    break;
                case 2:
                    sSpelledNumber = "Two";
                    break;
                case 3:
                    sSpelledNumber = "Three";
                    break;
                case 4:
                    sSpelledNumber = "Four";
                    break;
                case 5:
                    sSpelledNumber = "Five";
                    break;
                case 6:
                    sSpelledNumber = "Six";
                    break;
                case 7:
                    sSpelledNumber = "Seven";
                    break;
                case 8:
                    sSpelledNumber = "Eight";
                    break;
                case 9:
                    sSpelledNumber = "Nine";
                    break;
                case 10:
                    sSpelledNumber = "Ten";
                    break;
                case 11:
                    sSpelledNumber = "Eleven";
                    break;
                case 12:
                    sSpelledNumber = "Twelve";
                    break;
                case 13:
                    sSpelledNumber = "Thirteen";
                    break;
                case 14:
                    sSpelledNumber = "Fourteen";
                    break;
                case 15:
                    sSpelledNumber = "Fifteen";
                    break;
            }
            chunksHElem.innerHTML = "&#127916; " + sSpelledNumber + " Second Chunks";

        // Display the Loader
            loaderElem.style.display = "block";

        // Stop all the Tracks on the Video Elements Source Object
            if(videoElem.srcObject){
                let tracks = videoElem.srcObject.getTracks();
                tracks.forEach(
                    function(track){
                        track.stop();
                    }
                );
            }

        // Clear the Interval for the Single Chunk Recording
            clearInterval(oSingleChunkInterval);
  
        // Create a Object URL of the Full Recording as WebM
            oFullObjectURL = window.URL.createObjectURL(
                new Blob(
                    aFullChunkRecordings, 
                    {
                        type: 'video/webm'
                    }
                )
            );
  
        // Assign the Object URL to the WebM Download Link for the Full Recording
        // and Display the Download Link and Chunks Section.
            webmDowElem.href          = oFullObjectURL;
            webmDowElem.style.display = "inline-block";
            // Track WebM Download with Fathom 
                webmDowElem.setAttribute("onclick", "window.fathom.trackGoal('NZ32QPJA', 0);");

            gifDowElem.style.display  = "inline-block";
            chunksHElem.style.display = "inline-block";

        // Remove the Old Source Object from the Video Element and Assign the new Object URL
        // then Play the Video
            videoElem.srcObject = null;
            videoElem.src       = oFullObjectURL;

        // Loop through aSingleChunkRecordings and create a div including a header, video of the single
        // chunk and WebM download link. The timeout is to get the last chunk into the array before this
        // loop is called.
        var iChunkCount = 1;
        setTimeout(
            function(){
                aSingleChunkRecordings.forEach(
                    function(chunkRecording){
                        var oCheckVideoElem = document.getElementById("video" + iChunkCount);
                        if(oCheckVideoElem){
                            var oCheckWrapperDiv = oCheckVideoElem.parentNode;
                            if(oCheckWrapperDiv){
                                oCheckWrapperDiv.parentNode.removeChild(oCheckWrapperDiv);
                            }
                        }


                        var videoChunkDivElem = document.createElement("div");
                        videoChunkDivElem.classList.add("chunk");

                        var videoChunkHeadElem = document.createElement("h3");
                        videoChunkHeadElem.innerText = "Chunk #" + iChunkCount;
                        videoChunkDivElem.appendChild(videoChunkHeadElem);

                        var videoChunkElem = document.createElement("video");
                        videoChunkElem.id = "video" + iChunkCount;
                        videoChunkElem.setAttribute("controls", "true");
                        videoChunkElem.setAttribute("playsinline", "true");
                        videoChunkElem.setAttribute("controlsList", "nodownload");
                        
                        var videoChunkBlob = window.URL.createObjectURL(chunkRecording);
                        videoChunkElem.src = videoChunkBlob;
                        videoChunkDivElem.appendChild(videoChunkElem);

                        var videoChunkAElem = document.createElement("a");
                        videoChunkAElem.innerHTML = '<i class="fa fa-arrow-circle-down" aria-hidden="true"></i> Download WebM';
                        videoChunkAElem.classList.add("button");
                        videoChunkAElem.href = videoChunkBlob;
                        // Track WebM Download with Fathom 
                            videoChunkAElem.setAttribute("onclick", "window.fathom.trackGoal('NZ32QPJA', 0);")

                        videoChunkAElem.download = "screenrecording-chunk-" + iChunkCount + ".webm";
                        videoChunkDivElem.appendChild(videoChunkAElem);

                        var videoChunkAGIFElem = document.createElement("a");
                        videoChunkAGIFElem.innerHTML = '<i class="fa fa-arrow-circle-down" aria-hidden="true"></i> Download GIF';
                        videoChunkAGIFElem.classList.add("button");
                        videoChunkAGIFElem.classList.add("downloadgif");
                        videoChunkAGIFElem.dataset.videoelement = "video" + iChunkCount;
                        videoChunkAGIFElem.setAttribute("onclick", "downloadGIF(this.dataset.videoelement, 'screenrecording-chunk-" + iChunkCount + ".gif')");
                        videoChunkDivElem.appendChild(videoChunkAGIFElem);

                        chunksElem.appendChild(videoChunkDivElem);

                        iChunkCount++;
                    }
                );
            }, 
            250
        );

        // Hide the Loader Element
        loaderElem.style.display = "none";
    }