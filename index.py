from flask import Flask, render_template, url_for, jsonify
from song import Song
from os import listdir, path
import json
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
app = Flask(__name__)
songs = []
segments = []
num_recs = 3

# find index
def find(lst, key, value):
    for i, dic in enumerate(lst):
        if dic[key] == value:
            return i
    return -1

def get_song(filename):
	for song in songs:
		if song["song_title"] == filename:
			return song
	return ""

def song_to_text(song):
	return song.replace(".mp3", ".txt")

def get_recommendations(chosen_song):
	# look at the same segment_type and look at energy. choose three with closest energy level
	print("get recommendations")
	recs = []
	song_title = chosen_song["song_title"]
	for curr_seg in chosen_song["segments"]:
		rec = []
		seg_type = curr_seg["segment_type"]
		segs = segments[seg_type]
		index = find(segments[curr_seg["segment_type"]], "song_title", chosen_song["song_title"])
		add = 1
		deduct = 1
		count = 0
		while len(rec) < 3:
			if index+add >= len(segments) and index-deduct <= 0:
				break
			if index+add < len(segments) and segs[index+add]["song_title"] != song_title:
				rec.append(segs[index+add])
			if index-deduct > 0 and segs[index-deduct]["song_title"] != song_title:
				rec.append(segs[index-deduct])
			add += 1
			deduct += 1

		recs.append(rec)

	return recs


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
		return 
	song = get_song(filename)
	recommendations = get_recommendations(song)
	return jsonify(segments=song["cue points"], recommendations=recommendations)

@app.route('/song/<filename>/')
def get_song_info(filename=None):
	print(filename)
	if filename == None:
		return 
	return jsonify(song=get_song(filename))

def main():
	global songs, segments
	with open('static/music/data/data.txt') as json_file:  
		data = json.load(json_file)
		songs = data['songs']
		segments = data['segments']
	print("main is done")

main()