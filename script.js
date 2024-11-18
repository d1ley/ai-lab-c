document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById('map-container');
    const map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, USGS, NOAA'
    }).addTo(map);

    const locationBtn = document.getElementById('locationBtn');
    const downloadMapBtn = document.getElementById('downloadMapBtn');

    locationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 13);
                L.marker([latitude, longitude]).addTo(map)
                    .bindPopup("Twoja lokalizacja").openPopup();
            }, (error) => {
                alert('Brak dostępu do lokalizacji');
            });
        } else {
            alert('Geolokalizacja nie jest wspierana przez twoją przeglądarkę');
        }
    });

    downloadMapBtn.addEventListener('click', () => {
        leafletImage(map, function (err, canvas) {
            if (err) {
                console.error('Błąd przy eksporcie mapy:', err);
                return;
            }

            const imageDataUrl = canvas.toDataURL('image/png');
            const mapWidth = mapContainer.offsetWidth;
            const mapHeight = mapContainer.offsetHeight;

            const puzzleBoard = document.getElementById('puzzle-board');
            puzzleBoard.style.width = `${mapWidth}px`;
            puzzleBoard.style.height = `${mapHeight}px`;

            podzielMapeNaPuzzle(imageDataUrl, mapWidth, mapHeight);
        });
    });

    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
});

function podzielMapeNaPuzzle(imageDataUrl, mapWidth, mapHeight) {
    const puzzlePieces = document.getElementById('puzzle-pieces');
    const puzzleBoard = document.getElementById('puzzle-board');
    puzzlePieces.innerHTML = '';
    puzzleBoard.innerHTML = '';

    const img = new Image();
    img.src = imageDataUrl;
    img.onload = () => {
        // Округляем размеры до целого числа
        const pieceWidth = Math.floor(mapWidth / 4);
        const pieceHeight = Math.floor(mapHeight / 4);

        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const canvas = document.createElement('canvas');
                canvas.width = pieceWidth;
                canvas.height = pieceHeight;

                const context = canvas.getContext('2d');
                context.drawImage(
                    img,
                    x * pieceWidth,
                    y * pieceHeight,
                    pieceWidth,
                    pieceHeight,
                    0,
                    0,
                    pieceWidth,
                    pieceHeight
                );

                const piece = document.createElement('div');
                piece.classList.add('puzzle-piece');
                piece.style.backgroundImage = `url(${canvas.toDataURL()})`;
                piece.style.width = `${pieceWidth}px`;
                piece.style.height = `${pieceHeight}px`;
                piece.setAttribute('data-x', x);
                piece.setAttribute('data-y', y);

                piece.draggable = true;
                piece.addEventListener('dragstart', handleDragStart);

                puzzlePieces.appendChild(piece);

                const boardCell = document.createElement('div');
                boardCell.classList.add('puzzle-cell');
                boardCell.style.width = `${pieceWidth}px`;
                boardCell.style.height = `${pieceHeight}px`;
                boardCell.setAttribute('data-x', x);
                boardCell.setAttribute('data-y', y);
                boardCell.addEventListener('dragover', handleDragOver);
                boardCell.addEventListener('drop', handleDrop);

                puzzleBoard.appendChild(boardCell);
            }
        }

        // Перемешиваем элементы
        [...puzzlePieces.children]
            .sort(() => Math.random() - 0.5)
            .forEach((child) => {
                puzzlePieces.appendChild(child);
            });
    };
}

function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.getAttribute('data-x') + ',' + event.target.getAttribute('data-y'));
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDrop(event) {
    event.preventDefault();

    const [x, y] = event.dataTransfer.getData('text/plain').split(',');
    const draggedPiece = document.querySelector(`.puzzle-piece[data-x="${x}"][data-y="${y}"]`);

    const targetCell = event.target;
    if (targetCell.classList.contains('puzzle-cell') &&
        targetCell.getAttribute('data-x') === x &&
        targetCell.getAttribute('data-y') === y) {
        targetCell.appendChild(draggedPiece);
        sprawdzCzyUkładankaZłożona();
    }
}

function sprawdzCzyUkładankaZłożona() {
    const cells = document.querySelectorAll('#puzzle-board .puzzle-cell');
    let complete = true;

    cells.forEach(cell => {
        const piece = cell.querySelector('.puzzle-piece');
        if (!piece ||
            piece.getAttribute('data-x') !== cell.getAttribute('data-x') ||
            piece.getAttribute('data-y') !== cell.getAttribute('data-y')) {
            complete = false;
        }
    });

    if (complete) {
        console.log('Wszystkie puzzle są prawidłowo złożone!');
        wyswietlPowiadomienie('Gratulacje! Ułożyłeś układankę.');
    } else {
        console.log('Puzzle nie są jeszcze w pełni zmontowane или są zmontowane nieprawidłowo.');
    }
}

function wyswietlPowiadomienie(tresc) {
    if (Notification.permission === 'granted') {
        new Notification(tresc);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(tresc);
            }
        });
    }
}
