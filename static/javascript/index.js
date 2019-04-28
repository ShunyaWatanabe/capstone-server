var isFirstSongChosen = false;
var firstSongChosen = "";
var states = ["init", "init"];
var lenPlaylist = 0;
var Spectrums = [];

document.addEventListener('DOMContentLoaded', function(){
    // initialize
    Spectrums.push(initializeSpectrum(0));
    Spectrums.push(initializeSpectrum(1));
    //initializeFeatureButtons();
    initializeAddButtons();
    
    // set up interactions
    var songs = document.getElementsByClassName("song");
    for (var i=0; i < songs.length; i++) {
        // add onClick for song-list         
        songs[i].onclick = function(){
            loadWave(this.id, 0);
            firstSongChosen = this.id;
            if (isFirstSongChosen == false){
                return;
            }
        }
    }

    document.querySelector("#btn-song-list").addEventListener("click", function(){
        // add song to the playlist
        if (isFirstSongChosen == false){
            addSongToPlayList(firstSongChosen);
            isFirstSongChosen = true;
        }
        // hide song list and display playlist
        document.querySelector("#song-list-container").style.display = "none";
        document.querySelector("#playlist-container").style.display = "flex";
        loadRecommendations(firstSongChosen, 0);
    });

}, false);


////////////////////////////////////////////////////////////////////////////////////
//////// Functions start  //////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function loadWave(song_title, si){
    clearWave(si);
    Spectrums[si].load("static/music/songs/"+ song_title);
    loadRegions(song_title, si);
    loadDetails(song_title, si);
}

function clearWave(si){
    Spectrums[si].clearRegions();
    Spectrums[si].empty();
    Spectrums[si].stop();
}

function loadRegions(song_title, si){
    $.get("/segments/"+song_title, function(data, status){
        var segments = data.segments;
        for (var j=0; j<segments.length; j++){
            if (j == segments.length-1){
                break;
            }
            if (j % 2 == 0){
                Spectrums[si].addRegion({
                    start: segments[j],
                    end: segments[j+1],
                });
            } else {
                Spectrums[si].addRegion({
                    start: segments[j],
                    end: segments[j+1],
                    color: 'hsla(400, 100%, 30%, 0.3)',
                });
            }
        }
    });
}

function loadDetails(song, si){
    $.get("/song/"+song, function(data, status){
        song = data["song"];
        var num = (si+1).toString();
        var item = `
            <span class="song-title" id="song-title${num}" song-title="${song['song_title']}">
                ${num}: ${song["song_title"]}
            </span>
            <span class="bpm" id="bpm${num}">
                BPM: ${song["bpm"]}
            </span>
            <span class="key" id="key${num}">
                KEY: ${song["key"]}
            </span>
        `
        document.querySelector("#song-details"+num).innerHTML = item;    
    })
}


function loadRecommendations(song_title, si){
    document.getElementById("recommendation").innerHTML = "";
    $.get("/recommendations/"+song_title, function(data, status){
        var recommendations = data.recommendations;
        for (var j=0; j<recommendations.length; j++){
            var songs = [];
            for (var i=0; i<3; i++){
                songs.push(recommendations[j][i]);
            }
            var item = `
                <li class="recommendations-item">
                    <span class="recommendation-number"> ${j+1}: </span>
                    <a class="recommendation song" start="${songs[0].start}">${songs[0].song_title}</a>
                    <a class="recommendation song" start="${songs[1].start}">${songs[1].song_title}</a>
                    <a class="recommendation song" start="${songs[2].start}">${songs[2].song_title}</a>
                </li>
            `
            document.getElementById("recommendation").innerHTML += item;
        }
        // add onclick for each recommendation
        var recItems = document.getElementsByClassName('recommendation song');
        addOnClicksOnRecommendations(recItems, si);
    });
}


function addOnClicksOnRecommendations(recItems, si){
    for (var j=0; j<recItems.length; j++){
        recItems[j].onclick = function (){
            var spectrum = Spectrums[(si+1)%2];

            spectrum.clearRegions();
            spectrum.load("static/music/songs/" + this.innerText);
            console.log((si+1)%2);
            loadDetails(this.innerText, (si+1)%2);
            loadRegions(this.innerText, (si+1)%2);

            // Add a listener to enable the play button once it's ready
            var start = this.getAttribute("start");
            spectrum.on('ready', function () {
                spectrum.stop();
                spectrum.skip(start);
            });
        }
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
    document.querySelector("#playlist").innerHTML += item;
}


/////////////////////////////////////////////////////////////////////////////////////
//////// For buttons  ///////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

function initializeAddButtons(){
    var buttons = {
        add1: document.getElementById("btn-add-to-playlist1"),
        add2: document.getElementById("btn-add-to-playlist2")
    }

    for (var key in buttons){
        buttons[key].addEventListener("click", function(){
            
            var num = this.getAttribute("num");
            var otherNum = num=="1" ? "2" : "1";
            var song_title = document.getElementById("song-title"+num).getAttribute("song-title")

            // add song to the playlist
            addSongToPlayList(song_title);

            // update recommendation
            loadRecommendations(song_title, parseInt(num)-1);

            // clear up the other spectrum            
            document.querySelector("#song-details"+otherNum).innerHTML = "";
            clearWave(parseInt(otherNum)-1);

            // switch the button
            document.querySelector("#btn-add-to-playlist"+otherNum).style.display = "inline";
            document.querySelector("#btn-add-to-playlist"+num).style.display = "none";          
            
            // buttons.playBoth.disabled = true;
            // buttons.pauseBoth.disabled = true;
            // buttons.stopBoth.disabled = true;
        });
    }
}
/*
function initializeFeatureButtons(){
    function changeDisabled(bools){
        var i = 0;
        for (var key in buttons){
            buttons[key].disabled = bools[i];
            i+=1;
        }
    }

    var buttons = {
        playBoth: document.getElementById("btn-play-both"),
        pauseBoth: document.getElementById("btn-pause-both"),
        stopBoth: document.getElementById("btn-stop-both"),
    };

    buttons.playBoth.addEventListener("click", function(){
        for (var i=0; i<2; i++){
            document.getElementById("btn-play"+(i+1).toString()).click();
            states[i] = "play";
        }
        changeDisabled[true, false, false];
    });

    buttons.pauseBoth.addEventListener("click", function(){
        for (var i=0; i<2; i++){
            document.getElementById("btn-pause"+(i+1).toString()).click();
            states[i] = "pause";
        }
        changeDisabled[false, true, false];
    });

    buttons.stopBoth.addEventListener("click", function(){
        for (var i=0; i<2; i++){
            document.getElementById("btn-stop"+(i+1).toString()).click();
            states[i] = "stop";
        }
        changeDisabled[false, true, true];
    });
}
*/
function initializeButtons(buttons, num){

    function changeDisabled(bools){
        var i = 0;
        for (var key in buttons){
            buttons[key].disabled = bools[i];
            i+=1;
        }
    }

    // Handle Play button
    buttons.play.addEventListener("click", function(){
        Spectrums[num].play();

        changeDisabled([
            true, // play
            false, // pause
            false, // stop
            // false, // playBoth
            // false, // pauseBoth
            // false, // stopBoth
        ]);

        // states[parseInt(num)-1] = "play";
        // if (states[parseInt(num)%2] == "play"){
        //     buttons.playBoth.disabled = true;
        // }
    }, false);

    // Handle Pause button
    buttons.pause.addEventListener("click", function(){
        Spectrums[num].pause();

        changeDisabled([
            false, // play
            true, // pause
            false, // stop
            // false, // playBoth
            // false, // pauseBoth
            // false, // stopBoth
        ]);

        // states[parseInt(num)-1] = "pause";     
        // if (states[parseInt(num)%2] == "pause"){
        //     buttons.pauseBoth.disabled = true;
        // }
    }, false);

    // Handle Stop button
    buttons.stop.addEventListener("click", function(){
        Spectrums[num].stop();

        changeDisabled([
            false, // play
            true, // pause
            true, // stop
            // false, // playBoth
            // false, // pauseBoth
            // false, // stopBoth
        ]);
    
        // states[num] = "stop";
        // if (states[num] == "pause"){
        //     buttons.pauseBoth.disabled = true;
        // }
        // else if (states[num] == "stop"){
        //     buttons.pauseBoth.disabled = true;
        //     buttons.stopBoth.disabled = true;
        // }
    }, false);
}

function initializeSpectrum(num){
// Store the 3 buttons in some object

    var buttons = {
        play: document.getElementById("btn-play"+(num+1).toString()),
        pause: document.getElementById("btn-pause"+(num+1).toString()),
        stop: document.getElementById("btn-stop"+(num+1).toString()),
        // playBoth: document.getElementById("btn-play-both"),
        // pauseBoth: document.getElementById("btn-pause-both"),
        // stopBoth: document.getElementById("btn-stop-both"),
        add1: document.getElementById("btn-add-to-playlist1"),
        add2: document.getElementById("btn-add-to-playlist2")
    };

    initializeButtons(buttons, num);

    // Create an instance of wave surfer with its configuration
    var Spectrum = WaveSurfer.create({
        container: '#audio-spectrum'+(num+1).toString(),
        progressColor: "#03a9f4",
        plugins: [
            WaveSurfer.regions.create({})
        ],
    });

    // Add a listener to enable the play button once it's ready
    Spectrum.on('ready', function () {
        buttons.play.disabled = false;
        // states[num] = "stop";
        // if (states[num] == "stop"){
        //     buttons.playBoth.disabled = false;
        //     buttons.pauseBoth.disabled = true;
        //     buttons.stopBoth.disabled = true;
        // }

        if (num == 1){
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