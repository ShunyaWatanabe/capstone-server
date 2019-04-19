from __future__ import print_function
print("importing libraries...")
from os import listdir
import librosa
'''
# add this if you want to plot a graph
import librosa.display
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import scipy as sp
'''
import numpy as np
from scipy.signal import find_peaks
from segment import Segment

class Song:
	def __init__(self, filename, data, bpm, frame_length, hop_length):
		self.filename = filename
		self.textfile = data
		self.y, self.sr = librosa.load(self.filename, sr=22050)
		self.bpm = bpm
		self.beats = 32
		self.frame_length = frame_length
		self.hop_length = hop_length
		self.kernel_size = self.get_kernel_size()
		self.kernel = self.get_kernel()
		self.ssm = self.get_ssm()
		self.padded_ssm = self.zero_padding(self.ssm)
		self.times = self.get_times()
		self.segments = self.get_segments()
		self.arr, self.arr_time = self.get_kernel_scores()
		self.peaks, self.peak_values = self.get_peaks(self.arr, 15, 15)


	def get_ssm(self): # self similarity matrix
		print("computing similarity matrix...")
		chroma = librosa.feature.chroma_stft(y=self.y, sr=self.sr, norm=0, n_fft=self.frame_length, hop_length=self.hop_length)
		ssm = librosa.segment.recurrence_matrix(chroma, mode="distance")
		return ssm  


	def get_kernel_size(self):
		# kernel size = 32 beats = 32/128 minute = 15 secs = 22050 * 15 samples = 22050 * 15 / 4096 hops = 80 hops
		size = int(float(self.beats)/self.bpm*60*22050/self.hop_length)
		size = size if size % 2 == 1 else size + 1
		return size 


	def get_kernel(self):
		print("computing checkerboard...")
		row = col = self.kernel_size
		checkerboard = np.fromfunction(lambda i, j: np.sign(i-(row-1)/2)*np.sign(j-(col-1)/2), (row, col), dtype=int)
		tapered = np.fromfunction(lambda i, j: np.exp(-(0.01*0.01) * ( (i-(row-1)/2)**2 + (j-(col-1)/2)**2) ), (row, col), dtype=int)
		# FIX: tapered doesn't really help
		return checkerboard # return gaussian tapered checkerboard
	
	def normalize(self, mat):
		# FIX: normalize function somehow flips the value
		denominator = np.absolute(mat).sum()
		return mat/denominator

	def zero_padding(self, ssm):
		# could use library as well
		size = self.kernel_size
		mat = np.zeros((ssm.shape[0]+size-1,ssm.shape[1]+size-1))
		mat[(size-1)/2:ssm.shape[0]+(size-1)/2, (size-1)/2:ssm.shape[1]+(size-1)/2] = ssm

		return mat

	def get_kernel_scores(self):
		arr = []
		size = self.kernel_size
		for i in range(0, self.ssm.shape[0], 1): # hop
			arr.append(abs((self.padded_ssm[i:i+size,i:i+size]*self.kernel).sum())) # value for each point on the diagonal 
		
		arr_time = np.arange(len(arr))*self.hop_length/self.sr # convert from frames to secs
		
		return arr, arr_time

	def plot(self):
		print("displaying...")
		plt.figure(figsize=(6,8))
		gs = gridspec.GridSpec(2, 1, height_ratios=[3, 1])

		plt.subplot(gs[0])
		librosa.display.specshow(self.ssm, x_axis='time', y_axis='time', hop_length=self.hop_length, cmap='gray_r')

		plt.subplot(gs[1])
		arr, arr_time = self.get_kernel_scores()
		
		plt.plot(arr_time, arr)
		plt.xlim(0, len(arr)*self.hop_length/self.sr)
		
		plt.plot(arr_time, sp.signal.medfilt(arr, 15))

		# find min points
		# peaks, _ = find_peaks(arr, distance=int(15*self.sr/float(self.hop_length)), height=np.average(arr))

		peaks, peak_values = self.get_peaks(arr, 15, 15)

		for peak in peaks:
			plt.axvline(x=peak)

		plt.plot(peaks, peak_values, "x")
		plt.plot(np.zeros_like(arr), "--", color="gray")
		plt.show()

	def get_peaks(self, arr, distance, prominence):
		peaks, _ = find_peaks(arr, distance=int(distance*self.sr/float(self.hop_length)), height=np.average(arr), prominence=prominence)
		return peaks*self.hop_length/self.sr, np.take(arr, peaks) # peak indice and values

	def get_times(self):
		file = open(self.textfile, "r")
		times = []
		for line in file:
			times.append(convert(line.split(" ")[0]))
		file.close()
		return times

	def get_segments(self):
		file = open(self.textfile, "r")
		lines = file.readlines()
		segments = []
		for index, line in enumerate(lines):
			if index == len(lines)-1:
				break
			start = convert(line.split(" ")[0])
			end = convert(lines[index+1].split(" ")[0])
			bpm = 128
			segment_type = line.split(" ")[1]
			segments.append(Segment(self.filename, start, end, bpm, segment_type))
		return segments


	def ROC(self, distance, prominence):
		actual = set(self.times[1:len(self.times)-1])
		predicted = set(self.get_peaks(self.arr, distance, prominence)[0].tolist())
		num_actual = len(actual)
		num_predicted = len(predicted)
		
		true_positive = 0 # true hit
		false_positive = 0 # false alarm
		
		for p in predicted:
			isFound = False
			for k in range(p-3, p+4):
				if k in actual:
					true_positive += 1
					actual.remove(k)
					isFound = True
					break
			if not isFound:
				false_positive += 1
		false_negative = num_actual - true_positive

		precision = float(true_positive)/(true_positive + false_positive)
		recall = float(true_positive)/(true_positive + false_negative)
		f1 = 2*(precision*recall)/(precision+recall)

		print("actual:", num_actual, "predicted:", num_predicted, "tp:", true_positive, 
			"fp:",false_positive, "fn:", false_negative, "f1:", f1)
		return f1
		
def convert(mins): #convert mins to secs
	parts = mins.split(":")
	mins = parts[0]
	secs = parts[1]
	return int(mins)*60+int(secs)

