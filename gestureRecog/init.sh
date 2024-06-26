echo "set up venv ..."
python3 -m venv pyvenv
source ./pyvenv/bin/activate
echo "instal mediapipe"
python -m pip install mediapipe
echo "instal opencv"
python -m pip install opencv-python
echo "download pretrained model"
curl -L "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task" > ori_pretrained.task
echo "done"