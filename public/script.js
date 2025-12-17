// Form handler
const tdForm = document.getElementById('tdForm');
const printBtn = document.getElementById('printBtn');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const addGangguanBtn = document.getElementById('addGangguanBtn');

let gangguanCount = 1;

// Event listeners
printBtn.addEventListener('click', () => window.print());

saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await saveLaporan();
});

resetBtn.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin mereset form?')) {
        tdForm.reset();
    }
});

addGangguanBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addGangguanRow();
});

// Fungsi ambil data form
function getFormData() {
    const formData = new FormData(tdForm);
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    return data;
}

// Fungsi simpan laporan
async function saveLaporan() {
    try {
        const formData = getFormData();

        const response = await fetch('/api/simpan-laporan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ formData })
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ ' + result.message);
            console.log('File tersimpan:', result.filename);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Gagal menyimpan laporan: ' + error.message);
    }
}

// Fungsi tambah baris gangguan
function addGangguanRow() {
    gangguanCount++;
    const table = document.querySelector('#gangguanTable tbody');
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="time" name="gangguan_waktu_${gangguanCount}"></td>
        <td><input type="text" name="gangguan_peralatan_${gangguanCount}" placeholder="Peralatan"></td>
        <td><input type="text" name="gangguan_jenis_${gangguanCount}" placeholder="Jenis gangguan"></td>
        <td><input type="text" name="gangguan_tindakan_${gangguanCount}" placeholder="Tindakan"></td>
        <td>
            <select name="gangguan_status_${gangguanCount}">
                <option>Selesai</option>
                <option>Lanjutan</option>
            </select>
        </td>
    `;
    
    table.appendChild(newRow);
}

// Auto-save ke localStorage setiap kali ada perubahan
tdForm.addEventListener('change', () => {
    const formData = getFormData();
    localStorage.setItem('tdFormData', JSON.stringify(formData));
    console.log('✅ Form auto-saved ke localStorage');
});

// Restore data dari localStorage saat halaman dimuat
window.addEventListener('load', () => {
    const savedData = localStorage.getItem('tdFormData');
    
    if (savedData) {
        const data = JSON.parse(savedData);
        
        for (let [key, value] of Object.entries(data)) {
            const field = tdForm.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = value;
            }
        }
        
        console.log('✅ Data restored dari localStorage');
    }
});

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
    // Ctrl+P untuk print
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
    
    // Ctrl+S untuk save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveLaporan();
    }
});