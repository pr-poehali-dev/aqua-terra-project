import json
import os
import urllib.request
import urllib.parse
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    '''
    Принимает заявку, сохраняет в БД и отправляет в Telegram.
    POST / — новая заявка (name, contact, message, source)
    '''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Method not allowed'})}

    data = json.loads(event.get('body') or '{}')
    name = (data.get('name') or '').strip()
    contact = (data.get('contact') or '').strip()
    message = (data.get('message') or '').strip()
    source = (data.get('source') or 'form').strip()

    if not name or not contact:
        return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Заполните имя и контакт'})}

    # Сохраняем в БД
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO leads (name, contact, message, source) VALUES (%s,%s,%s,%s)", (name, contact, message, source))
    conn.commit()
    conn.close()

    # Telegram
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    if token and chat_id:
        emoji = '🛒' if source == 'cart' else '🐠'
        source_label = {'cart': 'Корзина', 'form': 'Форма контактов'}.get(source, source)
        text = (
            f"{emoji} Новая заявка — {source_label}\n\n"
            f"👤 Имя: {name}\n"
            f"📞 Контакт: {contact}\n"
            f"💬 Сообщение: {message or '—'}"
        )
        tg_url = f'https://api.telegram.org/bot{token}/sendMessage'
        payload = json.dumps({'chat_id': chat_id, 'text': text}).encode('utf-8')
        req = urllib.request.Request(tg_url, data=payload, method='POST',
                                     headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                resp.read()
        except Exception:
            pass

    return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}