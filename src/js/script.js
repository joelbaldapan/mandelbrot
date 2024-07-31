const canvas = document.getElementById("mandelbrotCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let zoom = 1;
let offsetX = 0;
let offsetY = 0;

let maxIter = 200; // Adjustable

function mandelbrot(x, y) {
  let real = x;
  let imag = y;
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
      let iter = mandelbrot(real, imag);
      let pixelIndex = (y * canvas.width + x) * 4;

      // Map the number of iterations to HSB values
      let r = 0;
      let g = 0;
      let b = 0;
      if (iter === maxIter) {
        r = 0;
        g = 0;
        b = 0;
      } else {
        let hue = 300 - ((Math.pow(iter / 50, 0.5) * 200) % 255);
        let sat = 80;
        let bri = 100;

        [r, g, b] = hsbToRgb(hue, sat, bri);
      }

      data[pixelIndex] = r; // Red
      data[pixelIndex + 1] = g; // Green
      data[pixelIndex + 2] = b; // Blue
      data[pixelIndex + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

//
// COMPUTER
//

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

//
// PHONE
//

// Variables to track the initial touch points and zoom level
let initialDistance = 0;
let currentZoom = 1;
let startX, startY;

canvas.addEventListener("touchstart", handleTouchStart, false);
canvas.addEventListener("touchmove", handleTouchMove, false);
canvas.addEventListener("touchend", handleTouchEnd, false);

function handleTouchStart(event) {
  if (event.touches.length === 1) {
    // Single touch - swipe
    startX = event.touches[0].pageX;
    startY = event.touches[0].pageY;
  } else if (event.touches.length === 2) {
    // Two touches - pinch zoom
    const dx = event.touches[1].pageX - event.touches[0].pageX;
    const dy = event.touches[1].pageY - event.touches[0].pageY;
    initialDistance = Math.sqrt(dx * dx + dy * dy);
  }
}

function handleTouchMove(event) {
  if (event.touches.length === 1) {
    // Single touch - swipe
    const deltaX = event.touches[0].pageX - startX;
    const deltaY = event.touches[0].pageY - startY;
    // Move the canvas or image
    // Example: Adjust position based on deltaX and deltaY
    canvas.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  } else if (event.touches.length === 2) {
    // Two touches - pinch zoom
    const dx = event.touches[1].pageX - event.touches[0].pageX;
    const dy = event.touches[1].pageY - event.touches[0].pageY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);
    const zoomFactor = currentDistance / initialDistance;
    currentZoom *= zoomFactor;
    // Apply zoom
    canvas.style.transform = `scale(${currentZoom})`;
    initialDistance = currentDistance;
  }
}

function handleTouchEnd(event) {
  // Reset initial values after touch ends
  initialDistance = 0;
}

render();

function hsbToRgb(hue, sat, bri) {
  let r, g, b;
  hue = ((hue % 360) + 360) % 360;
  sat = Math.min(Math.max(sat, 0), 100) / 100;
  bri = Math.min(Math.max(bri, 0), 100) / 100;

  if (sat === 0) {
    r = g = b = bri; // achromatic (gray)
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
