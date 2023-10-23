// Referencing key DOM elements

const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');

// Check if webcam access is supported
function getUserMediaSupported() {
    return !!(navigator.mediaDevices && navigator.getUserMedia);
}

if (getUserMediaSupported()) {
    enableWebcamButton.addEventListener('click', enableCam);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

// Enable the live webcam view and start classification.
function enableCam(event){
    // Only continue if the COCO-SSD has finished loading.
    if (!model) {
        return;
    }

    // Hide the button once clicked
    event.target.classList.add('removed');

    // getUsermedia parameters to force video but not audio.
    const constraints = {
        video: { facingMode: "environment"}
    };
    console.log(constraints.video)

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam)
    })
}

// Machine Learning model usage

// Loading the model
// Store the resulting model in the global scope of the app
var model = undefined;

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment 
// to get everything needed to run.
// Note: cocoSsd is an external object loaded from our index.html
cocoSsd.load().then(function (loadedModel) {
    model = loadedModel;
    // Show demo section now model is ready to use
    demosSection.classList.remove('invisible');
});

// Classifying a frame from the webcam
var children = [];

function predictWebcam() {
    // Start classifying a frame in the stream.
    model.detect(video).then(function (predictions) {
        // Remove any highlighting we did previous frame.
        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);
        
        let predsCount = {}
        for (let pred in predictions){            
            const predClass = predictions[pred].class;
            const predScore = predictions[pred].score;

            // Define bounding box coordinates
            const [top_left_x, top_left_y, width, height] = predictions[pred].bbox;

            if (predScore > 0.66) {
                const p = document.createElement('p');                
                p.innerText = `${predClass} - with 
                    ${Math.round(parseFloat(predScore) * 100)}% 
                    confidence.`;
                p.style = `
                margin-left: ${top_left_x}px;
                margin-top: ${top_left_y - 10}px;
                width: ${width - 10}px;
                top: 0;
                left: 0;
                `;
            
                const highlighter = document.createElement('div');
                highlighter.setAttribute('class', 'highlighter');
                highlighter.style = `
                left: ${top_left_x}px;
                top: ${top_left_y}px;
                width: ${width}px;
                height: ${height}px;
                `;
                
                liveView.appendChild(highlighter);
                liveView.appendChild(p);
                children.push(highlighter);
                children.push(p);

                // Get count of predicted classes
                if (predClass in predsCount) {
                    predsCount[predClass]++;
                } else {
                    predsCount[predClass] = 1;
                }
            }
                        
        }
        for (const [predClass, count] of Object.entries(predsCount)) {
            console.log(predClass, count);
        }
        // console.log(predsCount);
        
        // Call this function again to keep predicting when the browser is ready.
        window.requestAnimationFrame(predictWebcam);
    });

}
