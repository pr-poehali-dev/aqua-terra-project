"""
Локации клиентов для карты зон.
GET    / — список всех (публичный, только lat/lon/radius)
GET    /?admin=1 — полный список с адресами (admin)
POST   / — добавить (admin)
PUT    /?id=N — обновить радиус (admin)
DELETE /?id=N — удалить (admin)
"""
import json, os, psycopg2

SCHEMA = 't_p51549197_aqua_terra_project'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': msg}, ensure_ascii=False)}

def check_admin(event):
    token = (event.get('headers') or {}).get('X-Admin-Token', '')
    return token == os.environ.get('ADMIN_TOKEN', '')

def handler(event: dict, context) -> dict:
    """CRUD локаций клиентов для отображения на карте"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            is_admin = params.get('admin') == '1' and check_admin(event)
            if is_admin:
                cur.execute(f"SELECT id, address, lat, lon, radius_km, active FROM {SCHEMA}.client_locations ORDER BY created_at")
                rows = [{'id': r[0], 'address': r[1], 'lat': r[2], 'lon': r[3], 'radius_km': r[4], 'active': r[5]} for r in cur.fetchall()]
            else:
                cur.execute(f"SELECT lat, lon, radius_km FROM {SCHEMA}.client_locations WHERE active = TRUE")
                rows = [{'lat': r[0], 'lon': r[1], 'radius_km': r[2]} for r in cur.fetchall()]
            return ok(rows)

        if not check_admin(event):
            return err('Unauthorized', 401)

        body = json.loads(event.get('body') or '{}')

        if method == 'POST':
            cur.execute(f"""
                INSERT INTO {SCHEMA}.client_locations (address, lat, lon, radius_km, active)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (body['address'], body['lat'], body['lon'], body.get('radius_km', 5), body.get('active', True)))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id, 'success': True})

        loc_id = params.get('id')
        if not loc_id:
            return err('id required')

        if method == 'PUT':
            cur.execute(f"""
                UPDATE {SCHEMA}.client_locations
                SET address=%s, lat=%s, lon=%s, radius_km=%s, active=%s
                WHERE id=%s
            """, (body['address'], body['lat'], body['lon'], body.get('radius_km', 5), body.get('active', True), loc_id))
            conn.commit()
            return ok({'success': True})

        if method == 'DELETE':
            cur.execute(f"DELETE FROM {SCHEMA}.client_locations WHERE id=%s", (loc_id,))
            conn.commit()
            return ok({'success': True})

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()
