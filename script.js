document.addEventListener('DOMContentLoaded', () => {
    const cameraSelect = document.getElementById('cameraSelect');
    const micSelect = document.getElementById('micSelect');
    const resolutionSelect = document.getElementById('resolutionSelect');
    const volumeSlider = document.getElementById('volumeSlider');
    const video = document.getElementById('video');
    const controlInfo = document.getElementById('control-info');
    let currentStream = null;
    let showControls = true;

    /* Cacheing */
    const cameraCache = localStorage.getItem('camera');
    const microphoneCache = localStorage.getItem('microphone');
    const resolutionCache = localStorage.getItem('resolution');
    const volumeCache = localStorage.getItem('volume');

    /* WebAudio Variable */
    let audioCtx, gainNode, sourceNode;

    /* list devices */
    async function listDevices() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        const audioDevices = devices.filter(d => d.kind === 'audioinput');

        cameraSelect.innerHTML = '';
        micSelect.innerHTML = '';

        videoDevices.forEach((device, i) => {
            const opt = document.createElement('option');
            opt.value = device.deviceId;
            opt.text = device.label || `Kamera ${i + 1}`;
            cameraSelect.appendChild(opt);
        });

        audioDevices.forEach((device, i) => {
            const opt = document.createElement('option');
            opt.value = device.deviceId;
            opt.text = device.label || `Mikrofon ${i + 1}`;
            micSelect.appendChild(opt);
        });
    }

    /* Kamera + Audio start */
    async function startMedia(cameraId, micId, resolution) {
        if (currentStream) {
            currentStream.getTracks().forEach(t => t.stop());
        }

        const [width, height] = resolution.split('x').map(Number);

        const constraints = {
            video: {
                deviceId: cameraId ? { exact: cameraId } : undefined,
                width: { ideal: width },
                height: { ideal: height },
                frameRate: { ideal: 30 }
            },
            audio: {
                deviceId: micId ? { exact: micId } : undefined,
                sampleRate: 48000,
                channelCount: 2,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            video.muted = false;
            currentStream = stream;

            /* --- Web Audio Setup --- */
            audioCtx = new AudioContext();
            if (sourceNode) sourceNode.disconnect();
            if (gainNode) gainNode.disconnect();

            sourceNode = audioCtx.createMediaStreamSource(stream);
            gainNode = audioCtx.createGain();
            gainNode.gain.value = volumeSlider ? volumeSlider.value : 1;

            sourceNode.connect(gainNode);

            const dest = audioCtx.createMediaStreamDestination();
            gainNode.connect(dest);

            video.srcObject = new MediaStream([
                ...stream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ]);

            video.muted = false;
            await video.play();

            const videoTrack = stream.getVideoTracks()[0];
            console.log('Audio Track Settings:', stream.getAudioTracks()[0].getSettings());
            console.log('Resolution:', videoTrack.getSettings().width + 'x' + videoTrack.getSettings().height);
        } catch (err) {
            console.error("Fehler beim Starten:", err);
        }
    }

    /* Volume Slider */
    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            if (gainNode) gainNode.gain.value = volumeSlider.value;
        });
    }


    /* Event-Listener */
    cameraSelect.addEventListener('change', () => {
        localStorage.setItem('camera', cameraSelect.value);
        startMedia(cameraSelect.value, micSelect.value, resolutionSelect.value)
    });
    micSelect.addEventListener('change', () => {
        localStorage.setItem('microphone', micSelect.value);
        startMedia(cameraSelect.value, micSelect.value, resolutionSelect.value)
    });
    resolutionSelect.addEventListener('change', () => {
        localStorage.setItem('resolution', resolutionSelect.value);
        startMedia(cameraSelect.value, micSelect.value, resolutionSelect.value)
    });

    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            localStorage.setItem('volume', volumeSlider.value);
            if (gainNode) gainNode.gain.value = volumeSlider.value;
        });
    }

    /* Init */
    async function init() {
        await listDevices();

        /* Apply cache if available */
        if (cameraCache) cameraSelect.value = cameraCache;
        if (microphoneCache) micSelect.value = microphoneCache;
        if (resolutionCache) resolutionSelect.value = resolutionCache;
        if (volumeCache && volumeSlider) volumeSlider.value = volumeCache;

        if (cameraSelect.options.length > 0) {
            startMedia(cameraSelect.value, micSelect.value, resolutionSelect.value);
        } else {
            alert('Keine Kamera gefunden!');
        }
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(() => init())
        .catch(err => console.error('Zugriff verweigert:', err));

    const unmuteBtn = document.getElementById('unmuteBtn');
    if (unmuteBtn) {
        unmuteBtn.addEventListener('click', () => {
            video.muted = false;
            video.play();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === "F1") {
            event.preventDefault();
            showControls = !showControls;
            updateControlsAnimation();
        }
    });


    window.electronAPI.onFullScreenChanged((isFullScreen) => {
        console.log('Vollbild geändert:', isFullScreen);
        document.body.style.backgroundColor = isFullScreen ? 'black' : '#f4f4f4';

        if (isFullScreen) {
            showControls = false;
        } else {
            showControls = true;
        }
        updateControlsAnimation();
    });

    function updateControlsAnimation() {
        if (showControls) {
            cameraSelect.style.animation = 'fade-in 0.5s forwards';
            micSelect.style.animation = 'fade-in 0.5s forwards';
            resolutionSelect.style.animation = 'fade-in 0.5s forwards';
            controls.style.animation = 'fade-in-controls 0.5s forwards';
            controlInfo.style.animation = 'fade-in-control-info 0.5s forwards'
        } else {
            cameraSelect.style.animation = 'fade-out 0.5s forwards';
            micSelect.style.animation = 'fade-out 0.5s forwards';
            resolutionSelect.style.animation = 'fade-out 0.5s forwards';
            controls.style.animation = 'fade-out-controls 0.5s forwards';
            controlInfo.style.animation = 'fade-out-control-info 0.5s forwards'
        }
    }
});
