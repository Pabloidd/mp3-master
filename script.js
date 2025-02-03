
const addTreckButtton = document.getElementById("add-treck-button");
const fileInput = document.getElementById("fileInput");
const musicList = document.getElementById("music-list");
const currentTrackDisplay = document.getElementById('current-track').querySelector('span');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const seekSlider = document.getElementById('seek-slider');
const volumeSlider = document.getElementById('volume-slider');
const increasingSortButton = document.getElementById("increasing-sort-button");
const decreasingSortButton = document.getElementById("decreasing-sort-button");
const randomButton = document.getElementById("random-button")

let currentAudio = null;
let currentListItem = null;
let trackList = [];
let currentTrackIndex = 0;
let randomIsOFF = true;
let randomArrayOfIndexes = []; // Добавил для хранения массива случайных индексов

randomButton.addEventListener('click', () => {
    randomIsOFF = !randomIsOFF;
    if (!randomIsOFF) {
        randomArrayOfIndexes = getRandomArrayOfIndexes(trackList);
         randomButton.classList.add('random-on'); // Добавляем класс при включении
    }else {
        randomButton.classList.remove('random-on')
    }
    console.log('randomIsOFF',randomIsOFF)
    console.log('randomArrayOfIndexes',randomArrayOfIndexes)
});


increasingSortButton.addEventListener('click', () => {
    sortTracks('asc')
});

decreasingSortButton.addEventListener('click', () => {
    sortTracks('desc')
});

function sortTracks(order){
    let currentTrackName = currentListItem ? currentListItem.querySelector('span').textContent : null
    if(order === 'asc'){
        trackList.sort((a, b) => a.querySelector('span').textContent.localeCompare(b.querySelector('span').textContent));
    } else {
        trackList.sort((a, b) => b.querySelector('span').textContent.localeCompare(a.querySelector('span').textContent));
    }
    musicList.innerHTML = '';
    trackList.forEach(item => musicList.appendChild(item));
    if(currentTrackName){
        currentListItem = trackList.find(item => item.querySelector('span').textContent === currentTrackName)
    }
    if(!randomIsOFF) {
        randomArrayOfIndexes =  getRandomArrayOfIndexes(trackList);
    }
}

addTreckButtton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if(file.type !== 'audio/mpeg'){
            console.log('не верный формат')
            continue;
        }
        const fileItem = document.createElement('li');
        fileItem.classList.add('file-item');

        const playIcon = document.createElement('i');
        playIcon.classList.add('fas', 'fa-play');
        fileItem.appendChild(playIcon);

        const infoSpan = document.createElement('span');
        fileItem.appendChild(infoSpan);


        const audio = new Audio(URL.createObjectURL(file));
        fileItem.audio = audio;

        readID3Tags(file).then(metadata =>{
            const title = metadata.title || file.name;
            const artist = metadata.artist || "неизвестно";
            const duration = audio.duration ? formatTime(audio.duration) : "неизвестно";
            infoSpan.innerHTML = `<span>${title}</span> - <span>${artist}</span> - <span>${duration}</span>`;
            fileItem.addEventListener('click', () => {
                playAudio(fileItem);
            });
        }).catch(()=>{
            const duration = audio.duration ? formatTime(audio.duration) : "неизвестно";
            infoSpan.innerHTML = `<span>${file.name}</span> - <span>неизвестно</span> - <span>${duration}</span>`;
            fileItem.addEventListener('click', () => {
                playAudio(fileItem);
            });
        }).finally(() => {
            trackList.push(fileItem);
            musicList.appendChild(fileItem);
            if(!randomIsOFF){
                randomArrayOfIndexes = getRandomArrayOfIndexes(trackList);
            }
        });

        audio.addEventListener('loadedmetadata', function() {
            if(fileItem.audio && !fileItem.audio.duration) {
                return
            }
            const duration = formatTime(audio.duration)
            const infoSpan = fileItem.querySelector('span')
            if(infoSpan){
                const parts = infoSpan.innerHTML.split('-');
                parts[2] = `<span>${duration}</span>`
                infoSpan.innerHTML = parts.join('-')
            }
        });
    }

    fileInput.value = '';
});

function playAudio(listItem) {
    if (currentListItem && currentListItem !== listItem) {
        pauseAudio(currentListItem);
    }
    const audio = listItem.audio;
    currentTrackIndex = trackList.indexOf(listItem)
    if (audio.paused) {
        audio.play();
        listItem.classList.add('playing');
        listItem.querySelector('i').classList.remove('fa-play');
        listItem.querySelector('i').classList.add('fa-pause');
        currentTrackDisplay.textContent = listItem.querySelector('span').textContent.split('-')[0].trim()
        playPauseBtn.querySelector('i').classList.remove('fa-play');
        playPauseBtn.querySelector('i').classList.add('fa-pause');

        currentAudio = audio;
        currentListItem = listItem;
        audio.addEventListener('ended', ()=>{
            listItem.classList.remove('playing');
            listItem.querySelector('i').classList.remove('fa-pause');
            listItem.querySelector('i').classList.add('fa-play');
            playPauseBtn.querySelector('i').classList.remove('fa-pause');
            playPauseBtn.querySelector('i').classList.add('fa-play');
            currentAudio = null;
            currentListItem = null;
            nextTrack()
        })
    } else {
        pauseAudio(listItem);
    }
}

function pauseAudio(listItem) {
    if(!listItem){
        return;
    }
    const audio = listItem.audio;
    audio.pause();
    listItem.classList.remove('playing');
    listItem.querySelector('i').classList.remove('fa-pause');
    listItem.querySelector('i').classList.add('fa-play');
    playPauseBtn.querySelector('i').classList.remove('fa-pause');
    playPauseBtn.querySelector('i').classList.add('fa-play');
   // currentAudio = null;   Удалил это
   // currentListItem = null;   и это
}

playPauseBtn.addEventListener('click', () => {
    if (currentAudio) {
        if (currentAudio.paused) {
            currentAudio.play();
            if(currentListItem){
                currentListItem.classList.add('playing');
                currentListItem.querySelector('i').classList.remove('fa-play');
                currentListItem.querySelector('i').classList.add('fa-pause');
            }
            playPauseBtn.querySelector('i').classList.remove('fa-play');
            playPauseBtn.querySelector('i').classList.add('fa-pause');
        } else {
           if(currentListItem) {
              pauseAudio(currentListItem);
           }
        }
    }
});

prevBtn.addEventListener('click', () => {
    prevTrack()
})

nextBtn.addEventListener('click', () => {
    nextTrack()
})
function prevTrack() {
    if (trackList.length === 0) {
        return;
    }
    if (randomIsOFF) {
        currentTrackIndex = currentTrackIndex === 0 ? trackList.length - 1 : currentTrackIndex - 1;
    } else {
        let currentIndexInRandom = randomArrayOfIndexes.indexOf(currentTrackIndex);
        currentIndexInRandom = currentIndexInRandom === 0 ? randomArrayOfIndexes.length - 1 : currentIndexInRandom - 1;
        currentTrackIndex = randomArrayOfIndexes[currentIndexInRandom];
    }
    playAudio(trackList[currentTrackIndex]);
}

function nextTrack() {
    if (trackList.length === 0) {
        return;
    }
    if (randomIsOFF) {
        currentTrackIndex = currentTrackIndex === trackList.length - 1 ? 0 : currentTrackIndex + 1;
    } else {
        let currentIndexInRandom = randomArrayOfIndexes.indexOf(currentTrackIndex);
        currentIndexInRandom = currentIndexInRandom === randomArrayOfIndexes.length - 1 ? 0 : currentIndexInRandom + 1;
        currentTrackIndex = randomArrayOfIndexes[currentIndexInRandom];
    }
    playAudio(trackList[currentTrackIndex]);
}

seekSlider.addEventListener('input', () => {
    if(currentAudio){
        currentAudio.currentTime = seekSlider.value;
    }
});

volumeSlider.addEventListener('input', () => {
    if(currentAudio){
        currentAudio.volume = volumeSlider.value / 100;
    }
});

setInterval(() => {
    if (currentAudio) {
        seekSlider.max = currentAudio.duration;
        seekSlider.value = currentAudio.currentTime;
    }
}, 100);


function formatTime(duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}


function readID3Tags(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const buffer = event.target.result;
            const id3Data = parseID3(buffer);
            resolve(id3Data);
        };
        reader.onerror = function(error) {
            reject(error)
        }
        reader.readAsArrayBuffer(file);
    });
}


function parseID3(buffer) {
    let title = null;
    let artist = null;
    let pos = 0;
    let dv = new DataView(buffer);

    if (buffer.byteLength < 10) return {};


    if (dv.getUint8(0) === 0x49 && dv.getUint8(1) === 0x44 && dv.getUint8(2) === 0x33)
    {
        let major = dv.getUint8(3);
        let minor = dv.getUint8(4);
        let flags = dv.getUint8(5);
        let size  = (dv.getUint8(6) << 21) | (dv.getUint8(7) << 14) | (dv.getUint8(8) << 7) | (dv.getUint8(9));

        pos += 10;

        while(pos < size){
            if(pos + 10 > buffer.byteLength){
                break
            }
            let frameId = String.fromCharCode(dv.getUint8(pos + 0), dv.getUint8(pos + 1), dv.getUint8(pos + 2), dv.getUint8(pos + 3));
            let frameSize = (dv.getUint8(pos + 4) << 24) | (dv.getUint8(pos + 5) << 16) | (dv.getUint8(pos + 6) << 8) | dv.getUint8(pos + 7);
            let frameFlags = (dv.getUint8(pos + 8) << 8) | dv.getUint8(pos + 9);
            pos += 10;
            if (pos + frameSize > buffer.byteLength){
                break;
            }

            if (frameId === 'TIT2') {
                let encoding = dv.getUint8(pos);
                pos++;
                title = decodeText(buffer.slice(pos, pos + frameSize - 1), encoding);

            } else if (frameId === 'TPE1') {
                let encoding = dv.getUint8(pos);
                pos++;
                artist = decodeText(buffer.slice(pos, pos + frameSize - 1), encoding);

            } else {
                pos += frameSize;
            }
        }
    }
    return {title, artist}
}

function decodeText(buffer, encoding) {
    let decoder;
    if (encoding === 1) {
        decoder = new TextDecoder('utf-16');
    } else if (encoding === 3) {
        decoder = new TextDecoder('utf-8');
    } else {
        decoder = new TextDecoder('iso-8859-1');
    }

    return decoder.decode(buffer);
}

function getRandomArrayOfIndexes(array) {
    let arrayOfIndexes = [];
    const n = array.length -1; // Используем длину массива
    while (arrayOfIndexes.length !== array.length) {
        let randomIndex = Math.floor(Math.random() * (n + 1));
        if (!arrayOfIndexes.includes(randomIndex)) {
            arrayOfIndexes.push(randomIndex);
        }
    }
    console.log(arrayOfIndexes);
    return arrayOfIndexes;
}