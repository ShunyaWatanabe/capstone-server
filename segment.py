import music21
music21.environment.UserSettings()['warnings'] = 0
import librosa
#from pydub import AudioSegment

class Segment:
	def __init__(self, filename, start, end, bpm, segment_type):
		self.song_title = filename
		self.start = start
		self.end = end
		self.bpm = bpm
		self.segment_type = segment_type
		self.y, self.sr = librosa.load(filename, sr=22050, offset=start, duration=end-start)
		self.energy = librosa.feature.rmse(self.y, frame_length=2048*4, hop_length=512*4).mean()
		#self.key = self.get_key()

	def is_harmonic(self, other):
		# if this and other are either same key or related, return true
		return False

	def get_key(self):
		AudioSegment.from_file(self.song_title).export("Above & Beyond - Flying By Candlelight (Above & Beyond Extended Club Mix).", format="mp3")
		score = music21.converter.parse("/output/"+self.song_title.remove("mp3")+"xml")
		key = score.analyze('key')
		print(key.tonic.name, key.mode)
		return key.tonic.name