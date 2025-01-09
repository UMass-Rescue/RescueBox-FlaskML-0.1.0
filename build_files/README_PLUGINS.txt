1 each plugin has pipfile and needs python server start :

audio -works  , sample input in audio-transcription\audio\sample.mp3 

facematch -works  , needs deepface weights in userprofile\.deepface\weights and .matplotlib
	
	inputs : FaceMatch\resources\sample_images
        search : test_image.jpg in FaceMatch\resources

deepfake image works , needs retinaface weights in userprofile\.deepface\weights

            binary_deepfake_detection\pretrained and weights --needs files downloaded

	    image_model\binary_deepfake_detection\images\*.png for demo

deepfake video needs weights\xception-b5690688.pth downloaded

               videos\inputs\*.mp4 and videos\outputs for demo


files for deepfakce image
	middle_checkpoint.pth.tar in image_model\binary_deepfake_detection\pretrained
	dffd_M_unfrozen.ckpt in image_model\binary_deepfake_detection\weights


files for facematch
example of runtime env .deepface folder in userprofile :
	C:\Users\<user>\.deepface\weights\retinaface.h5
	retinaface.h5 < deepfake image
	arcface_weights.h5 < facematch
	yolov8n-face.pt  < facematch

	C:\Users\<user>\.keras\
	keras.json

	C:\Users\<user>\.matplotlib
	fontlist-v390.json