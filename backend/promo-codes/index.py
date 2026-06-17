import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def check_auth(event):
    return (event.get('headers') or {}).get('X-Admin-Token', '') == os.environ.get('ADMIN_TOKEN', '')


def handler(event: dict, context) -> dict:
    """
    API промокодов.
    POST /apply          — проверить промокод (публично), тело: {code}
    GET /?admin=1        — список всех кодов (требует токен)
    POST / (admin)       — создать промокод
    PUT /?id=N           — обновить промокод
    DELETE /?id=N        — удалить промокод
    """
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    params = event.get('queryStringParameters') or {}
    path = (event.get('path') or '/').rstrip('/')
    conn = get_conn()
    cur = conn.cursor()
    keys = ['id', 'code', 'discount', 'description', 'active', 'uses_count', 'max_uses']

    # Public: apply promo code
    if method == 'POST' and params.get('action') == 'apply':
        data = json.loads(event.get('body') or '{}')
        code = (data.get('code') or '').strip().upper()
        cur.execute(
            "SELECT discount, max_uses, uses_count FROM promo_codes WHERE code=%s AND active=true",
            (code,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 404, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Промокод не найден или неактивен'})}
        discount, max_uses, uses_count = row
        if max_uses and uses_count >= max_uses:
            conn.close()
            return {'statusCode': 410, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Промокод исчерпан'})}
        # increment uses
        cur.execute("UPDATE promo_codes SET uses_count = uses_count + 1 WHERE code=%s", (code,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'discount': discount})}

    # Admin-only endpoints
    if not check_auth(event):
        conn.close()
        return {'statusCode': 401, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Unauthorized'})}

    if method == 'GET':
        cur.execute("SELECT id,code,discount,description,active,uses_count,max_uses FROM promo_codes ORDER BY id")
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps([dict(zip(keys, r)) for r in rows], ensure_ascii=False)}

    if method == 'POST':
        data = json.loads(event.get('body') or '{}')
        code = (data.get('code') or '').strip().upper()
        if not code:
            conn.close()
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'code обязателен'})}
        discount = int(data.get('discount') or 0)
        if not (1 <= discount <= 100):
            conn.close()
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'discount должен быть от 1 до 100'})}
        max_uses = data.get('max_uses')
        max_uses = int(max_uses) if max_uses else None
        cur.execute(
            "INSERT INTO promo_codes (code,discount,description,active,max_uses) VALUES (%s,%s,%s,%s,%s) RETURNING id",
            (code, discount, data.get('description', ''), data.get('active', True), max_uses)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'id': new_id})}

    pid = params.get('id')
    if not pid:
        conn.close()
        return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'id required'})}

    if method == 'PUT':
        data = json.loads(event.get('body') or '{}')
        code = (data.get('code') or '').strip().upper()
        discount = int(data.get('discount') or 0)
        max_uses = data.get('max_uses')
        max_uses = int(max_uses) if max_uses else None
        cur.execute(
            "UPDATE promo_codes SET code=%s,discount=%s,description=%s,active=%s,max_uses=%s WHERE id=%s",
            (code, discount, data.get('description', ''), data.get('active', True), max_uses, pid)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True})}

    if method == 'DELETE':
        cur.execute("DELETE FROM promo_codes WHERE id=%s", (pid,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True})}

    conn.close()
    return {'statusCode': 405, 'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})}