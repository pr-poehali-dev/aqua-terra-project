"""
Зоны обслуживания для карты.
GET  /           — список активных зон (публичный)
GET  /?admin=1   — все зоны (admin)
POST /           — создать зону (admin)
PUT  /?id=N      — обновить зону (admin)
DELETE /?id=N    — удалить зону (admin)
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

def row_to_dict(row):
    return {
        'id': row[0], 'name': row[1], 'color': row[2], 'opacity': row[3],
        'zone_type': row[4], 'coordinates': row[5] or [],
        'center_lat': row[6], 'center_lon': row[7], 'radius_km': row[8],
        'sort_order': row[9], 'active': row[10],
    }

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try: body = json.loads(event['body'])
        except Exception: pass

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            is_admin = params.get('admin') == '1' and check_admin(event)
            where = '' if is_admin else 'WHERE active = TRUE'
            cur.execute(f"""
                SELECT id, name, color, opacity, zone_type, coordinates,
                       center_lat, center_lon, radius_km, sort_order, active
                FROM {SCHEMA}.service_zones {where}
                ORDER BY sort_order, id
            """)
            zones = [row_to_dict(r) for r in cur.fetchall()]
            return ok(zones)

        if not check_admin(event):
            return err('Unauthorized', 401)

        if method == 'POST':
            cur.execute(f"""
                INSERT INTO {SCHEMA}.service_zones
                  (name, color, opacity, zone_type, coordinates, center_lat, center_lon, radius_km, sort_order, active)
                VALUES (%s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s, %s) RETURNING id
            """, (
                body.get('name', 'Новая зона'),
                body.get('color', '#22c55e'),
                body.get('opacity', 0.3),
                body.get('zone_type', 'circle'),
                json.dumps(body.get('coordinates', [])),
                body.get('center_lat'), body.get('center_lon'), body.get('radius_km'),
                body.get('sort_order', 99), body.get('active', True)
            ))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id, 'success': True})

        zone_id = params.get('id')
        if not zone_id:
            return err('id required')

        if method == 'PUT':
            cur.execute(f"""
                UPDATE {SCHEMA}.service_zones
                SET name=%s, color=%s, opacity=%s, zone_type=%s, coordinates=%s::jsonb,
                    center_lat=%s, center_lon=%s, radius_km=%s, sort_order=%s, active=%s
                WHERE id=%s
            """, (
                body.get('name'), body.get('color', '#22c55e'),
                body.get('opacity', 0.3), body.get('zone_type', 'circle'),
                json.dumps(body.get('coordinates', [])),
                body.get('center_lat'), body.get('center_lon'), body.get('radius_km'),
                body.get('sort_order', 0), body.get('active', True), zone_id
            ))
            conn.commit()
            return ok({'success': True})

        if method == 'DELETE':
            cur.execute(f"DELETE FROM {SCHEMA}.service_zones WHERE id=%s", (zone_id,))
            conn.commit()
            return ok({'success': True})

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()
