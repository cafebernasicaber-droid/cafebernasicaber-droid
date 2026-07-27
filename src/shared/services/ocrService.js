// ─────────────────────────────────────────────────────────────
//  src/shared/services/ocrService.js
//
//  Validación de comprobantes de compra mediante OCR:
//   1) Calidad de imagen (resolución, brillo, nitidez) — heurísticas
//      basadas en píxeles vía <canvas>, sin dependencias externas.
//   2) Extracción de texto con Tesseract.js (OCR real, corre en el
//      navegador, sin costo ni API key).
//   3) Detección del TOTAL del comprobante, priorizando el contexto
//      (palabras clave como "Total a pagar") en vez de tomar
//      simplemente el número más grande del documento.
//
//  LIMITACIÓN HONESTA: el punto "detectar que la imagen no es un
//  comprobante sino una fruta/persona/paisaje" no se puede resolver
//  con OCR real (el OCR solo lee texto, no reconoce escenas — eso
//  requeriría un modelo de visión por computador entrenado aparte).
//  Aquí se aproxima con una heurística de "densidad de texto y
//  palabras clave de comprobante": si la imagen no contiene texto
//  legible con patrones de factura/recibo, se rechaza. En la
//  práctica esto cubre bien el caso real (una foto de una fruta no
//  tiene texto), pero no es reconocimiento visual verdadero.
// ─────────────────────────────────────────────────────────────

const EXTENSIONES_PERMITIDAS = ['image/jpeg', 'image/jpg', 'image/png'];
const EXTENSIONES_PDF = ['application/pdf'];
const TAMANO_MAXIMO_MB = 10;

export const validarArchivoComprobante = (file) => {
  if (!file) return { valid: false, error: 'No se seleccionó ningún archivo.' };
  const esImagen = EXTENSIONES_PERMITIDAS.includes(file.type);
  const esPDF = EXTENSIONES_PDF.includes(file.type);
  if (!esImagen && !esPDF) {
    return { valid: false, error: 'Solo se aceptan archivos JPG, JPEG, PNG o PDF.' };
  }
  if (file.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
    return { valid: false, error: `El archivo no puede superar ${TAMANO_MAXIMO_MB} MB.` };
  }
  if (esPDF) {
    // El análisis OCR de esta versión trabaja sobre imágenes rasterizadas
    // en <canvas>; un PDF necesitaría primero convertirse a imagen
    // (requiere una librería adicional tipo pdf.js). Se acepta el
    // archivo como formato válido, pero se avisa que no puede pasar por
    // el análisis automático todavía.
    return { valid: true, requiereConversion: true };
  }
  return { valid: true };
};

// ── Calidad de imagen (resolución, brillo, nitidez) ─────────────────────────
const cargarImagenEnCanvas = (file) => new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    // Reducir a un tamaño de análisis razonable acelera el cálculo sin
    // perder la información necesaria para medir brillo/nitidez.
    const maxLado = 800;
    const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * escala));
    canvas.height = Math.max(1, Math.round(img.height * escala));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    resolve({ canvas, ctx, anchoOriginal: img.width, altoOriginal: img.height });
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
  img.src = url;
});

export const analizarCalidadImagen = async (file) => {
  try {
    const { canvas, ctx, anchoOriginal, altoOriginal } = await cargarImagenEnCanvas(file);

    // 1) Resolución mínima — una foto muy pequeña no tiene suficiente
    // detalle para leer texto de un comprobante con confianza.
    if (anchoOriginal < 400 || altoOriginal < 300) {
      return { ok: false, error: 'La imagen del comprobante no tiene la calidad suficiente para ser procesada. Por favor suba una fotografía clara, completa y legible.' };
    }

    // 1b) Proporción extrema (una tira muy angosta o muy alargada) suele
    // indicar que la foto quedó recortada y no muestra el comprobante
    // completo.
    const proporcion = Math.max(anchoOriginal, altoOriginal) / Math.min(anchoOriginal, altoOriginal);
    if (proporcion > 4) {
      return { ok: false, error: 'La imagen del comprobante no tiene la calidad suficiente para ser procesada. Por favor suba una fotografía clara, completa y legible.' };
    }

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const n = canvas.width * canvas.height;
    const gris = new Float32Array(n);
    let sumaBrillo = 0;
    for (let i = 0; i < n; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      const luminancia = 0.299 * r + 0.587 * g + 0.114 * b;
      gris[i] = luminancia;
      sumaBrillo += luminancia;
    }
    const brilloPromedio = sumaBrillo / n; // 0 (negro) – 255 (blanco)

    // 2) Brillo — demasiado oscura o demasiado sobreexpuesta impide leer el
    // texto igual de bien que un desenfoque.
    if (brilloPromedio < 40) {
      return { ok: false, error: 'La imagen del comprobante no tiene la calidad suficiente para ser procesada. Por favor suba una fotografía clara, completa y legible.' };
    }
    if (brilloPromedio > 235) {
      return { ok: false, error: 'La imagen del comprobante no tiene la calidad suficiente para ser procesada. Por favor suba una fotografía clara, completa y legible.' };
    }

    // 3) Nitidez — varianza de un operador tipo Laplaciano. Una imagen
    // borrosa tiene transiciones de brillo mucho más suaves (varianza
    // baja) que una nítida con bordes de letras marcados.
    const w = canvas.width, h = canvas.height;
    let sumaLap = 0, sumaLap2 = 0, cuenta = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const lap = 4 * gris[idx] - gris[idx - 1] - gris[idx + 1] - gris[idx - w] - gris[idx + w];
        sumaLap += lap;
        sumaLap2 += lap * lap;
        cuenta++;
      }
    }
    const media = sumaLap / cuenta;
    const varianza = sumaLap2 / cuenta - media * media;

    // Umbral empírico: fotos nítidas de texto suelen dar varianzas altas
    // (cientos o miles); una imagen borrosa cae muy por debajo.
    if (varianza < 60) {
      return { ok: false, error: 'La imagen del comprobante no tiene la calidad suficiente para ser procesada. Por favor suba una fotografía clara, completa y legible.' };
    }

    return { ok: true, metrics: { brilloPromedio, varianza, ancho: anchoOriginal, alto: altoOriginal } };
  } catch (err) {
    return { ok: false, error: 'No se pudo analizar la imagen del comprobante. Intenta con otra foto.' };
  }
};

// ── Extracción de texto (OCR real vía Tesseract.js) ─────────────────────────
export const extraerTextoComprobante = async (file, onProgress) => {
  const { recognize } = await import('tesseract.js');
  const { data } = await recognize(file, 'spa', {
    logger: onProgress ? (m) => { if (m.status === 'recognizing text') onProgress(Math.round((m.progress || 0) * 100)); } : undefined,
  });
  return data.text || '';
};

// ── ¿El texto extraído realmente parece un comprobante? ─────────────────────
// Ver limitación honesta al inicio del archivo: esto es una heurística de
// densidad de texto + palabras clave, no reconocimiento visual real.
const PALABRAS_COMPROBANTE = [
  'total', 'precio total', 'total compra', 'total a pagar', 'total factura',
  'valor total', 'total venta', 'importe total', 'pago total',
  'factura', 'recibo', 'ticket', 'comprobante', 'nit', 'venta', 'subtotal',
  'iva', 'efectivo', 'cambio', 'caja', 'cliente', 'fecha',
];

export const pareceComprobante = (texto) => {
  const limpio = (texto || '').toLowerCase();
  const palabrasEncontradas = PALABRAS_COMPROBANTE.filter(p => limpio.includes(p)).length;
  const tieneMontos = /[\$]?\s?\d{1,3}([.,]\d{3})+(\.\d{2})?|\d{4,}/.test(limpio);
  const suficienteTexto = limpio.replace(/\s/g, '').length >= 15;
  // Se exige un mínimo de señales de "documento de compra": texto
  // suficiente, al menos una palabra clave reconocible, y al menos un
  // monto con formato numérico. Una foto sin texto (fruta, persona,
  // paisaje, mascota) no cumple ninguna de las tres.
  return suficienteTexto && palabrasEncontradas >= 1 && tieneMontos;
};

// ── Detección del TOTAL, priorizando el contexto ────────────────────────────
// Prioridad de palabras clave: las más específicas ("total a pagar",
// "total factura") pesan más que la genérica "total", para no confundir
// subtotales o totales de línea con el total real de la compra.
const PALABRAS_TOTAL_PRIORIDAD = [
  { patron: /total\s+a\s+pagar/i,        peso: 100 },
  { patron: /total\s+factura/i,          peso: 95 },
  { patron: /total\s+venta/i,            peso: 90 },
  { patron: /valor\s+total/i,            peso: 85 },
  { patron: /importe\s+total/i,          peso: 85 },
  { patron: /pago\s+total/i,             peso: 80 },
  { patron: /total\s+compra/i,           peso: 80 },
  { patron: /precio\s+total/i,           peso: 75 },
  { patron: /\btotal\b/i,                peso: 50 },
];

const parsearMonto = (str) => {
  // Acepta formatos "123.456", "123,456", "123456", "$123.456", con o sin
  // decimales. Se asume separador de miles "." o "," (formato colombiano
  // habitual) y se descartan los 2 últimos dígitos solo si están
  // claramente marcados como decimales (",NN" o ".NN" con 2 dígitos).
  let limpio = str.replace(/[^\d.,]/g, '');
  const esDecimalFinal = /[.,]\d{2}$/.test(limpio);
  if (esDecimalFinal) {
    limpio = limpio.slice(0, -3);
  }
  limpio = limpio.replace(/[.,]/g, '');
  const num = parseInt(limpio, 10);
  return isNaN(num) ? null : num;
};

export const detectarTotalComprobante = (texto) => {
  const lineas = (texto || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const candidatos = [];

  lineas.forEach((linea, i) => {
    for (const { patron, peso } of PALABRAS_TOTAL_PRIORIDAD) {
      if (patron.test(linea)) {
        // El monto puede estar en la misma línea o en la siguiente
        // (algunos formatos de ticket separan la etiqueta del valor).
        const montosEnLinea = linea.match(/[\$]?\s?\d[\d.,]*\d|\d+/g) || [];
        const montosSiguiente = lineas[i + 1] ? (lineas[i + 1].match(/[\$]?\s?\d[\d.,]*\d|\d+/g) || []) : [];
        const fuente = montosEnLinea.length > 0 ? montosEnLinea : montosSiguiente;
        fuente.forEach(m => {
          const valor = parsearMonto(m);
          if (valor && valor >= 100) candidatos.push({ valor, peso });
        });
      }
    }
  });

  if (candidatos.length === 0) return null;
  // Se elige el candidato con mayor peso de palabra clave (no el número
  // más grande); ante empate de peso, el de mayor valor (más probable
  // que sea el total general y no un subtotal de línea).
  candidatos.sort((a, b) => (b.peso - a.peso) || (b.valor - a.valor));
  return candidatos[0].valor;
};

// ── Flujo completo: valida calidad → extrae texto → verifica que sea
// comprobante → detecta el total. Pensado para llamarse una sola vez
// desde el formulario de Registrar Compra.
export const procesarComprobante = async (file, onProgress) => {
  const calidad = await analizarCalidadImagen(file);
  if (!calidad.ok) return { ok: false, error: calidad.error };

  let texto;
  try {
    texto = await extraerTextoComprobante(file, onProgress);
  } catch (err) {
    return { ok: false, error: 'No se pudo leer el texto del comprobante. Intenta con una foto más clara.' };
  }

  if (!pareceComprobante(texto)) {
    return { ok: false, error: 'El archivo cargado no corresponde a un comprobante de compra válido.' };
  }

  const totalDetectado = detectarTotalComprobante(texto);
  if (totalDetectado == null) {
    return { ok: false, error: 'No se pudo identificar el total en el comprobante. Verifica que la imagen muestre claramente el total de la compra.' };
  }

  return { ok: true, texto, total: totalDetectado };
};
