/**
 * Main File for the GIF Conversion
 */
  
function downloadGIF(sOrgVideoElem){
    orgVideoElem = document.getElementById(sOrgVideoElem);

    var saveData = (function () {
        var a = document.createElement("a");
        a.style = "display: none";
        document.body.appendChild(a);
        return function (url, fileName) {
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());
    
console.log(orgVideoElem.videoWidth);
var capture, gif, sampleInterval, startTime, timer;
gif = new GIF({
workers: 4,
workerScript: 'assets/js/gif.worker.js',
width: orgVideoElem.videoWidth,
height: orgVideoElem.videoHeight
});
startTime = null;
sampleInterval = 500;
    
    loaderElem.style.display = "block";
orgVideoElem.pause();
orgVideoElem.currentTime = 0;
orgVideoElem.controls = false;
gif.abort();
gif.frames = [];
orgVideoElem.play();
gif.on('start', function() {
return startTime = now();
});
gif.on('progress', function(p) {
});
gif.on('finished', function(blob) {
saveData(URL.createObjectURL(blob), "screenrecording.gif");
loaderElem.style.display = "none";
orgVideoElem.controls = true;
});
timer = null;
capture = function() {
return gif.addFrame(orgVideoElem, {
  copy: true,
  delay: sampleInterval
});
};
orgVideoElem.addEventListener('play', function() {
clearInterval(timer);
return timer = setInterval(capture, sampleInterval);
});
orgVideoElem.addEventListener('ended', function() {
clearInterval(timer);
return gif.render();
});
}
  
  