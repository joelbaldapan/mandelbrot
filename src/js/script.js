const canvas = document.getElementById("mandelbrotCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let zoom = 0.25;
let offsetX = 0;
let offsetY = 0;

let maxIter = 100; // Adjustable
let numWorkers = Math.min(navigator.hardwareConcurrency || 4); // Limit to 4 workers
let workers = [];
let pendingChunks = [];
let renderTimeout;

function createWorkers(num) {
  for (let i = 0; i < num; i++) {
    let worker = new Worker("./src/js/worker.js");
    worker.onmessage = handleWorkerMessage;
    worker.onerror = handleWorkerError;
    workers.push(worker);
  }
}

function handleWorkerMessage(e) {
  const { imageData, startY, endY } = e.data;
  ctx.putImageData(imageData, 0, startY);

  pendingChunks = pendingChunks.filter(
    (chunk) => chunk.startY !== startY || chunk.endY !== endY
  );

  if (pendingChunks.length === 0) {
    clearTimeout(renderTimeout);
  }
}

function handleWorkerError(error) {
  console.error("Worker error:", error);
  const failedChunk = pendingChunks.shift();
  if (failedChunk) {
    renderChunk(failedChunk.startY, failedChunk.endY);
  }
}

function renderChunk(startY, endY) {
  // Fallback rendering code (single-threaded)
  const imageData = ctx.createImageData(canvas.width, endY - startY);
  const aspectRatio = canvas.width / canvas.height;

  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let real = (x - canvas.width / 2) / (0.5 * zoom * canvas.width) + offsetX;
      let imag =
        (y - canvas.height / 2) / (0.5 * zoom * canvas.height) / aspectRatio +
        offsetY;
      let iter = mandelbrot(real, imag, maxIter);
      let pixelIndex = ((y - startY) * canvas.width + x) * 4;

      let [r, g, b] = getColor(iter, maxIter);

      imageData.data[pixelIndex] = r;
      imageData.data[pixelIndex + 1] = g;
      imageData.data[pixelIndex + 2] = b;
      imageData.data[pixelIndex + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, startY);
}

function render() {
  const chunkSize = Math.ceil(canvas.height / numWorkers);
  pendingChunks = [];

  clearTimeout(renderTimeout);

  workers.forEach((worker, index) => {
    const startY = index * chunkSize;
    const endY = Math.min((index + 1) * chunkSize, canvas.height);
    pendingChunks.push({ startY, endY });
    worker.postMessage({
      width: canvas.width,
      height: canvas.height,
      startY: startY,
      endY: endY,
      zoom: zoom,
      offsetX: offsetX,
      offsetY: offsetY,
      maxIter: maxIter,
      aspectRatio: canvas.width / canvas.height,
    });
  });

  renderTimeout = setTimeout(() => {
    if (pendingChunks.length > 0) {
      console.log("Render incomplete, falling back to single-threaded");
      pendingChunks.forEach((chunk) => renderChunk(chunk.startY, chunk.endY));
    }
  }, 5000);
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

// Fallback functions for single-threaded rendering
function mandelbrot(x0, y0, maxIter) {
  let x = 0,
    y = 0,
    x2 = 0,
    y2 = 0;
  let iter = 0;

  while (x2 + y2 <= 4 && iter < maxIter) {
    y = 2 * x * y + y0;
    x = x2 - y2 + x0;
    x2 = x * x;
    y2 = y * y;
    iter++;
  }

  return iter;
}

function getColor(iter, maxIter) {
  if (iter === maxIter) return [0, 0, 0];

  let hue = 250 - ((Math.pow(iter / 50, 0.5) * 200) % 255);
  let sat = 80;
  let bri = 10 + ((Math.pow(iter / 50, 0.2) * 100) % 255);

  return hsbToRgb(hue, sat, bri);
}

function hsbToRgb(hue, sat, bri) {
  let r, g, b;
  hue = ((hue % 360) + 360) % 360;
  sat = Math.min(Math.max(sat, 0), 100) / 100;
  bri = Math.min(Math.max(bri, 0), 100) / 100;

  if (sat === 0) {
    r = g = b = bri;
  } else {
    let hueAngle = hue / 60;
    let i = Math.floor(hueAngle);
    let f = hueAngle - i;
    let p = bri * (1 - sat);
    let q = bri * (1 - sat * f);
    let t = bri * (1 - sat * (1 - f));

    switch (i) {
      case 0:
        r = bri;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = bri;
        b = p;
        break;
      case 2:
        r = p;
        g = bri;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = bri;
        break;
      case 4:
        r = t;
        g = p;
        b = bri;
        break;
      case 5:
        r = bri;
        g = p;
        b = q;
        break;
    }
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
