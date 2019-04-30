from flask import Flask, render_template, url_for, jsonify, request, send_from_directory
# from song import Song
from os import listdir, path
import json
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
app = Flask(__name__)
songs = []
segments = []
num_recs = 3
Akeys = ["B", "F#", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E"]
Bkeys = ["Abm", "Ebm", "Bbm", "Fm", "Cm", "Gm", "Dm", "Am", "Em", "Bm", "F#m", "Dbm"]

# find index
def contains_item(songs, song):
	for s in songs:
		if s["song_title"] == song["song_title"]:
			print("found duplicate")
			return True
	return False


def get_song(filename):
	for song in songs:
		if song["song_title"] == filename:
			return song
	return ""

def song_to_text(song):
	return song.replace(".mp3", ".txt")

def get_key_index(key):
	try:
		return (Akeys.index(key), "A")
	except:
		return (Bkeys.index(key), "B")

def get_harmonic_songs(chosen_song):
	key = chosen_song["key"]
	index, side = get_key_index(key)

	ret = []
	for song in songs:
		if song["song_title"] == chosen_song["song_title"]:
			continue
		other_key = song["key"]
		other_index, other_side = get_key_index(other_key)
		if other_index in (index, index-1, index+1) and side == other_side:
			ret.append(song)
		elif other_index == index and side != other_side:
			ret.append(song)
	
	if len(ret) == 0:
		for song in songs:
			other_key = song["key"]
			other_index, other_side = get_key_index(other_key)
			if other_index in (index-2, index+2) and side == other_side:
				ret.append(song)

	return ret

def get_per_segment_recommendations(recommendations, harmonic_songs, from_segment, to_segment):
	for harmonic_song in harmonic_songs:
		for harmonic_segment in harmonic_song["segments"]:
			harmonic_segment["song_title"] = harmonic_song["song_title"]
			if harmonic_segment["segment_type"] == to_segment:
				recommendations["for_"+from_segment].append(harmonic_segment)

@app.route('/')
def index():
	song_titles = listdir('static/music/songs')
	song_titles.remove(".DS_Store")
	song_titles.remove(".gitkeep")
	return render_template('index.html', songs=song_titles, numSongs=len(song_titles))


@app.route('/segments/<filename>/')
def get_segments(filename=None):
	print(filename)
	if filename == None:
		return "no filename"
	song = get_song(filename)
	return jsonify(segments=song["cue points"])

@app.route('/recommendations/<filename>/')
def get_recommendations(filename=None):
	# mix drop->intro, break->break, outro->intro
	print(filename)
	if filename == None:
		return "no filename"

	chosen_song = get_song(filename)	
	song_title = chosen_song["song_title"]
	harmonic_songs = get_harmonic_songs(chosen_song)
	if len(harmonic_songs) == 0:
		print("there was no song that can be mixed harmonically with this")
		harmonic_songs = songs

	recommendations = {
		"for_drop": [],
		"for_break": [],
		"for_build-up": []
	}

	FROMS = ["drop", "break", "build-up"]
	TOS = ["intro", "break", "build-up"]
	for index, segment_from in enumerate(FROMS):
		segment_to = TOS[index]
		get_per_segment_recommendations(
			recommendations, harmonic_songs, segment_from, segment_to)

	for key in recommendations:
		segment_type = recommendations[key][0]["segment_type"]
		segment = next((x for x in chosen_song["segments"] if x["segment_type"] == segment_type), None)
		if segment != None:
			recommendations[key].sort(key=lambda x: abs(float(x["energy"])-float(segment["energy"])))
		#recommendations[key] = recommendations[key][:5]

	return jsonify(recommendations=recommendations)

@app.route('/song/<filename>/')
def get_song_info(filename=None):
	print(filename)
	if filename == None:
		return "no filename"
	return jsonify(song=get_song(filename))

@app.route('/download/', methods=['GET', 'POST'])
def download_playlist():
	playlist = []
	file = open("playlist.txt", "w")
	for index, song in enumerate(json.loads(request.form["data"])):
		file.write(str(index+1) + " song title: " + str(song["song_title"]) + ", start: " + str(song["start"]) + ", mix from: " + str(song["mix_from"]) + "\n")
	file.close()
	return send_from_directory(".", "playlist.txt")


def main():
	global songs, segments
	with open('static/music/data/data.txt') as json_file:  
		data = json.load(json_file)
		songs = data['songs']
		segments = data['segments']

main()