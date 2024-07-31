const canvas = document.getElementById("mandelbrotCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let zoom = 1;
let offsetX = 0;
let offsetY = 0;

function mandelbrot(x, y) {
  let real = x;
  let imag = y;
  let maxIter = 100;
  let iter = 0;

  while (real * real + imag * imag <= 4 && iter < maxIter) {
    let tempReal = real * real - imag * imag + x;
    let tempImag = 2 * real * imag + y;
    real = tempReal;
    imag = tempImag;
    iter++;
  }

  return iter;
}

function render() {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate the aspect ratio
  const aspectRatio = canvas.width / canvas.height;

  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      // Adjust for the aspect ratio
      let real = (x - canvas.width / 2) / (0.5 * zoom * canvas.width) + offsetX;
      let imag =
        (y - canvas.height / 2) / (0.5 * zoom * canvas.height) / aspectRatio +
        offsetY;
      let color = mandelbrot(real, imag);
      let pixelIndex = (y * canvas.width + x) * 4;
      let colorValue = color === 100 ? 0 : (color * 255) / 100;

      data[pixelIndex] = colorValue; // Red
      data[pixelIndex + 1] = colorValue; // Green
      data[pixelIndex + 2] = colorValue; // Blue
      data[pixelIndex + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imageData, 0, 0);
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
    // Left mouse button
    offsetX -= event.movementX / (0.5 * zoom * canvas.width);
    offsetY -= event.movementY / (0.5 * zoom * canvas.height);
    render();
  }
}

window.addEventListener("resize", handleResize);
canvas.addEventListener("wheel", handleMouseWheel);
canvas.addEventListener("mousemove", handleMouseDrag);

render();
