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

function getColor(iter, maxIter) {
  if (iter === maxIter) return [0, 0, 0];

  let hue = 250 - ((Math.pow(iter / 50, 0.5) * 200) % 255);
  let sat = 80;
  let bri = 10 + ((Math.pow(iter / 50, 0.2) * 100) % 255);

  return hsbToRgb(hue, sat, bri);
}

const colorPalette = new Array(101); // maxIter + 1
for (let i = 0; i <= 100; i++) {
  colorPalette[i] = getColor(i, 100);
}

self.onmessage = function (e) {
  if (!e || !e.data) {
    console.error("Invalid message received in worker");
    return;
  }

  const {
    width,
    height,
    startY,
    endY,
    zoom,
    offsetX,
    offsetY,
    maxIter,
    aspectRatio,
  } = e.data;

  const imageData = new ImageData(width, endY - startY);

  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < width; x++) {
      let real = (x - width / 2) / (0.5 * zoom * width) + offsetX;
      let imag =
        (y - height / 2) / (0.5 * zoom * height) / aspectRatio + offsetY;
      let iter = mandelbrot(real, imag, maxIter);
      let pixelIndex = ((y - startY) * width + x) * 4;

      let [r, g, b] = colorPalette[iter];

      imageData.data[pixelIndex] = r;
      imageData.data[pixelIndex + 1] = g;
      imageData.data[pixelIndex + 2] = b;
      imageData.data[pixelIndex + 3] = 255;
    }
  }

  self.postMessage({ imageData, startY, endY }, [imageData.data.buffer]);
};

self.onerror = function (error) {
  console.error("Worker error:", error);
};
