document.addEventListener('DOMContentLoaded', () => {
    // --- BÜTÜN ELEMENTLER ---
    const body = document.body;
    const tumEkranlar = document.querySelectorAll('.ekran');
    const zamanSelamlamasi = document.getElementById('zaman-selamlamasi');
    const mesajGorseli = document.getElementById('mesaj-gorseli');
    const mesajVideosu = document.getElementById('mesaj-videosu');
    const mesajSesi = document.getElementById('mesaj-sesi');
    const mesajMetni = document.getElementById('mesaj-metni');
    const moodButonlari = document.querySelectorAll('.mood-buttons button');
    const takvimSayaci = document.getElementById('takvim-sayaci');
    const takvimGun = document.getElementById('takvim-gun');
    const kalpYagmuruContainer = document.getElementById('kalp-yagmuru-container');
    let tumMesajlar = {};
    const BASLANGIC_TARIHI = new Date('2024-11-24T00:00:00');
    const VIP_IP = '31.223.105.250';
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    // ... (diğer elementler)
    const notEkleBtn = document.getElementById('not-ekle-btn');
    const notlariGosterBtn = document.getElementById('notlari-goster-btn');
    const notKaydetBtn = document.getElementById('not-kaydet-btn');
    const notTextarea = document.getElementById('not-textarea');
    const notListesiContainer = document.getElementById('not-listesi-container');
    const geriDonBtnleri = document.querySelectorAll('.geri-don-btn');

    // --- YARDIMCI FONKSİYONLAR ---
    
    // (Bu fonksiyonların tanımlamalarının tam olduğunu varsayıyorum)
    const ekranGoster = (ekranId) => {
    tumEkranlar.forEach(ekran => {
        // Tüm ekranları gizle
        ekran.classList.add('gizli');
        ekran.classList.remove('aktif', 'animasyon-baslat');
    });

    // Hedef ekranı göster
    const hedef = document.getElementById(ekranId);
    if (hedef) {
        hedef.classList.remove('gizli');
        // küçük gecikmeyle animasyon başlatmak istersen:
        requestAnimationFrame(() => {
            hedef.classList.add('aktif', 'animasyon-baslat');
        });
    } else {
        console.warn('ekranGoster: hedef ekran bulunamadı:', ekranId);
    }
};

    
    const zamanaGoreAyarla = () => {
        const saat = new Date().getHours();
        let selam;
        if (saat < 5) selam = "Gecen güzel olsun,";
        else if (saat < 12) selam = "Günaydın,";
        else if (saat < 18) selam = "Tünaydın,";
        else if (saat < 22) selam = "İyi akşamlar,";
        else selam = "İyi geceler,";
        if(zamanSelamlamasi) zamanSelamlamasi.textContent = selam;
    };

    const kalpYagmuruBaslat = () => {
        if (!kalpYagmuruContainer) return;
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const kalp = document.createElement('div');
                kalp.className = 'kalp';
                kalp.innerHTML = '❤️';
                kalp.style.left = `${Math.random() * 100}vw`;
                kalp.style.animationDuration = `${Math.random() * 2 + 3}s`;
                kalpYagmuruContainer.appendChild(kalp);
                setTimeout(() => kalp.remove(), 5000);
            }, i * 100);
        }
    };
    
    // --- YENİ NOT FONKSİYONLARI ---

// Notları localStorage'dan çeker
const notlariGetir = () => {
    return JSON.parse(localStorage.getItem('gunlukNotlar')) || [];
};

// Notları localStorage'a kaydeder
const notlariKaydet = (notlar) => {
    localStorage.setItem('gunlukNotlar', JSON.stringify(notlar));
};

// Not ekleme ekranını gösterir
const notEkleEkraniniGoster = () => {
    const bugun = new Date().toLocaleDateString('tr-TR');
    const notlar = notlariGetir();
    // O güne ait not varsa textarea'ya yazar
    const bugununNotu = notlar.find(n => n.tarih === bugun);
    notTextarea.value = bugununNotu ? bugununNotu.icerik : '';
    ekranGoster('not-ekle-ekrani');
};

// Yeni notu kaydeder veya günceller
const notKaydet = () => {
    const notIcerigi = notTextarea.value.trim();
    if (notIcerigi === '') {
        alert('Lütfen bir şeyler yaz.');
        return;
    }

    const bugun = new Date().toLocaleDateString('tr-TR');
    let notlar = notlariGetir();

    // O güne ait not var mı kontrol et
    const mevcutNotIndex = notlar.findIndex(n => n.tarih === bugun);

    if (mevcutNotIndex > -1) {
        // Varsa güncelle
        notlar[mevcutNotIndex].icerik = notIcerigi;
    } else {
        // Yoksa yeni not olarak ekle (en başa)
        notlar.unshift({ tarih: bugun, icerik: notIcerigi });
    }

    notlariKaydet(notlar);
    alert('Notun kaydedildi!');
    ekranGoster('karsilama-ekrani');
};

// Tüm geçmiş notları ekranda listeler
const notlariGoster = () => {
    const notlar = notlariGetir();
    notListesiContainer.innerHTML = ''; // Listeyi temizle

    if (notlar.length === 0) {
        notListesiContainer.innerHTML = '<p style="color:white; text-align:center;">Henüz hiç not eklememişsin.</p>';
        ekranGoster('notlarim-ekrani');
        return;
    }

    notlar.forEach(not => {
        const notElementi = document.createElement('div');
        notElementi.className = 'not-item';

        // Satır sonlarını HTML <br> etiketine çevir
        const icerikHtml = not.icerik.replace(/\n/g, '<br>');

        notElementi.innerHTML = `
            <div class="not-tarih">${not.tarih}</div>
            <div class="not-icerik">${icerikHtml}</div>
        `;
        notListesiContainer.appendChild(notElementi);
    });

    ekranGoster('notlarim-ekrani');
};

    // --- ANA AKIŞ ---
    async function init() {
        try {
            const res = await fetch('mesajlar.json');
            tumMesajlar = await res.json();
        } catch (e) {
            document.body.innerHTML = "<h1>HATA: Veri dosyası yüklenemedi.</h1>";
            return;
        }

        let kullaniciIP = '';
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            kullaniciIP = data.ip;
        } catch (error) {
            console.error("IP alınamadı.");
        }

        if (kullaniciIP === VIP_IP) {
            // VIP KULLANICI AKIŞI
            zamanaGoreAyarla();
            
            
            const gunFarki = Math.floor((new Date() - BASLANGIC_TARIHI) / (1000 * 60 * 60 * 24));
            if(takvimGun) takvimGun.textContent = gunFarki;
            if(takvimSayaci) {
                takvimSayaci.classList.remove('gizli');
                takvimSayaci.classList.add('aktif', 'animasyon-baslat');
            }
            ekranGoster('karsilama-ekrani');
            
            return;
        }

        // NORMAL KULLANICI AKIŞI
        if (!localStorage.getItem('ilkAcilisYapildiMi')) {
            ekranGoster('gala-ekrani');
            localStorage.setItem('ilkAcilisYapildiMi', 'evet');
            return;
        }
        
        const bugun = new Date().toLocaleDateString();
        let girisKaydi = JSON.parse(localStorage.getItem('girisKaydi')) || {};
        if (girisKaydi.tarih !== bugun) {
            girisKaydi = { tarih: bugun, sayac: 1 };
        } else {
            girisKaydi.sayac++;
        }
        localStorage.setItem('girisKaydi', JSON.stringify(girisKaydi));
        
        if (girisKaydi.sayac > 3) {
            const limitMesajiElementi = document.getElementById('limit-mesaji');
            if (limitMesajiElementi) {
                limitMesajiElementi.innerHTML = `Aşkım yeter la bu kadar meraklı olma yarını bekle`;
            }
            ekranGoster('limit-ekrani');
            return;
        }

        zamanaGoreAyarla();
        

        const tamTarih = `${new Date().getDate().toString().padStart(2, '0')}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}`;
        const gunAy = tamTarih.substring(0, 5);
        const ozelGunMesaji = tumMesajlar.ozelGunler.find(g => g.tarih === tamTarih) || tumMesajlar.ozelGunler.find(g => g.tarih === gunAy);
        
        if (ozelGunMesaji) {
            mesajiGoster(ozelGunMesaji);
        } else {
            const gunFarki = Math.floor((new Date() - BASLANGIC_TARIHI) / (1000 * 60 * 60 * 24));
            if(takvimGun) takvimGun.textContent = gunFarki;
            if(takvimSayaci) {
                takvimSayaci.classList.remove('gizli');
                takvimSayaci.classList.add('aktif', 'animasyon-baslat');
            }
            ekranGoster('karsilama-ekrani');
        }
    }

    // --- MESAJ GÖSTERME SİHRİ (GÜNCELLENDİ!) ---
    async function mesajiGoster(mesajObj) {
        ekranGoster('mesaj-ekrani');
        
        // Önceki içerikleri temizle
        [mesajGorseli, mesajVideosu, mesajSesi].forEach(el => {
            if (el) {
                el.style.display = 'none';
                el.src = '';
            }
        });
        if(mesajMetni) mesajMetni.innerHTML = '';

        // Yeni içerikleri yükle
        if (mesajObj.videoDosyasi && mesajVideosu) {
            mesajVideosu.src = `videolar/${mesajObj.videoDosyasi}`;
            mesajVideosu.style.display = 'block';
        } else if (mesajObj.gorseller && mesajObj.gorseller.length > 0 && mesajGorseli) {
            mesajGorseli.src = `gorseller/${mesajObj.gorseller[0]}`;
            mesajGorseli.style.display = 'block';
        }
        if (mesajObj.sesDosyasi && mesajSesi) {
            mesajSesi.src = `sesler/${mesajObj.sesDosyasi}`;
            mesajSesi.style.display = 'block';
        }

        // HARF HARF YAZDIRMA (HTML DESTEKLİ!)
        if (mesajMetni) {
            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = mesajObj.mesaj; // HTML'i ayrıştır
            let i = 0;
            async function yazdir() {
                if (i < tempDiv.childNodes.length) {
                    const node = tempDiv.childNodes[i];
                    if (node.nodeType === Node.TEXT_NODE) { // Düz yazıysa
                        for (const char of node.textContent) {
                            mesajMetni.innerHTML += char;
                            await sleep(50);
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) { // <span> gibi etiketse
                        mesajMetni.appendChild(node.cloneNode(true));
                    }
                    i++;
                    await yazdir();
                }
            }
            await yazdir(); // Yazdırma işlemini başlat
        }


        // ETKİLEŞİMLERİ EKLE
        if (mesajObj.gizliSes && mesajGorseli && mesajGorseli.style.display !== 'none') {
            mesajGorseli.onclick = () => {
                new Audio(`sesler/${mesajObj.gizliSes}`).play();
                mesajGorseli.onclick = null; // Sadece bir kez çal
            };
        }
        if (mesajMetni) {
            const sihirliKelimeElement = mesajMetni.querySelector('.sihirli-kelime');
            if (sihirliKelimeElement) {
                sihirliKelimeElement.onclick = () => kalpYagmuruBaslat();
            }
        }
    }

    // --- BUTON OLAYLARI ---
    moodButonlari.forEach(button => {
        button.addEventListener('click', () => {
            const mood = button.dataset.mood;
            if (!mood) return;
            const gorulenler = JSON.parse(localStorage.getItem('gorulenMesajlar')) || [];
            let havuz = [];
            
            // Artık 'regl' kontrolüne gerek yok, direkt normal mesajları arayabiliriz.
              havuz = (tumMesajlar.ruhHaliMesajlari[mood] || []).filter(m => !gorulenler.includes(m.id));
            
            let secilen = havuz.length > 0 ? havuz[Math.floor(Math.random() * havuz.length)] : {
                id: 0,
                mesaj: "Bu hisse ait bütün anılarımızı şimdilik gördün... Ama her gün yenilerini yazıyoruz."
            };
            
            if (secilen.id !== 0) {
                fetch('https://api.ipify.org?format=json')
                    .then(res => res.json())
                    .then(data => {
                        if (data.ip !== VIP_IP) {
                            gorulenler.push(secilen.id);
                            localStorage.setItem('gorulenMesajlar', JSON.stringify(gorulenler));
                        }
                    });
            }
            mesajiGoster(secilen);
        });
    });
    // ... (savasciCagrisi listener'ını sildiğin yer)

// --- YENİ NOT SİSTEMİ OLAYLARI ---

if (notEkleBtn) {
    notEkleBtn.addEventListener('click', notEkleEkraniniGoster);
}

if (notlariGosterBtn) {
    notlariGosterBtn.addEventListener('click', notlariGoster);
}

if (notKaydetBtn) {
    notKaydetBtn.addEventListener('click', notKaydet);
}

geriDonBtnleri.forEach(btn => {
    btn.addEventListener('click', () => {
        ekranGoster('karsilama-ekrani');
    });
});




    // --- ANA AKIŞI BAŞLAT ---
    init();
});
