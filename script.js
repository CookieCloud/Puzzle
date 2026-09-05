const carregarBtn = document.getElementById('carregarBtn');
const puzzleContainer = document.getElementById('puzzleContainer');
const imagePreview = document.getElementById('imagePreview');
const missatgeDiv = document.getElementById('missatge');
const divisionsSelect = document.getElementById('divisionsSelect');

let imagenActual = null;
let divisions = 4;
let piecesCorrectes = 0;

// APIs públiques per a imatges
const APIs = [
    'https://api.unsplash.com/photos/random?client_id=YOUR_UNSPLASH_KEY&w=600&h=600',
    'https://picsum.photos/600/600?random=',
    'https://source.unsplash.com/600x600/?nature,art'
];

async function carregarImagenAleatoria() {
    try {
        missatgeDiv.textContent = 'Carregant imatge...';
        missatgeDiv.className = '';
        
        // Usar Picsum que no necessita API key
        const timestamp = new Date().getTime();
        const imageUrl = `https://picsum.photos/600/600?random=${timestamp}`;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            imagenActual = imageUrl;
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
    imagePreview.innerHTML = `<img src="${imagenActual}" alt="Original">`;
}

function crearPuzzle() {
    divisions = parseInt(divisionsSelect.value);
    puzzleContainer.innerHTML = '';
    puzzleContainer.style.gridTemplateColumns = `repeat(${divisions}, 1fr)`;
    
    piecesCorrectes = 0;
    const totalPieces = divisions * divisions;
    
    // Crear array amb les posicions
    const posiciones = Array.from({length: totalPieces}, (_, i) => i);
    
    // Desordenar
    for (let i = posiciones.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posiciones[i], posiciones[j]] = [posiciones[j], posiciones[i]];
    }
    
    // Crear peces
    posiciones.forEach((posicio, index) => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.draggable = true;
        piece.dataset.posicioCorrecta = posicio;
        piece.dataset.posicioActual = index;
        
        // Calcular posició a la imatge
        const fila = Math.floor(posicio / divisions);
        const columna = posicio % divisions;
        const tamanyPeca = 600 / divisions;
        
        piece.style.backgroundImage = `url('${imagenActual}')`;
        piece.style.backgroundPosition = `${columna * tamanyPeca}px ${fila * tamanyPeca}px`;
        piece.style.backgroundSize = `${divisions * tamanyPeca}px ${divisions * tamanyPeca}px`;
        
        piece.addEventListener('dragstart', dragStart);
        piece.addEventListener('dragover', dragOver);
        piece.addEventListener('drop', drop);
        piece.addEventListener('dragend', dragEnd);
        
        puzzleContainer.appendChild(piece);
    });
}

let draggedElement = null;

function dragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function drop(e) {
    e.preventDefault();
    
    if (draggedElement !== this) {
        // Intercanviar peces
        const temp = draggedElement.dataset.posicioActual;
        draggedElement.dataset.posicioActual = this.dataset.posicioActual;
        this.dataset.posicioActual = temp;
        
        // Reordenar al DOM
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
    
    if (correctes === pieces.length) {
        missatgeDiv.textContent = '🎉 ¡Victòria! Puzzle completat!';
        missatgeDiv.className = 'victòria';
    }
}

carregarBtn.addEventListener('click', carregarImagenAleatoria);
divisionsSelect.addEventListener('change', () => {
    if (imagenActual) crearPuzzle();
});

// Carregar imatge al iniciar
carregarImagenAleatoria();
