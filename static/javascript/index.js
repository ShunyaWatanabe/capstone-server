var firstSongChosen = "";
var states = ["init", "init"];
var lenPlaylist = 0;
var playlist = [];
var Spectrums = [];
var lastRecommendationClicked = "";

document.addEventListener('DOMContentLoaded', function(){
    // initialize
    Spectrums.push(initializeSpectrum(0));
    Spectrums.push(initializeSpectrum(1));
    initializeAddButtons();
    
    // set up interactions
    var songs = document.getElementsByClassName("song");
    for (var i=0; i < songs.length; i++) {
        // add onClick for song-list         
        songs[i].onclick = function(){
            loadWave(this.id, 0);
            firstSongChosen = this.id;
            lastRecommendationClicked = this;
        }
    }

    document.querySelector("#btn-song-list").addEventListener("click", function(){
        // add song to the playlist
        if (firstSongChosen == ""){
            alert("You need to choose a song");
            return;
        }
        addSongToPlayList(firstSongChosen);
        // hide song list and display playlist
        document.querySelector("#song-list-container").style.display = "none";
        document.querySelector("#playlist-container").style.display = "flex";
        loadRecommendations(firstSongChosen, 0);
    });

    document.querySelector("#btn-playlist-download").addEventListener("click", function(){
        
        $.post("/download/",
        {data: JSON.stringify(playlist)},
        function(data, status){
            
            // var file = new File([data], "playlist.txt");
            var file = new Blob([data], {type: "text/plain"});
            var link = document.createElement('a');
            link.download = "playlist.txt";
            link.href = URL.createObjectURL(file);
            link.click();
        });
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

function arrayRemove(arr, value) {

   return arr.filter(function(ele){
       return ele != value;
   });

}

function loadRecommendations(song_title, si){
    $.get("/recommendations/"+song_title, function(data, status){
        var recommendations = data.recommendations;
        
        for (key in recommendations){
            var mix = key.replace("for_", "");
            document.getElementById(key).innerHTML = "";
            document.getElementById(key).innerHTML += `
                <li class="recommendation-header">Mix with ${mix}</li>
            `;

            // get rid of the song that is already in playlist
            console.log(key, "before", recommendations[key].length);
            recommendations[key] = recommendations[key].filter(function(item) {
                // console.log(item["song_title"]);
                // console.log(playlist.map(a => a["song_title"]));
                // console.log(playlist.map(a => a["song_title"]).includes(item["song_title"]));
                return !(playlist.map(a => a["song_title"]).includes(item["song_title"]));
            });
            console.log(key, "after", recommendations[key].length);

            var line = recommendations[key];
            for (var i=0; i<line.length; i++){
                document.getElementById(key).innerHTML += `
                <li class="recommendation"> <a class="recommendation-song"start="${line[i].start}" mix_from="${mix}">${line[i].song_title} </a></li>
                `;
            }
            // document.getElementById("recommendation").innerHTML ;   
        }
        // add onclick for each recommendation
        var recItems = document.getElementsByClassName('recommendation-song');
        addOnClicksOnRecommendations(recItems, si);
    });
}


function addOnClicksOnRecommendations(recItems, si){
    for (var j=0; j<recItems.length; j++){
        recItems[j].onclick = function (){

            lastRecommendationClicked = this;

            
            var spectrum = Spectrums[(si+1)%2];

            spectrum.clearRegions();
            spectrum.load("static/music/songs/" + this.innerText);
            loadDetails(this.innerText, (si+1)%2);
            loadRegions(this.innerText, (si+1)%2);

            // Add a listener to enable the play button once it's ready
            var start = this.getAttribute("start");
            spectrum.on('ready', function () {
                spectrum.stop();
                spectrum.skip(start);
            });

            document.querySelector("#btn-add-to-playlist"+((si+1)%2+1).toString()).disabled = false;
        }
    }
}


function addSongToPlayList(song_title){
    var recommendation = lastRecommendationClicked; // it stores "start" and "mix_from"
    
    var start = recommendation.getAttribute("start");
    var mix_from = recommendation.getAttribute("mix_from");
    var added_song = {
        "song_title": song_title,
        "start": start,
        "mix_from": mix_from,
    };
    playlist.push(added_song);

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
            document.querySelector("#song-details"+otherNum).innerHTML = otherNum + ":" ;
            clearWave(parseInt(otherNum)-1);

            document.querySelector("#btn-play"+otherNum).disabled = true;
            document.querySelector("#btn-pause"+otherNum).disabled = true;
            document.querySelector("#btn-stop"+otherNum).disabled = true;

            // switch the button
            document.querySelector("#btn-add-to-playlist"+otherNum).style.display = "inline";
            document.querySelector("#btn-add-to-playlist"+otherNum).disabled = true;
            document.querySelector("#btn-add-to-playlist"+num).style.display = "none";          

        });
    }
}

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
        ]);
    }, false);

    // Handle Pause button
    buttons.pause.addEventListener("click", function(){
        Spectrums[num].pause();

        changeDisabled([
            false, // play
            true, // pause
            false, // stop
        ]);
    }, false);

    // Handle Stop button
    buttons.stop.addEventListener("click", function(){
        Spectrums[num].stop();

        changeDisabled([
            false, // play
            true, // pause
            true, // stop
        ]);
    }, false);
}

function initializeSpectrum(num){
// Store the 3 buttons in some object

    var buttons = {
        play: document.getElementById("btn-play"+(num+1).toString()),
        pause: document.getElementById("btn-pause"+(num+1).toString()),
        stop: document.getElementById("btn-stop"+(num+1).toString()),
        // add1: document.getElementById("btn-add-to-playlist1"),
        // add2: document.getElementById("btn-add-to-playlist2")
    };

    initializeButtons(buttons, num);

    // Create an instance of wave surfer with its configuration
    var Spectrum = WaveSurfer.create({
        height: 86, // default: 128
        container: '#audio-spectrum'+(num+1).toString(),
        progressColor: "#03a9f4",
        plugins: [
            WaveSurfer.regions.create({})
        ],
    });

    // Add a listener to enable the play button once it's ready
    Spectrum.on('ready', function () {
        buttons.play.disabled = false;

        if (num == 1){
            document.getElementById("btn-add-to-playlist2").disabled = false;
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