# Uwaga dotycząca kopiowania do schowka między sesjami VNC

## Dlaczego kopiowanie między sesjami VNC nie jest zaimplementowane?

### 1. Ograniczenia bezpieczeństwa przeglądarki

Przeglądarki internetowe mają bardzo restrykcyjne zasady bezpieczeństwa dotyczące dostępu do schowka systemowego:

- **Same-Origin Policy** - Przeglądarki blokują dostęp do schowka między różnymi domenami/originami
- **User Interaction Required** - Większość API schowka wymaga bezpośredniej interakcji użytkownika (np. kliknięcie)
- **Cross-origin restrictions** - Nie można programowo kopiować zawartości z jednego iframe do drugiego

### 2. Ograniczenia protokołu VNC i noVNC

- **noVNC** - Biblioteka noVNC ma ograniczone wsparcie dla schowka (clipboard)
- **Wymagana konfiguracja serwera** - Serwer VNC musi mieć włączoną obsługę clipboard
- **Jednokierunkowość** - Większość implementacji obsługuje clipboard tylko w jedną stronę (z serwera do przeglądarki lub odwrotnie)

### 3. Co byłoby potrzebne do implementacji?

Aby zaimplementować kopiowanie między sesjami VNC, potrzebne byłoby:

1. **Backend Proxy** - Serwer pośredniczący do obsługi schowka
2. **API Clipboard przeglądarki** - Wymaga interakcji użytkownika (kliknięcie przycisku)
3. **Specjalna konfiguracja serwera VNC** - Włączona obsługa clipboard
4. **WebSocket Extension** - Rozszerzenie protokołu WebSocket do przesyłania danych schowka

### 4. Alternatywne rozwiązania

Jeśli potrzebujesz kopiowania między sesjami VNC, możesz:

1. **Użyć API Clipboard przeglądarki** - Wymaga kliknięcia przycisku przez użytkownika
2. **Użyć zewnętrznego narzędzia** - Skopiować zawartość ręcznie między sesjami
3. **Użyć rozwiązania z serwerem proxy** - Zaimplementować backend proxy do obsługi schowka

### 5. Podsumowanie

Funkcjonalność kopiowania między sesjami VNC została pominięta w tej wersji ze względu na:
- Złożoność implementacji
- Ograniczenia bezpieczeństwa przeglądarki
- Wymagania dotyczące konfiguracji serwera VNC
- Potencjalne problemy z bezpieczeństwem

Jeśli ta funkcjonalność jest krytyczna dla Twojego przypadku użycia, możesz rozważyć:
- Dodanie przycisku "Kopiuj do schowka" wymagającego interakcji użytkownika
- Implementację backend proxy do obsługi schowka
- Użycie alternatywnych rozwiązań (np. RDP z lepszym wsparciem dla clipboard)

