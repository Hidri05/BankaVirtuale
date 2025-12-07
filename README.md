
# 🏦 Karakteristikat Kryesore të Bankes Virtuale

## 🔹 Për Adminin
- **Hyrje me kredencialet e veta:** `admin / admin123`
- **Krijim i llogarive të reja** (Savings / Checking) me balancë fillestare dhe fjalëkalim.
- **Fshirje e llogarive të klientëve** me konfirmim modal.
- **Aplikimi manual i 1% interesi** në fund të çdo muaji (demo: 60s interval për testim).
- **Eksporti dhe importi i të gjitha llogarive** dhe përdoruesve në format JSON.

## 🔹 Për Përdoruesin
- **Hyrje me emrin dhe fjalëkalimin e llogarisë së vet.**
- **Depozitim, tërheqje, transfer** midis llogarive.
- **Eksport i llogarisë së vet** në JSON.
- **Ndryshim i fjalëkalimit të llogarisë së vet.**
- **Pamje e historikut të llogarisë (Logs)** dhe grafikut të balancës.

## 🔹 Për të gjithë
- **Grafik linje** që tregon historikun e balancës për çdo llogari.
- **Interesi automatik 1%** për çdo llogari në fund të muajit (demo interval 60s).
- **Eksport/Import JSON** për backup ose rikuperim të llogarive.

---

# ⚙️ Si funksionon

## Hyrja në aplikacion
- **Admin:** `admin / admin123`
- **Përdorues të zakonshëm:** emri i krijuar gjatë krijimit të llogarisë + fjalëkalim.

## Dashboard
- **Admin** sheh të gjitha llogaritë, mund të krijojë dhe fshijë llogari, të aplikojë interes.
- **Përdorues normal** sheh vetëm **llogarinë e vet**, mund të bëjë depozitë, tërheqje, transfer dhe të ndryshojë fjalëkalimin.

## Veprime të Llogarisë
- **Depozitim:** shton vlerë në llogari.
- **Tërheqje:** heq vlerë nga llogaria, me kontrolle minimale.
- **Transfer:** transferon vlerë midis dy llogarive.
- **Interes:** 1% i aplikuar në fund të çdo muaji ose manual nga admini.

## Historiku dhe Grafiku
- Çdo veprim regjistrohet në **Logs**.
- Balanca ruhet në **history** për çdo ndryshim, duke gjeneruar **grafikun linjë** që tregon trendin e balancës.

## Eksport / Import
- Eksporton të dhënat në **JSON** (të gjitha llogaritë ose vetëm llogaria e përdoruesit).
- Importon JSON për të rikuperuar llogaritë ose për të futur të dhëna të tjera.

## Tema
- Ndryshon ndërmjet **Light / Dark Mode** me butonin "Theme" në topbar.

---

# 📝 Si ta përdorësh
1. Hyr si **admin** ose **përdorues**.
2. Përdor panelin e **Adminit** për të krijuar llogari të reja, fshirë llogari dhe aplikuar interes.
3. Për përdorues normal:
   - Zgjidh llogarinë dhe bëj veprimet (Depozitë / Tërheqje / Transfer).
   - Shiko **Logs** dhe **grafikun e balancës**.
   - Eksporto llogarinë për backup.

---

# ⚠️ Shënime
- Të dhënat ruhen vetëm në **localStorage**, prandaj pas fshirjes së cookies ose clear localStorage, të dhënat humbasin.
- Interesi automatik në demo është **60 sekonda**.
- Grafiku shfaq vetëm historikun e fundit të **365 ndryshimeve** (ose ditëve).
=======
# BankaVirtuale
>>>>>>> c570efe1bcca79cf667547804c730732265b915c
