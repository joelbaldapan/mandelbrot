function mandelbrot(x, y, maxIter) {
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

self.onmessage = function (e) {
  const {
    imageData,
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
  const data = imageData.data;

  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < width; x++) {
      let real = (x - width / 2) / (0.5 * zoom * width) + offsetX;
      let imag =
        (y - height / 2) / (0.5 * zoom * height) / aspectRatio + offsetY;
      let iter = mandelbrot(real, imag, maxIter);
      let pixelIndex = ((y - startY) * width + x) * 4;

      let r, g, b;
      if (iter === maxIter) {
        r = g = b = 0;
      } else {
        let hue = 250 - ((Math.pow(iter / 50, 0.5) * 200) % 255);
        let sat = 80;
        let bri = 10 + ((Math.pow(iter / 50, 0.2) * 100) % 255);

        [r, g, b] = hsbToRgb(hue, sat, bri);
      }

      data[pixelIndex] = r;
      data[pixelIndex + 1] = g;
      data[pixelIndex + 2] = b;
      data[pixelIndex + 3] = 255;
    }
  }

  self.postMessage({ imageData: imageData, startY: startY, endY: endY });
};

self.onerror = function (error) {
  console.error("Worker error:", error);
};
