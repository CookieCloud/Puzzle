const carregarBtn = document.getElementById('carregarBtn');
const puzzleContainer = document.getElementById('puzzleContainer');
const imagePreview = document.getElementById('imagePreview');
const missatgeDiv = document.getElementById('missatge');
const divisionsSelect = document.getElementById('divisionsSelect');

let imagenActual = null;
let divisions = 4;
let canvasImg = null;

async function carregarImagenAleatoria() {
    try {
        missatgeDiv.textContent = 'Carregant imatge...';
        missatgeDiv.className = '';
        
        const timestamp = new Date().getTime();
        const imageUrl = `https://picsum.photos/600/600?random=${timestamp}`;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            imagenActual = imageUrl;
            canvasImg = img;
            mostrarImatge();
            crearPuzzle();
            missatgeDiv.textContent = '';
        };
        
        img.onerror = () => {
            missatgeDiv.textContent = 'Error al carregar la imatge. Intenta de nou.';
            missatgeDiv.className = 'error';
        };
        
        img.src = imageUrl;
        
    } catch (error) {
        console.error('Error:', error);
        missatgeDiv.textContent = 'Error al carregar la imatge.';
        missatgeDiv.className = 'error';
    }
}

function mostrarImatge() {
    imagePreview.innerHTML = `<img src="${imagenActual}" alt="Original" style="max-width:100%; border-radius:6px;">`;
}

function crearPuzzle() {
    divisions = parseInt(divisionsSelect.value);
    puzzleContainer.innerHTML = '';
    puzzleContainer.style.gridTemplateColumns = `repeat(${divisions}, 1fr)`;
    
    const totalPieces = divisions * divisions;
    const tamanyPeca = 600 / divisions;
    
    // Array amb les posicions correctes
    const posiciones = Array.from({length: totalPieces}, (_, i) => i);
    
    // Desordenar (Fisher-Yates shuffle)
    for (let i = posiciones.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posiciones[i], posiciones[j]] = [posiciones[j], posiciones[i]];
    }
    
    // Crear peces
    posiciones.forEach((posicioCorrecta, indexActual) => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.draggable = true;
        piece.dataset.posicioCorrecta = posicioCorrecta;
        piece.dataset.posicioActual = indexActual;
        
        // Calcular fila i columna de la peca
        const fila = Math.floor(posicioCorrecta / divisions);
        const columna = posicioCorrecta % divisions;
        
        // Crear canvas per cada peca
        const canvas = document.createElement('canvas');
        canvas.width = tamanyPeca;
        canvas.height = tamanyPeca;
        const ctx = canvas.getContext('2d');
        
        if (canvasImg) {
            ctx.drawImage(
                canvasImg,
                columna * tamanyPeca,
                fila * tamanyPeca,
                tamanyPeca,
                tamanyPeca,
                0,
                0,
                tamanyPeca,
                tamanyPeca
            );
        }
        
        piece.style.backgroundImage = `url('${canvas.toDataURL()}')`;
        piece.style.backgroundSize = 'cover';
        piece.style.backgroundPosition = 'center';
        
        // Events
        piece.addEventListener('dragstart', dragStart);
        piece.addEventListener('dragover', dragOver);
        piece.addEventListener('drop', drop);
        piece.addEventListener('dragend', dragEnd);
        
        // Touch events per a iPhone
        piece.addEventListener('touchstart', touchStart);
        piece.addEventListener('touchmove', touchMove);
        piece.addEventListener('touchend', touchEnd);
        
        puzzleContainer.appendChild(piece);
    });
}

let draggedElement = null;

function dragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.6';
    e.dataTransfer.effectAllowed = 'move';
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function drop(e) {
    e.preventDefault();
    
    if (draggedElement && draggedElement !== this) {
        // Intercanviar
        const tempData = draggedElement.dataset.posicioActual;
        draggedElement.dataset.posicioActual = this.dataset.posicioActual;
        this.dataset.posicioActual = tempData;
        
        // Reordenar DOM
        const allPieces = Array.from(puzzleContainer.children);
        const indexA = allPieces.indexOf(draggedElement);
        const indexB = allPieces.indexOf(this);
        
        if (indexA < indexB) {
            this.parentNode.insertBefore(draggedElement, this);
        } else {
            this.parentNode.insertBefore(this, draggedElement);
        }
        
        verificarSolucio();
    }
}

function dragEnd(e) {
    this.style.opacity = '1';
    draggedElement = null;
}

// Touch support per a iPhone
let touchItem = null;

function touchStart(e) {
    touchItem = this;
    this.style.opacity = '0.6';
}

function touchMove(e) {
    e.preventDefault();
}

function touchEnd(e) {
    this.style.opacity = '1';
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('puzzle-piece') && element !== touchItem) {
        const tempData = touchItem.dataset.posicioActual;
        touchItem.dataset.posicioActual = element.dataset.posicioActual;
        element.dataset.posicioActual = tempData;
        
        const allPieces = Array.from(puzzleContainer.children);
        const indexA = allPieces.indexOf(touchItem);
        const indexB = allPieces.indexOf(element);
        
        if (indexA < indexB) {
            element.parentNode.insertBefore(touchItem, element);
        } else {
            element.parentNode.insertBefore(element, touchItem);
        }
        
        verificarSolucio();
    }
    
    touchItem = null;
}

function verificarSolucio() {
    const pieces = Array.from(puzzleContainer.children);
    let correctes = 0;
    
    pieces.forEach(piece => {
        const posicioActual = parseInt(piece.dataset.posicioActual);
        const posicioCorrecta = parseInt(piece.dataset.posicioCorrecta);
        
        if (posicioActual === posicioCorrecta) {
            piece.classList.add('correcta');
            correctes++;
        } else {
            piece.classList.remove('correcta');
        }
    });
    
    if (correctes === pieces.length && pieces.length > 0) {
        missatgeDiv.textContent = '🎉 ¡Victòria! Puzzle completat!';
        missatgeDiv.className = 'victòria';
    }
}

carregarBtn.addEventListener('click', carregarImagenAleatoria);
divisionsSelect.addEventListener('change', () => {
    if (imagenActual && canvasImg) crearPuzzle();
});

// Carregar imatge al iniciar
carregarImagenAleatoria();
