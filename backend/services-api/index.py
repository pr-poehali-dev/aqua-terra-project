import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def row_to_dict(row, keys):
    d = dict(zip(keys, row))
    if isinstance(d.get('tags'), list):
        pass
    return d


def check_auth(event: dict) -> bool:
    token = (event.get('headers') or {}).get('X-Admin-Token', '')
    return token == os.environ.get('ADMIN_TOKEN', '')


def handler(event: dict, context) -> dict:
    """
    API услуг и цен.
    GET /          → публичный список активных услуг
    GET /?admin=1  → все услуги (требует X-Admin-Token)
    POST /         → создать услугу (требует X-Admin-Token)
    PUT /?id=N     → обновить услугу (требует X-Admin-Token)
    DELETE /?id=N  → удалить услугу (требует X-Admin-Token)
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
    conn = get_conn()
    cur = conn.cursor()
    keys = ['id', 'icon', 'title', 'description', 'price_from', 'price_unit', 'tags', 'sort_order', 'active']

    if method == 'GET':
        is_admin = params.get('admin') == '1' and check_auth(event)
        if is_admin:
            cur.execute("SELECT id, icon, title, description, price_from, price_unit, tags, sort_order, active FROM services ORDER BY sort_order")
        else:
            cur.execute("SELECT id, icon, title, description, price_from, price_unit, tags, sort_order, active FROM services WHERE active = true ORDER BY sort_order")
        rows = cur.fetchall()
        conn.close()
        services = [dict(zip(keys, row)) for row in rows]
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(services, ensure_ascii=False)}

    if not check_auth(event):
        conn.close()
        return {'statusCode': 401, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Unauthorized'})}

    if method == 'POST':
        data = json.loads(event.get('body') or '{}')
        tags = data.get('tags', [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(',') if t.strip()]
        cur.execute(
            "INSERT INTO services (icon, title, description, price_from, price_unit, tags, sort_order, active) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (data.get('icon', 'Wrench'), data.get('title', ''), data.get('description', ''),
             int(data.get('price_from', 0)), data.get('price_unit', 'за работу'),
             tags, int(data.get('sort_order', 99)), data.get('active', True))
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'id': new_id})}

    service_id = params.get('id')
    if not service_id:
        conn.close()
        return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'id required'})}

    if method == 'PUT':
        data = json.loads(event.get('body') or '{}')
        tags = data.get('tags', [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(',') if t.strip()]
        cur.execute(
            "UPDATE services SET icon=%s, title=%s, description=%s, price_from=%s, price_unit=%s, tags=%s, sort_order=%s, active=%s WHERE id=%s",
            (data.get('icon'), data.get('title'), data.get('description'),
             int(data.get('price_from', 0)), data.get('price_unit'),
             tags, int(data.get('sort_order', 99)), data.get('active', True), service_id)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    if method == 'DELETE':
        cur.execute("DELETE FROM services WHERE id=%s", (service_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    conn.close()
    return {'statusCode': 405, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Method not allowed'})}
