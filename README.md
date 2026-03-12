# AI Chatbot — Django + Google Colab

Веб-приложение на Django с AI-чатом и тремя LoRA-адаптерами: бизнес, юрист и психолог. Модель запускается в Google Colab или Kaggle и общается с Django через HTTP API.

## Что умеет проект

- регистрация и авторизация пользователей
- выбор одного или нескольких адаптеров одновременно
- динамический hybrid для комбинаций адаптеров
- история диалогов с удалением чатов
- дневные лимиты токенов для free/premium
- настройка секретов и ссылок через `.env`

## Репозиторий

```bash
git clone https://github.com/Zhuzhik365/chat_bot_3adapters_dynamic_hybrid
cd chat_bot_3adapters_dynamic_hybrid
```

## Быстрый запуск Django

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver
```

Для Linux / macOS:

```bash
source venv/bin/activate
cp .env.example .env
```

## Настройка `.env`

Пример:

```env
DJANGO_SECRET_KEY=replace-with-your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
COLAB_API_URL=https://your-ngrok-url/generate
NGROK_AUTH_TOKEN=your-ngrok-auth-token
```

Основное:
- `COLAB_API_URL` — URL твоего model server с `/generate`
- `NGROK_AUTH_TOKEN` — токен ngrok, который notebook умеет брать из Kaggle Secrets, Colab Secrets, `.env` или системных переменных
- `DJANGO_SECRET_KEY` — секретный ключ Django

## Запуск notebook

1. Открой `colab_server.ipynb` в Colab
2. Включи GPU
3. Запусти все ячейки
4. Возьми URL из вывода и вставь его в `.env` как `COLAB_API_URL`
5. Перезапусти Django, если ссылка изменилась

Notebook уже настроен под репозиторий:

```bash
https://github.com/Zhuzhik365/chat_bot_3adapters_dynamic_hybrid
```

## Структура

```text
chat/                          Django-приложение
chatbot_project/settings.py    настройки через .env
colab_server.ipynb             model server с 3 адаптерами
requirements.txt               зависимости проекта
.env.example                   шаблон env
```
