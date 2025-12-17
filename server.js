const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const app = express();

// ========================================
// KONFIGURASI
// ========================================
const CONFIG = {
  port: 3000,
  host: 'localhost'
};

// ========================================
// MIDDLEWARE
// ========================================
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// LOGGING SETUP
// ========================================
const logsDir = path.join(__dirname, 'logs');

async function initLogsDirectory() {
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (err) {
    console.error('Error creating logs directory:', err);
  }
}

function getLogFilePath() {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  return path.join(logsDir, `form-server_${dateStr}.log`);
}

async function writeToLogFile(message, type = 'LOG') {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type}] ${message}\n`;
    const logFilePath = getLogFilePath();
    
    await fs.appendFile(logFilePath, logMessage, 'utf8');
  } catch (err) {
    // Silent fail
  }
}

// ========================================
// ROUTES
// ========================================

// Route utama - serve form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route untuk simpan laporan
app.post('/api/simpan-laporan', async (req, res) => {
  try {
    const { formData } = req.body;
    
    if (!formData) {
      return res.status(400).json({
        success: false,
        message: 'Data form kosong'
      });
    }

    // Buat folder untuk menyimpan laporan
    const reportsDir = path.join(__dirname, 'laporan');
    await fs.mkdir(reportsDir, { recursive: true });

    // Buat nama file berdasarkan tanggal dan nama TD
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const namaFile = `${timestamp}_${formData.technicalDirector || 'laporan'}.json`;
    const filePath = path.join(reportsDir, namaFile);

    // Simpan ke file
    await fs.writeFile(filePath, JSON.stringify(formData, null, 2), 'utf8');

    console.log(`✅ Laporan disimpan: ${namaFile}`);
    await writeToLogFile(`Laporan disimpan: ${namaFile}`, 'LOG');

    res.json({
      success: true,
      message: '✅ Laporan berhasil disimpan',
      filename: namaFile,
      path: filePath
    });
  } catch (error) {
    console.error('❌ Error menyimpan laporan:', error.message);
    await writeToLogFile(`Error: ${error.message}`, 'ERROR');

    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan laporan: ' + error.message
    });
  }
});

// Route untuk ambil laporan yang tersimpan
app.get('/api/laporan', async (req, res) => {
  try {
    const reportsDir = path.join(__dirname, 'laporan');
    
    try {
      const files = await fs.readdir(reportsDir);
      const laporan = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(
            path.join(reportsDir, file),
            'utf8'
          );
          laporan.push({
            filename: file,
            data: JSON.parse(content)
          });
        }
      }

      res.json({
        success: true,
        count: laporan.length,
        laporan: laporan
      });
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.json({
          success: true,
          count: 0,
          laporan: []
        });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('❌ Error ambil laporan:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal ambil laporan: ' + error.message
    });
  }
});

// Route untuk download laporan JSON
app.get('/api/laporan/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'laporan', filename);

    // Validasi filename untuk security
    if (!filename.endsWith('.json') || filename.includes('..')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    res.download(filepath);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal download: ' + error.message
    });
  }
});

// ========================================
// ERROR HANDLER & START SERVER
// ========================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan server'
  });
});

async function startServer() {
  await initLogsDirectory();
  
  app.listen(CONFIG.port, CONFIG.host, () => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   🚀 TD Form Server Ready!            ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`📍 URL: http://${CONFIG.host}:${CONFIG.port}`);
    console.log(`📁 Public Folder: public/`);
    console.log(`📋 Logs: logs/`);
    console.log('\n✅ Server ready for form submission!\n');
  });
}

startServer().catch(console.error);