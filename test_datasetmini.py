# ---------- Install these once from terminal, NOT inside script ----------
# pip install opencv-python numpy

import cv2
import os

# Put your video file name here
VIDEO_FILE = "15059205_1440_2560_30fps.mp4"

# Check if file exists
if not os.path.exists(VIDEO_FILE):
    print("Error: Video file not found in current directory!")
    print("Please place the video file in the same folder as this script.")
    exit()

# Open video
cap = cv2.VideoCapture(VIDEO_FILE)

if not cap.isOpened():
    print("Error: Could not open video")
    exit()

print("Video opened successfully")

count = 0

# Create output folder
output_folder = "frames"
os.makedirs(output_folder, exist_ok=True)

while True:
    ret, frame = cap.read()

    if not ret:
        print("End of video reached")
        break

    # Save each frame as image
    frame_name = os.path.join(output_folder, f"frame_{count}.jpg")
    cv2.imwrite(frame_name, frame)

    print(f"Saved: {frame_name}")
    count += 1

cap.release()
print("Total frames extracted:", count)
