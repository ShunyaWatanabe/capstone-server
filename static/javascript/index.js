var isFirstSongChosen = false;
var states = ["init", "init"];
var lenPlaylist = 0;
var Spectrums = [];

document.addEventListener('DOMContentLoaded', function(){
    
    Spectrums.push(initializeSpectrum("1"));
    Spectrums.push(initializeSpectrum("2"));

    initializeFeatureButtons();
    
    var songs = document.getElementsByClassName("song");

    for (var i=0; i < songs.length; i++) {
        // add onClick for song-list         
        songs[i].onclick = function(){
            displayWave1(this.id);
        }
    }

}, false);

function displayWave1(song_title){
    // delete things from previous song
    Spectrums[0].clearRegions();
    document.getElementById("recommendation").innerHTML = "";

    // get regions and recommendations
    Spectrums[0].load("static/music/songs/"+ song_title);
    $.get("/segments/"+song_title, function(data, status){
        segments = data.segments;
        recommendations = data.recommendations;

        // add regions
        addRegions(Spectrums[0], segments);

        // add recommendations
        addRecommendations(recommendations);

        // add onclick for each recommendation
        var recItems = document.getElementsByClassName('recommendation song');
        addOnClicks(recItems, recommendations);
    });

    // display details for the wave1
    displayDetails(song_title, "1");

    // add song to the playlist
    if (isFirstSongChosen == false){
        addSongToPlayList(song_title);
        isFirstSongChosen = true;
    }
}

function addSongToPlayList(song_title){
    lenPlaylist += 1;
    var item = `
        <li class="playlist-item">
            <span class="playlist-number"> ${lenPlaylist}: </span>
            <a class="playlist-song"> ${song_title} </a>
        </li>
    `
    document.getElementById("playlist").innerHTML += item;
}

function displayDetails(song, num){
    $.get("/song/"+song, function(data, status){
        song = data["song"];
        console.log(song);
        document.getElementById("song-title"+num).innerText = num + ": " + song["song_title"];
        document.getElementById("song-title"+num).setAttribute("song-title", song["song_title"]);
        document.getElementById("bpm"+num).innerText = "BPM: " + song["bpm"];
        //document.getElementById("key"+num).innerText = "KEY: " + song["key"];
        document.getElementById("key"+num).innerText = "KEY: n/a";
    })
}

function addOnClicks(recItems, recommendations){
    for (var j=0; j<recommendations.length*3; j++){
        recItems[j].onclick = function (){

            Spectrums[1].clearRegions();

            Spectrums[1].load("static/music/songs/" + this.innerText);

            $.get("/segments/"+this.innerText, function(data, status){
                addRegions(Spectrums[1], data.segments);    
            });

            // Add a listener to enable the play button once it's ready
            var start = this.getAttribute("start");
            Spectrums[1].on('ready', function () {
                Spectrums[1].stop();
                Spectrums[1].skip(start);
            });

            displayDetails(this.innerText, "2");
        }
    }
}

function addRecommendations(recommendations){
    for (var j=0; j<recommendations.length; j++){
        var song1 = recommendations[j][0];
        var song2 = recommendations[j][1];
        var song3 = recommendations[j][2];
        var item = `
            <li class="recommendations-item">
                <span class="recommendation-number"> ${j+1}: </span>
                <a class="recommendation song" start="${song1.start}">${song1.song_title}</a>
                <a class="recommendation song" start="${song2.start}">${song2.song_title}</a>
                <a class="recommendation song" start="${song3.start}">${song3.song_title}</a>
            </li>
        `
        document.getElementById("recommendation").innerHTML += item;
    }
}

function addRegions(Spectrum, segments){
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
}

function initializeFeatureButtons(){
    var buttons = {
        playBoth: document.getElementById("btn-play-both"),
        pauseBoth: document.getElementById("btn-pause-both"),
        stopBoth: document.getElementById("btn-stop-both"),
        // add1: document.getElementById("btn-add-to-playlist1"),
        add2: document.getElementById("btn-add-to-playlist2")
    }

    buttons.playBoth.addEventListener("click", function(){
        for (var i=0; i<2; i++){
            document.getElementById("btn-play"+(i+1).toString()).click();
            states[i] = "play";
        }
        buttons.playBoth.disabled = true;
        buttons.pauseBoth.disabled = false;
    });

    buttons.pauseBoth.addEventListener("click", function(){
        for (var i=0; i<2; i++){
            document.getElementById("btn-pause"+(i+1).toString()).click();
        }
        buttons.playBoth.disabled = false;
        buttons.pauseBoth.disabled = true;
        states[i] = "pause";
    });

    buttons.stopBoth.addEventListener("click", function(){
        for (var i=0; i<2; i++){
            document.getElementById("btn-stop"+(i+1).toString()).click();
        }
        buttons.playBoth.disabled = false;
        buttons.pauseBoth.disabled = true;
        states[i] = "stop";
    });

    // buttons.add1.addEventListener("click", function(){

    // });

    buttons.add2.addEventListener("click", function(){
        var song_title = document.getElementById("song-title2").getAttribute("song-title");
        addSongToPlayList(song_title);
        // move song 2 to song 1
        displayWave1(song_title);
        Spectrums[1].empty();
        Spectrums[1].clearRegions();
        buttons.add2.disabled = true;
        document.getElementById("song-title2").innerText = "";
        //document.getElementById("song-title2").setAttribute("song-title", song["song_title"]);
        document.getElementById("bpm2").innerText = "";
        document.getElementById("key2").innerText = "";
        buttons.playBoth.disabled = true;
        buttons.pauseBoth.disabled = true;
        buttons.stopBoth.disabled = true;
    });
}

function initializeSpectrum(num){
// Store the 3 buttons in some object

    var buttons = {
        play: document.getElementById("btn-play"+num),
        pause: document.getElementById("btn-pause"+num),
        stop: document.getElementById("btn-stop"+num),
        playBoth: document.getElementById("btn-play-both"),
        pauseBoth: document.getElementById("btn-pause-both"),
        stopBoth: document.getElementById("btn-stop-both"),
        // add1: document.getElementById("btn-add-to-playlist1"),
        add2: document.getElementById("btn-add-to-playlist2")
    };

    // Create an instance of wave surfer with its configuration
    var Spectrum = WaveSurfer.create({
        container: '#audio-spectrum'+num,
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
        buttons.stopBoth.disabled = false;
        states[parseInt(num)-1] = "play";
        if (states[parseInt(num)%2] == "play"){
            buttons.playBoth.disabled = true;
            buttons.pauseBoth.disabled = false;
        } else if (states[parseInt(num)%2] == "pause"){
            buttons.playBoth.disabled = false;
            buttons.pauseBoth.disabled = false;
        }
    }, false);

    // Handle Pause button
    buttons.pause.addEventListener("click", function(){
        Spectrum.pause();

        // Enable/Disable respectively buttons
        buttons.pause.disabled = true;
        buttons.play.disabled = false;
        buttons.stopBoth.disabled = false;
        states[parseInt(num)-1] = "pause";     
        if (states[parseInt(num)%2] == "pause"){
            buttons.playBoth.disabled = false;
            buttons.pauseBoth.disabled = true;
        } else if (states[parseInt(num)%2] == "play"){
            buttons.playBoth.disabled = false;
            buttons.pauseBoth.disabled = false;
        }
    }, false);


    // Handle Stop button
    buttons.stop.addEventListener("click", function(){
        Spectrum.stop();

        // Enable/Disable respectively buttons
        buttons.pause.disabled = true;
        buttons.play.disabled = false;
        buttons.stop.disabled = true;
        states[parseInt(num)-1] = "stop";
        if (states[parseInt(num)%2] == "stop"){
            buttons.playBoth.disabled = false;
            buttons.pauseBoth.disabled = true;
            buttons.stopBoth.disabled = true;
        } else if (states[parseInt(num)%2] == "pause"){
            buttons.playBoth.disabled = false;
            buttons.pauseBoth.disabled = true;
        }
    }, false);

    // Add a listener to enable the play button once it's ready
    Spectrum.on('ready', function () {
        buttons.play.disabled = false;
        states[parseInt(num)-1] = "stop";
        if (states[parseInt(num)%2] == "stop"){
            buttons.playBoth.disabled = false;
            buttons.pauseBoth.disabled = true;
            buttons.stopBoth.disabled = true;
        }
        if (num == "2"){
            buttons.add2.disabled = false;
        }
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

        // Enable/Disable respectively buttons
        buttons.pause.disabled = true;
        buttons.play.disabled = false;
        buttons.stop.disabled = false;
    }, false);

    return Spectrum
}