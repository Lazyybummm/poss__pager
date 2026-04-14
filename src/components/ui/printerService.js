import QRious from "qrious";

// ==================== ESC/POS COMMANDS ====================
const ESC = 0x1B, GS = 0x1D;

const cmd = {
  init:      ()     => [ESC, 0x40],
  align:     (n)    => [ESC, 0x61, n],          // 0=L 1=C 2=R
  bold:      (on)   => [ESC, 0x45, on ? 1 : 0],
  underline: (n)    => [ESC, 0x2D, n],          // 0=off 1=thin 2=thick
  dblWidth:  (on)   => on ? [ESC, 0x0E] : [ESC, 0x14],
  charSize:  (w, h) => [GS, 0x21, ((w - 1) << 4) | (h - 1)],
  invert:    (on)   => [GS, 0x42, on ? 1 : 0],
  feed:      (n)    => [ESC, 0x64, n],
  feedDots:  (n)    => [ESC, 0x4A, n],
  lf:        ()     => [0x0A],

  barcode128: (data) => {
    const d = Array.from(new TextEncoder().encode(String(data)));
    const payload = [0x7B, 0x42, ...d];
    return [
      GS, 0x68, 60,           // GS h  — bar height 60 dots
      GS, 0x77, 2,            // GS w  — module width 2
      GS, 0x48, 2,            // GS H  — HRI below barcode
      GS, 0x6B, 73,           // GS k m=73 (CODE128 format ②)
      payload.length,         // n
      ...payload
    ];
  }
};

function txt(str) { 
    return Array.from(new TextEncoder().encode(str)); 
}

// ==================== IMAGE RASTERIZATION (For QR) ====================
function generateRasterQR(text, size = 128) {
  const qr = new QRious({ value: text, size: size, level: 'M' });
  const cvs = qr.canvas;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  const w = cvs.width;
  const h = cvs.height;
  
  const imgData = ctx.getImageData(0, 0, w, h).data;
  
  // RP203 Printhead width is exactly 384 dots (48 bytes per line)
  const PRINTER_WIDTH_BYTES = 48; 
  const qrWidthBytes = Math.ceil(w / 8);
  
  // Calculate how many blank bytes to pad on the left
  const leftPadBytes = Math.floor((PRINTER_WIDTH_BYTES - qrWidthBytes) / 2);
  
  // Create a blank full-width image array (initialized to 0x00 / white space)
  const raster = new Uint8Array(PRINTER_WIDTH_BYTES * h);

  // Draw the QR code into the middle of the blank array
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const isDark = imgData[(y * w + x) * 4] < 128; 
      if (isDark) {
        // Shift x index by leftPadBytes to center it
        const byteIndex = (y * PRINTER_WIDTH_BYTES) + leftPadBytes + Math.floor(x / 8);
        raster[byteIndex] |= (1 << (7 - (x % 8)));
      }
    }
  }

  const xL = PRINTER_WIDTH_BYTES & 0xFF; // Should be 48
  const xH = (PRINTER_WIDTH_BYTES >> 8) & 0xFF; // Should be 0
  const yL = h & 0xFF;
  const yH = (h >> 8) & 0xFF;

  return [
    0x1B, 0x61, 0x00,    // Force printer alignment to Left
    0x1D, 0x76, 0x30, 0, // GS v 0: Print raster bit image
    xL, xH,              // Total horizontal bytes (48)
    yL, yH,              // Total vertical dots (128)
    ...Array.from(raster)
  ];
}

// ==================== PRINT EXPORT ====================
export const printReceipt = async (order, cartDetails, discountAmt, taxAmt, settings, port) => {
  if (!port || !port.writable) {
    console.error("No writable port available for printing");
    return;
  }

  // Set default printing options
  const printOptions = {
    bold: false, dblw: false, underline: false, invert: false,
    token: true, barcode: true, qr: false
  };

  const bytes = [];
  const line = (s) => bytes.push(...txt(s + '\n'));
  const divider = (ch = '-') => line(ch.repeat(32));

  // Map settings and order data
  const f = {
    shopName: settings?.shopName || "POS RESTAURANT",
    shopPhone: settings?.phone || "",
    orderId: order.id ? `ORD-${order.id}` : `ORD-000`,
    payMode: (order.paymentMethod || "CASH").toUpperCase(),
    subtotal: cartDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    discount: discountAmt || 0,
    gstAmt: taxAmt || 0,
    total: order.total || 0,
    token: order.token || 1,
  };

  bytes.push(...cmd.init());

  // === SHOP HEADER ===
  bytes.push(...cmd.align(1));
  bytes.push(...cmd.charSize(2, 2), ...cmd.bold(true));
  line(f.shopName);
  bytes.push(...cmd.charSize(1, 1), ...cmd.bold(false));
  if (f.shopPhone) line('Ph: ' + f.shopPhone);
  divider('=');

  // === ORDER INFO ===
  bytes.push(...cmd.align(0));
  bytes.push(...cmd.bold(true));
  line(`Order   : ${f.orderId}`);
  bytes.push(...cmd.bold(false));
  line(`Date    : ${new Date().toLocaleString('en-IN')}`);
  line(`Payment : ${f.payMode}`);

  // === TOKEN ===
  if (printOptions.token) {
    bytes.push(...cmd.align(1));
    bytes.push(...cmd.charSize(2, 2), ...cmd.bold(true));
    line(`TOKEN: ${f.token}`);
    bytes.push(...cmd.charSize(1, 1), ...cmd.bold(false));
  }
  divider();

  // === ITEMS ===
  bytes.push(...cmd.align(0));
  cartDetails.forEach(item => {
      line(`${item.quantity}x ${item.name}`);
      line(`   Rs.${item.price} = Rs.${item.quantity * item.price}`);
  });
  divider();

  // === TOTALS ===
  bytes.push(...cmd.align(0));
  line(`Subtotal  : Rs.${f.subtotal.toFixed(2)}`);
  if (f.discount > 0) line(`Discount  : -Rs.${f.discount.toFixed(2)}`);
  if (f.gstAmt > 0)   line(`Tax       : Rs.${f.gstAmt.toFixed(2)}`);
  
  bytes.push(...cmd.bold(true));
  divider();
  bytes.push(...cmd.charSize(1, 2));
  line(`TOTAL     : Rs.${f.total.toFixed(2)}`);
  bytes.push(...cmd.charSize(1, 1), ...cmd.bold(false));
  divider('=');

  // === BARCODE ===
  if (printOptions.barcode && order.id) {
    bytes.push(...cmd.align(1));
    bytes.push(...cmd.barcode128(f.orderId));
    bytes.push(...cmd.feedDots(12));
  }

  bytes.push(...cmd.align(1));
  line('Thank you for your visit!');
  bytes.push(...cmd.feed(4));

  // === SEND TO PRINTER ===
  let writer;
  try {
    writer = port.writable.getWriter();
    // Faster chunking optimized for 115200/9600 baud
    const CHUNK_SIZE = 128; 
    
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      await writer.write(new Uint8Array(chunk));
      await new Promise(resolve => setTimeout(resolve, 10)); 
    }
    console.log("Print Job Sent Successfully.");
  } catch (error) {
    console.error("Printing failed:", error);
  } finally {
    if (writer) {
      writer.releaseLock();
    }
  }
};