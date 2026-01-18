# Playwright Screenshot Instructions

## Samm 1: Käivita frontend arendusserver

Ava terminal ja käivita:
```bash
npm run dev
```

Oodake, kuni server on käivitunud (http://localhost:9002)

## Samm 2: Võta ekraanipildid

Ava uus terminal ja käivita:
```bash
npx playwright test
```

Playwright avab brauseri ja:
1. Esimene kord küsib sind Google'iga sisse logima (brauserit saad näha)
2. Logi sisse oma Google kontoga
3. Pärast sisenemist salvestab see sinu sessiooni `.auth/user.json` faili
4. Teeb automaatselt ekraanipildid kõigist lehtedest

## Samm 3: Vaata ekraanipilte

Ekraanipildid salvestatakse `screenshots/` kausta:
- `screenshots/login-page.png` - Sisselogimise leht
- `screenshots/checklist-overview.png` - Checklistide nimekiri
- `screenshots/checklist-detail.png` - Üks checklist detailvaates

## Järgmised käivitamised

Kui oled juba korra sisse loginud, siis järgmistel kordadel:
```bash
npx playwright test --project=chromium
```

See kasutab salvestatud sessiooni ja teeb ekraanipildid ilma uuesti sisselogimata.

## Kui sessoon aegub

Kui sessoon on aegunud, kustuta vanaga fail ja logi uuesti sisse:
```bash
rm .auth/user.json
npx playwright test
```
