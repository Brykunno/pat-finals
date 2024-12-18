const express = require('express');
const qrcode = require('qrcode');
const path = require('path');

const app = express();
const PORT = 3000;

let sales = 0; // Initialize total sales

// Serve static files (like images)
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.json()); // Parse JSON request bodies

app.get('/qrcode', (req, res) => {
  const jsonData = [
    { name: 'Sapphire Pulse Radeon RX 7600 8GB GDDR6 Graphics Card', price: 110, src1: 'images/sr.png' },
    { name: 'Logitech G102 Gaming Mouse White', price: 90, src1: 'images/m1.png' },
    { name: 'MSI MAG B650M Mortar WIFI AMD Ryzen 7000 Series AM5 Motherboard', price: 140, src1: 'images/mb1.png' },
    { name: 'Tecware Forge M High Airflow w/ FREE 4 Omni aRGB Fans mATX PC Case Black', price: 120, src1: 'images/case1.png' },
    { name: 'Redragon YGM1 World of Warcraft Wired Mechanical Gaming Keyboard', price: 152, src1: 'images/k2.png' },
    { name: 'Xiaomi Mini LED G Pro 27i 27″ 2560 x 1440 Fast IPS 180Hz 1ms FreeSync Gaming Monitor', price: 290, src1: 'images/moni.png' },
    { name: 'Apple Mac Mini M2 8GB 256GB | 512GB 2023', price: 380, src1: 'images/apple.png' },
    { name: 'ASRock B550M/AC AM4 AMD Motherboard', price: 260, src1: 'images/b5.png' },
  ];

  const generateQRCodePromises = jsonData.map((product) =>
    qrcode.toDataURL(JSON.stringify(product)).then((qrcodeurl) => ({
      ...product,
      qrcodeurl,
    }))
  );

  Promise.all(generateQRCodePromises)
    .then((qrCodes) => {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>COMPUTER PARTS</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f8f9fa; }
            .card { border-radius: 15px; overflow: hidden; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); }
            .card img { max-width: 100%; object-fit: cover; }
            .btn-primary { background-color: #007bff; border: none; transition: background-color 0.3s ease; }
            .btn-primary:hover { background-color: #0056b3; }
            .sales-counter { font-size: 1.5rem; font-weight: bold; color: #28a745; }
          </style>
        </head>
        <body>
          <nav class="navbar bg-body-tertiary rounded shadow-lg">
            <div class="container-fluid">
              <span class="navbar-brand mb-0 h1 mx-auto">COMPUTER PARTS</span>
            </div>
          </nav> 

          <div class="container">
            <div class="text-center mb-4">
              <span class="sales-counter">Total Sales: $<span id="total-sales">${sales}</span></span>
            </div>
            <div class="row">
              ${qrCodes
                .map(
                  (product, index) => `
                    <div class="card col-4 m-3" style="width: 18rem;">
                      <img src="${product.src1}" class="card-img-top" height="225" width="300" alt="${product.name}">
                      <div class="card-body">
                        <p class="card-text">${product.name}</p>
                        <p class="card-text">Price: $${product.price}</p>
                        <button class="btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#modal-${index}">
                          Show QR Code
                        </button>
                      </div>
                    </div>

                    <!-- Modal -->
                    <div class="modal fade" id="modal-${index}" tabindex="-1" aria-labelledby="modal-${index}Label" aria-hidden="true">
                      <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                          <div class="modal-header">
                            <h1 class="modal-title fs-5" id="modal-${index}Label">${product.name}</h1>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                          </div>
                          <div class="modal-body">
                            <div class="d-flex gap-3 m-3">
                              <div>
                                <img src="${product.src1}" height="200" width="200" class="shadow-lg" alt="Product Image">
                              </div>
                              <div>
                                <img src="${product.qrcodeurl}" height="200" width="200" class="shadow-lg" alt="QR Code">
                              </div>
                            </div>
                            <p class="card-text">Price: $${product.price}</p>
                          </div>
                          <div class="modal-footer">
                        
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  `
                )
                .join('')}
            </div>
          </div>

          <script>
            document.querySelectorAll('.purchase-btn').forEach(button => {
              button.addEventListener('click', () => {
                const productName = button.getAttribute('data-name');
                const productPrice = button.getAttribute('data-price');

                fetch('/purchase', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productName, productPrice }),
                })
                  .then(response => response.json())
                  .then(data => {
                    if (data.success) {
                      document.getElementById('total-sales').textContent = data.sales;
                      alert(data.message);
                    } else {
                      alert('Purchase failed: ' + data.message);
                    }
                  })
                  .catch(err => {
                    console.error('Error:', err);
                    alert('An error occurred. Please try again.');
                  });
              });
            });
          </script>
        </body>
        </html>
      `;
      res.send(html);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error generating QR codes');
    });
});

// Endpoint to handle purchases
app.post('/purchase', (req, res) => {
  const { productName, productPrice } = req.body;

  if (!productName || !productPrice) {
    return res.status(400).send({ success: false, message: 'Invalid product details!' });
  }

  sales += Number(productPrice);

  console.log(`Purchase received: ${productName}, $${productPrice}`);
  
  // Send response with updated sales count
  res.send({ success: true, message: 'Purchase recorded successfully!', sales });
});

app.listen(PORT,'192.168.41.206', () => {
  console.log(`Server is running on http://192.168.41.206:${PORT}`);
});
