import json
import os
import urllib.request
import urllib.parse
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def send_telegram(token, chat_id, text):
    """Отправить сообщение в Telegram. Возвращает (ok, error_text)."""
    tg_url = f'https://api.telegram.org/bot{token}/sendMessage'
    payload = json.dumps({'chat_id': chat_id, 'text': text}).encode('utf-8')
    req = urllib.request.Request(tg_url, data=payload, method='POST',
                                 headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read())
            return result.get('ok', False), None
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        try:
            err = json.loads(body).get('description', body)
        except Exception:
            err = body
        return False, err
    except Exception as e:
        return False, str(e)


def handler(event: dict, context) -> dict:
    '''
    Принимает заявку, сохраняет в БД и отправляет в Telegram.
    POST /              — новая заявка (name, contact, message, source)
    GET  /?action=status — проверить подключение бота
    POST /?action=test   — отправить тестовое сообщение (admin)
    '''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
        'Access-Control-Max-Age': '86400',
    }

    def ok(data):
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}

    def err(msg, code=400):
        return {'statusCode': code, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    def check_admin():
        token = (event.get('headers') or {}).get('X-Admin-Token', '')
        return token == os.environ.get('ADMIN_TOKEN', '')

    # --- Статус бота ---
    if method == 'GET' and action == 'status':
        if not check_admin():
            return err('Unauthorized', 401)
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
        connected = bool(bot_token and chat_id)
        bot_name = None
        if connected:
            try:
                req = urllib.request.Request(
                    f'https://api.telegram.org/bot{bot_token}/getMe',
                    method='GET'
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = json.loads(resp.read())
                    if data.get('ok'):
                        bot_name = data['result'].get('username')
            except Exception:
                pass
        return ok({
            'connected': connected,
            'bot_name': bot_name,
            'has_token': bool(bot_token),
            'has_chat_id': bool(chat_id),
        })

    # --- Тестовое сообщение ---
    if method == 'POST' and action == 'test':
        if not check_admin():
            return err('Unauthorized', 401)
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        chat_id = os.environ.get('TELEGRAM_CHAT_ID')
        if not bot_token or not chat_id:
            return err('Бот не настроен — добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в секреты')
        success, error = send_telegram(bot_token, chat_id,
            '✅ Тест подключения AquaScale\n\nБот работает! Заявки с сайта будут приходить сюда.')
        if success:
            return ok({'success': True})
        return err(f'Ошибка отправки: {error}')

    # --- Обычная заявка ---
    if method != 'POST' or action:
        return err('Method not allowed', 405)

    data = json.loads(event.get('body') or '{}')
    name = (data.get('name') or '').strip()
    contact = (data.get('contact') or '').strip()
    message = (data.get('message') or '').strip()
    source = (data.get('source') or 'form').strip()

    if not name or not contact:
        return err('Заполните имя и контакт')

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO leads (name, contact, message, source) VALUES (%s,%s,%s,%s)", (name, contact, message, source))
    conn.commit()
    conn.close()

    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    if bot_token and chat_id:
        emoji = '🛒' if source == 'cart' else '🐠'
        source_label = {'cart': 'Корзина', 'form': 'Форма контактов'}.get(source, source)
        text = (
            f"{emoji} Новая заявка — {source_label}\n\n"
            f"👤 Имя: {name}\n"
            f"📞 Контакт: {contact}\n"
            f"💬 Сообщение: {message or '—'}"
        )
        send_telegram(bot_token, chat_id, text)

    return ok({'success': True})