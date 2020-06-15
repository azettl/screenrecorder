/**
 * Main File for the GIF Conversion
 */
  
function downloadGIF(sOrgVideoElem, sFileName){
    orgVideoElem = document.getElementById(sOrgVideoElem);

    // This Function creates a new A Element, adds the GIF file as HREF and clicks to download the GIF.
        var saveData = (function () {
            var a = document.createElement("a");
            a.style = "display: none";
            document.body.appendChild(a);
            return function (url, fileName) {
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
                // Track GIF Download with Fathom 
                    window.fathom.trackGoal('MLQ7ZDT8', 0);
            };
        }());
    
    // Define Variables
        var capture, gif, sampleInterval, timer;

    // Create GIF instance and assign original video height and width
        gif = new GIF({
            workers: 4,
            workerScript: 'assets/js/gif.worker.js',
            width: orgVideoElem.videoWidth,
            height: orgVideoElem.videoHeight
        });

    // Set GIF Interval to 500ms
        sampleInterval = 500;
    
    // Show Loader 
        loaderElem.style.display = "block";

    // Pause the Video, set currentTime back to 0 and disable the controls
        orgVideoElem.pause();
        orgVideoElem.currentTime = 0;
        orgVideoElem.controls    = false;

    // Reset GIF Instance and Empty the Frames
        gif.abort();
        gif.frames = [];

    // Play the Video for GIF Recording
        orgVideoElem.play();

    // Once the GIF Generation is Finished, download the GIF, hide the Loader and Enable the Controls
        gif.on(
            'finished', 
            function(blob) {
                saveData(URL.createObjectURL(blob), sFileName);
                
                loaderElem.style.display = "none";
                orgVideoElem.controls    = true;
            }
        );

    // Reset timer for Interval
        timer = null;

    // Main Function to Capture the Video as GIF, this is adding the single Frames to the GIF
        capture = function() {
            gif.addFrame(
                orgVideoElem, 
                {
                    copy: true,
                    delay: sampleInterval
                }
            );
        };

    // While the video is playing capture the Frames for the GIF
        orgVideoElem.addEventListener(
            'play', 
            function() {
                clearInterval(timer);
                timer = setInterval(capture, sampleInterval);
                
            }
        );

    // Once the Video ended, render the GIF
        orgVideoElem.addEventListener(
            'ended', 
            function() {
                clearInterval(timer);
                gif.render();
                this.removeEventListener('ended',arguments.callee,false);
            }
        );
}
  
  