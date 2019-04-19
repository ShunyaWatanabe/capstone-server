from flask import Flask, render_template, url_for, jsonify
from song import Song
from os import listdir
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
app = Flask(__name__)
songs = []

def song_to_text(song):
	return song.replace(".mp3", ".txt")

def get_recommendations(chosen_song):
	recommendations = []
	for segment in chosen_song.segments:
		temp_recommendations = []
		for song in songs:
			for temp_segment in song.segments:
				if segment.segment_type == temp_segment.segment_type:
					temp_recommendations.append(temp_segment.song_title.split('/')[-1])
		recommendations.append(temp_recommendations)
	return recommendations

@app.route('/')
def index():
	song_titles = listdir('static/music/songs').remove(".DS_Store")
	return render_template('index.html', songs=song_titles, numSongs=len(song_titles))

@app.route('/segment/<filename>/')
def get_segment(filename=None):
	print(filename)
	if filename == None:
		return 

	data = 'static/music/data/' + song_to_text(filename)
	filename = 'static/music/songs/' + filename
	bpm = 128
	frame_length = 2048*2*8
	hop_length = 2048*2
	song = Song(filename, data, bpm, frame_length, hop_length)

	recommendations = get_recommendations(song)

	return jsonify(segments=song.times, recommendations=recommendations)

@app.route('/songs/')
def get_songs():
	bpm = 128
	frame_length = 2048*2*8
	hop_length = 2048*2
	song_titles = listdir('static/music/songs')
	song_titles.remove(".DS_Store")
	
	for index, song_title in enumerate(song_titles):
		if index == 5:
			return "done!" # for demo reason
		data = 'static/music/data/' + song_to_text(song_title)
		song_title = 'static/music/songs/' + song_title
		print(songs)
		songs.append(Song(song_title, data, bpm, frame_length, hop_length))

	return "done!"