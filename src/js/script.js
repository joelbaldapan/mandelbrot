const canvas = document.getElementById("mandelbrotCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let zoom = 0.25;
let offsetX = 0;
let offsetY = 0;

let maxIter = 100; // Adjustable
// let numWorkers = navigator.hardwareConcurrency || 4; // Use available cores or default to 4
let numWorkers = 10;
let workers = [];

function createWorkers(num) {
  for (let i = 0; i < num; i++) {
    let worker = new Worker("./src/js/worker.js");
    worker.onmessage = handleWorkerMessage;
    workers.push(worker);
  }
}

function handleWorkerMessage(e) {
  const { imageData, startY, endY } = e.data;
  ctx.putImageData(imageData, 0, startY);

  // Check if all workers have finished
  if (workers.every((w) => w.idle)) {
    workers.forEach((w) => (w.idle = false));
  }
}

function render() {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const aspectRatio = canvas.width / canvas.height;
  const chunkSize = Math.ceil(canvas.height / numWorkers);

  workers.forEach((worker, index) => {
    const startY = index * chunkSize;
    const endY = Math.min((index + 1) * chunkSize, canvas.height);
    worker.idle = false;
    worker.postMessage({
      imageData: imageData,
      width: canvas.width,
      height: canvas.height,
      startY: startY,
      endY: endY,
      zoom: zoom,
      offsetX: offsetX,
      offsetY: offsetY,
      maxIter: maxIter,
      aspectRatio: aspectRatio,
    });
  });
}

function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}

function handleMouseWheel(event) {
  event.preventDefault();
  const scaleFactor = 1.1;
  zoom *= event.deltaY < 0 ? scaleFactor : 1 / scaleFactor;
  render();
}

function handleMouseDrag(event) {
  if (event.buttons === 1) {
    offsetX -= event.movementX / (0.5 * zoom * canvas.width);
    offsetY -= event.movementY / (0.5 * zoom * canvas.height);
    render();
  }
}

let touchStartX = 0;
let touchStartY = 0;
let initialZoom = zoom;
let initialDistance = 0;

function handleTouchStart(event) {
  if (event.touches.length === 1) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  } else if (event.touches.length === 2) {
    initialDistance = getDistance(event.touches[0], event.touches[1]);
    initialZoom = zoom;
  }
}

function handleTouchMove(event) {
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    offsetX -= (touch.clientX - touchStartX) / (0.5 * zoom * canvas.width);
    offsetY -= (touch.clientY - touchStartY) / (0.5 * zoom * canvas.height);
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  } else if (event.touches.length === 2) {
    const newDistance = getDistance(event.touches[0], event.touches[1]);
    zoom = initialZoom * (newDistance / initialDistance);
  }
  render();
  event.preventDefault();
}

function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

window.addEventListener("resize", handleResize);
canvas.addEventListener("wheel", handleMouseWheel);
canvas.addEventListener("mousemove", handleMouseDrag);
canvas.addEventListener("touchstart", handleTouchStart);
canvas.addEventListener("touchmove", handleTouchMove);

createWorkers(numWorkers);
render();
