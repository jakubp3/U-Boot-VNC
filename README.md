# VNC Manager

Aplikacja do zarządzania połączeniami VNC z możliwością uruchomienia przez Docker Compose.

## Funkcjonalności

- 🔐 **Autentykacja użytkowników** - rejestracja i logowanie
- 👥 **Zarządzanie użytkownikami** - panel administratora do zarządzania kontami
- 🖥️ **Zarządzanie maszynami VNC** - dodawanie, edycja i usuwanie maszyn VNC
- 📑 **Widok główny i osobisty** - maszyny współdzielone przez administratora i własne maszyny użytkownika
- 🎨 **Mini podgląd** - próba wyświetlenia miniaturki maszyny VNC (jeśli wspierana)
- 🔖 **System kart** - możliwość otwierania wielu maszyn VNC w osobnych kartach
- ✏️ **Edycja nazw** - możliwość modyfikowania nazw maszyn
- 📋 **Kopiowanie do schowka** - funkcjonalność ograniczona przez bezpieczeństwo przeglądarki (patrz niżej)

## Uwaga dotycząca kopiowania do schowka

**Kopiowanie i wklejanie między sesjami VNC w przeglądarce jest ograniczone z powodów bezpieczeństwa:**

1. **Bezpieczeństwo przeglądarki** - przeglądarki blokują programowy dostęp do schowka systemowego między domenami/iframe'ami ze względów bezpieczeństwa (Same-Origin Policy)

2. **noVNC i Clipboard** - noVNC ma ograniczone wsparcie dla schowka. Wymaga to specjalnej konfiguracji serwera VNC i może działać tylko w jedną stronę (z serwera VNC do przeglądarki lub odwrotnie)

3. **Rozwiązanie** - Aby umożliwić kopiowanie/wklejanie między sesjami VNC, potrzebny byłby:
   - Backend proxy do obsługi schowka
   - Specjalna konfiguracja serwera VNC z włączonym wsparciem dla clipboard
   - Użycie API Clipboard przeglądarki (wymaga interakcji użytkownika)

Z tego powodu funkcjonalność kopiowania między sesjami VNC została pominięta w tej wersji.

## Wymagania

- Docker
- Docker Compose

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone <repo-url>
cd U-Boot-VNC
```

2. Uruchom aplikację za pomocą Docker Compose:
```bash
docker-compose up -d
```

3. Aplikacja będzie dostępna pod adresem:
   - Frontend: http://localhost:18889
   - Backend API: http://localhost:18888
   - API Docs: http://localhost:18888/docs

## Pierwszy użytkownik administratora

### Opcja 1: Przez interfejs (rekomendowane)
1. Zarejestruj się przez interfejs logowania
2. Ustaw użytkownika jako administratora w bazie danych:
```bash
docker-compose exec db psql -U vncmanager -d vnc_manager -c "UPDATE users SET is_admin = true WHERE username = 'twoja_nazwa_uzytkownika';"
```

### Opcja 2: Przez skrypt Python
```bash
docker-compose exec backend python init_admin.py admin admin@example.com haslo123 "Administrator"
```

## Konfiguracja

### Zmienne środowiskowe

W pliku `docker-compose.yml` możesz zmienić:

- `SECRET_KEY` - klucz sekretny dla aplikacji
- `JWT_SECRET_KEY` - klucz sekretny dla JWT
- `POSTGRES_USER` / `POSTGRES_PASSWORD` - dane dostępowe do bazy danych

**WAŻNE:** Przed użyciem w produkcji zmień wszystkie wartości domyślne!

## Struktura projektu

```
.
├── backend/          # Backend FastAPI
│   ├── main.py      # Główny plik aplikacji
│   ├── models.py    # Modele bazy danych
│   ├── schemas.py   # Schematy Pydantic
│   ├── auth.py      # Autentykacja i autoryzacja
│   ├── database.py  # Konfiguracja bazy danych
│   └── init_admin.py # Skrypt do tworzenia administratora
├── frontend/         # Frontend React
│   └── src/
│       ├── pages/    # Strony aplikacji
│       ├── components/ # Komponenty React
│       └── api/     # Klient API
└── docker-compose.yml # Konfiguracja Docker Compose
```

## Użycie

1. **Rejestracja/Logowanie** - Utwórz konto lub zaloguj się
2. **Dodawanie maszyn** - Kliknij "Dodaj maszynę" i wprowadź dane:
   - Nazwa maszyny
   - URL/IP (np. `ws://192.168.1.100:6080` lub URL noVNC)
   - Opis (opcjonalnie)
3. **Otwieranie maszyn** - Kliknij "Otwórz" na karcie maszyny
4. **Zarządzanie kartami** - Otwórz wiele maszyn w osobnych kartach
5. **Panel administratora** - Zarządzaj użytkownikami i maszynami współdzielonymi

## Format URL maszyny VNC

Aplikacja obsługuje:
- WebSocket URLs: `ws://host:port` lub `wss://host:port`
- noVNC URLs: `http://host:port/noVNC` lub `https://host:port/noVNC`
- Direct VNC URLs: `ws://host:5900` (standardowy port VNC)

## Uwagi techniczne

- Aplikacja używa noVNC do wyświetlania sesji VNC
- Mini podgląd jest eksperymentalny i może nie działać dla wszystkich serwerów VNC
- Wymagana jest obsługa WebSocket przez serwer VNC
- Wymagany jest serwer VNC z obsługą WebSocket (np. websockify)

## Rozwój

Aby uruchomić aplikację w trybie deweloperskim:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm start
```

## Rozwiązywanie problemów

### Problem z połączeniem VNC
- Upewnij się, że serwer VNC obsługuje WebSocket (użyj websockify)
- Sprawdź, czy URL jest poprawny (np. `ws://host:port`)
- Sprawdź logi przeglądarki (F12) w poszukiwaniu błędów

### Problem z bazą danych
- Sprawdź, czy kontener PostgreSQL działa: `docker-compose ps`
- Sprawdź logi: `docker-compose logs db`

## Licencja

MIT
