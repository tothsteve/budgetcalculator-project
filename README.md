# Budget Calculator

Egy költségkezelő alkalmazás Django REST API backend-del és React frontend-del.

## Funkcionalitás

- ✅ Költések rögzítése és listázása
- ✅ Havi összesítések típusonként
- ✅ Költési limitek kezelése
- ✅ Limit túllépés jelzés
- ✅ Reszponzív design (mobil/desktop)
- ✅ SQL Server sequencia támogatás
- ✅ Swagger API dokumentáció

## Technológiák

**Backend:**
- Django 4.2.7
- Django REST Framework
- SQL Server / SQLite
- Swagger (drf-yasg)

**Frontend:**
- React 18
- Modern CSS
- Fetch API

## Gyors telepítés

### Előfeltételek
- Python 3.8+
- Node.js 16+
- SQL Server (opcionális, SQLite is működik)

### 1. Repository klónozása
```bash
gh repo clone tothsteve/budgetcalculator-project
cd budgetcalculator-project
```

### 2. Backend telepítése
```bash
cd backend
virtualenv venv --python=python3.11
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend telepítése
```bash
cd budgetcalculator-frontend
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install @mui/x-data-grid
npm install date-fns
npm start
```

### 3B. Alkalmazás indítása
Backend:

cd /Users/dorituran/Documents/budgetcalculator-project/backend

source venv/bin/activate 
cd budgetcalculator 

python manage.py runserver


Frontend:

cd /Users/dorituran/Documents/budgetcalculator-project/frontend/budgetcalculator-frontend

npm start
---------
Kilépés Control+C

### 4. Alkalmazás elérése
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Swagger dokumentáció:** http://localhost:8000/swagger/

## Részletes telepítési útmutató

Lásd: [docs/installation-guide.md](docs/installation-guide.md)

## API dokumentáció

Lásd: [docs/api-documentation.md](docs/api-documentation.md)

## Fejlesztői információk

### Backend
```bash
cd backend
python manage.py createsuperuser  # Admin felhasználó
python manage.py test            # Tesztek futtatása
```

### Frontend
```bash
cd frontend
npm run build    # Production build
npm test         # Tesztek futtatása
```

## Környezeti változók

Hozz létre egy `.env` fájlt a backend mappában:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
# SQL Server esetén:
# DATABASE_URL=mssql://user:password@server/database
```

## Licenc

MIT License

## Támogatás

Ha problémád van, ellenőrizd:
1. Python és Node.js verziók
2. Függőségek telepítése
3. Adatbázis kapcsolat
4. Port konfliktusok (8000, 3000)

---

**Készítette:** [Név]  
**Verzió:** 1.0.0  
**Utolsó frissítés:** 2025-07-10