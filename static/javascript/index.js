document.addEventListener('DOMContentLoaded', function(){
    // Store the 3 buttons in some object
    $.get("/songs/", function(data, status){
        console.log(data);
    });

    var buttons = {
        play: document.getElementById("btn-play"),
        pause: document.getElementById("btn-pause"),
        stop: document.getElementById("btn-stop")
    };

    // Create an instance of wave surfer with its configuration
    var Spectrum = WaveSurfer.create({
        container: '#audio-spectrum1',
        progressColor: "#03a9f4",
        plugins: [
            WaveSurfer.regions.create({})
        ],
    });

    console.log(Spectrum);

    // Create an instance of wave surfer with its configuration
    var Spectrum2 = WaveSurfer.create({
        container: '#audio-spectrum2',
        progressColor: "#03a9f4",
        plugins: [
            WaveSurfer.regions.create({})
        ],
    });

    // Handle Play button
    buttons.play.addEventListener("click", function(){
        Spectrum.play();

        // Enable/Disable respectively buttons
        buttons.stop.disabled = false;
        buttons.pause.disabled = false;
        buttons.play.disabled = true;
    }, false);

    // Handle Pause button
    buttons.pause.addEventListener("click", function(){
        Spectrum.pause();

        // Enable/Disable respectively buttons
        buttons.pause.disabled = true;
        buttons.play.disabled = false;
    }, false);


    // Handle Stop button
    buttons.stop.addEventListener("click", function(){
        Spectrum.stop();

        // Enable/Disable respectively buttons
        buttons.pause.disabled = true;
        buttons.play.disabled = false;
        buttons.stop.disabled = true;
    }, false);


    // Add a listener to enable the play button once it's ready
    Spectrum.on('ready', function () {
        buttons.play.disabled = false;
    });
    
    // If you want a responsive mode (so when the user resizes the window)
    // the spectrum will be still playable
    window.addEventListener("resize", function(){
        // Get the current progress according to the cursor position
        var currentProgress = Spectrum.getCurrentTime() / Spectrum.getDuration();

        // Reset graph
        Spectrum.empty();
        Spectrum.drawBuffer();
        // Set original position
        Spectrum.seekTo(currentProgress);

        // Get the current progress according to the cursor position
        var currentProgress = Spectrum2.getCurrentTime() / Spectrum2.getDuration();

        // Reset graph
        Spectrum2.empty();
        Spectrum2.drawBuffer();
        // Set original position
        Spectrum2.seekTo(currentProgress);

        // Enable/Disable respectively buttons
        buttons.pause.disabled = true;
        buttons.play.disabled = false;
        buttons.stop.disabled = false;
    }, false);

    var songs = document.getElementsByClassName("song");

    for (var i=0; i < songs.length; i++) {
        songs[i].onclick = function(){
            console.log("clicked");

            // delete things from previous song
            Spectrum.clearRegions();
            document.getElementById("recommendation").innerHTML = "";

            // get regions and recommendations
            Spectrum.load("static/music/songs/"+ this.id);
            $.get("/segment/"+this.id, function(data, status){
                console.log(data);
                segments = data.segments;
                recommendations = data.recommendations;

                // add regions
                for (var j=0; j<segments.length; j++){
                    if (j == segments.length-1){
                        break;
                    }
                    if (j % 2 == 0){
                        Spectrum.addRegion({
                            start: segments[j],
                            end: segments[j+1],
                        });
                    } else {
                        Spectrum.addRegion({
                            start: segments[j],
                            end: segments[j+1],
                            color: 'hsla(400, 100%, 30%, 0.3)',
                        });
                    }
                }

                // add recommendations
                for (var j=0; j<recommendations.length; j++){
                    // add recommendation
                    var node = document.createElement("LI");  
                    node.innerText += (j+1).toString() + ": ";
                    node.innerText += recommendations[j][Math.floor(Math.random()*recommendations[j].length)];
                    document.getElementById("recommendation").appendChild(node);
                }
            });
        }
    }
    // Load the audio file from your domain !
    //
}, false);