# AI Chatbot — Django + Colab / Kaggle

Проект с Django-интерфейсом и тремя LoRA-адаптерами: бизнес, юрист и психолог. Можно включать один адаптер или несколько одновременно, а сервер модели запускается отдельно в `colab_server.ipynb`.

## Что улучшено в этой версии

- сохранён твой динамический hybrid для нескольких адаптеров
- убран `csrf_exempt` с POST-эндпоинтов Django
- фронтенд отправляет CSRF-токен автоматически
- расход токенов считается по данным токенайзера на стороне model server
- добавлена очистка ответа модели перед сохранением и выводом
- хардкод токенов убран: секреты читаются из Kaggle Secrets, Colab Secrets, `.env` или системных переменных
- `requirements.txt` теперь только для Django-приложения, без notebook-зависимостей

## Репозиторий

```bash
git clone https://github.com/Zhuzhik365/chat_bot_3adapters_dynamic_hybrid
cd chat_bot_3adapters_dynamic_hybrid
```

## 1. Установка Django-приложения

### Windows

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

## 2. Настройка `.env`

Пример:

```env
DJANGO_SECRET_KEY=replace-with-your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CSRF_TRUSTED_ORIGINS=
MODEL_API_URL=https://your-ngrok-url/generate
MODEL_API_TOKEN=
NGROK_AUTH_TOKEN=
HUGGINGFACE_TOKEN=
GITHUB_REPO_URL=https://github.com/Zhuzhik365/chat_bot_3adapters_dynamic_hybrid
```

Главное:
- `MODEL_API_URL` или `COLAB_API_URL` — адрес model server c `/generate`
- `MODEL_API_TOKEN` — необязательный общий секрет между Django и notebook
- `DJANGO_SECRET_KEY` — секрет Django
- `DJANGO_CSRF_TRUSTED_ORIGINS` — нужен, если фронт будет идти через другой домен

Сгенерировать Django secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 3. Запуск `colab_server.ipynb`

Notebook сам ставит **свои** зависимости и не использует `requirements.txt`. Это специально, чтобы зависимости Django и ноутбука не мешали друг другу на macOS / Linux / Windows.

Что нужно сделать:
1. открыть `colab_server.ipynb`
2. включить GPU
3. задать секреты одним из способов:
   - Kaggle Secrets
   - Colab Secrets
   - `.env`
   - системные переменные окружения
4. запустить все ячейки
5. взять ngrok URL и вставить его в `.env` как `MODEL_API_URL`

Поддерживаемые секреты:
- `NGROK_AUTH_TOKEN` или `NGROK_TOKEN`
- `HUGGINGFACE_TOKEN`
- `MODEL_API_TOKEN`
- `GITHUB_REPO_URL`

## 4. Защита POST-запросов

В этой версии:
- POST-запросы к Django больше не `csrf_exempt`
- фронтенд использует CSRF-cookie Django
- model server может дополнительно проверять `MODEL_API_TOKEN`, если ты его задашь

## 5. Подсчёт токенов

Django теперь берёт `total_tokens`, `prompt_tokens` и `response_tokens` из ответа notebook. Если notebook их не вернул, используется мягкий fallback-расчёт.

## 6. Структура проекта

```text
chat/
chatbot_project/
colab_server.ipynb
requirements.txt
.env.example
README.md
```
