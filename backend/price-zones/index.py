"""
Ценовые зоны по радиусу от точек.
GET  / — получить настройки (публичный)
POST / — сохранить настройки (admin)
"""
import json, os, psycopg2

SCHEMA = 't_p51549197_aqua_terra_project'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    """Настройки ценовых зон — несколько точек на зону с радиусами"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            cur.execute(f"""
                SELECT center_lat, center_lon,
                       zone1_radius, zone1_factor, zone1_label, zone1_points,
                       zone2_radius, zone2_factor, zone2_label, zone2_points,
                       zone3_radius, zone3_factor, zone3_label, zone3_points,
                       zone4_radius, zone4_factor, zone4_label, zone4_points,
                       active
                FROM {SCHEMA}.price_zones ORDER BY id LIMIT 1
            """)
            row = cur.fetchone()
            if not row:
                return ok(None)
            return ok({
                'center_lat': row[0], 'center_lon': row[1],
                'zones': [
                    {'radius': row[2],  'factor': row[3],  'label': row[4],  'points': row[5]  or []},
                    {'radius': row[6],  'factor': row[7],  'label': row[8],  'points': row[9]  or []},
                    {'radius': row[10], 'factor': row[11], 'label': row[12], 'points': row[13] or []},
                    {'radius': row[14], 'factor': row[15], 'label': row[16], 'points': row[17] or []},
                ],
                'active': row[18],
            })

        if not check_admin(event):
            return err('Unauthorized', 401)

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            zones = body.get('zones', [])
            if len(zones) < 4:
                return err('Need 4 zones')

            cur.execute(f"SELECT id FROM {SCHEMA}.price_zones ORDER BY id LIMIT 1")
            row = cur.fetchone()

            vals = (
                body.get('center_lat', 55.7328),
                body.get('center_lon', 36.8517),
                zones[0].get('radius', 20),  zones[0].get('factor', 1.0), zones[0].get('label', 'Основная зона'), json.dumps(zones[0].get('points', []), ensure_ascii=False),
                zones[1].get('radius', 35),  zones[1].get('factor', 1.3), zones[1].get('label', 'Ближняя зона'),  json.dumps(zones[1].get('points', []), ensure_ascii=False),
                zones[2].get('radius', 55),  zones[2].get('factor', 1.6), zones[2].get('label', 'Средняя зона'),  json.dumps(zones[2].get('points', []), ensure_ascii=False),
                zones[3].get('radius', 80),  zones[3].get('factor', 2.0), zones[3].get('label', 'Дальняя зона'),  json.dumps(zones[3].get('points', []), ensure_ascii=False),
                body.get('active', True),
            )

            if row:
                cur.execute(f"""
                    UPDATE {SCHEMA}.price_zones SET
                      center_lat=%s, center_lon=%s,
                      zone1_radius=%s, zone1_factor=%s, zone1_label=%s, zone1_points=%s::jsonb,
                      zone2_radius=%s, zone2_factor=%s, zone2_label=%s, zone2_points=%s::jsonb,
                      zone3_radius=%s, zone3_factor=%s, zone3_label=%s, zone3_points=%s::jsonb,
                      zone4_radius=%s, zone4_factor=%s, zone4_label=%s, zone4_points=%s::jsonb,
                      active=%s, updated_at=NOW()
                    WHERE id=%s
                """, (*vals, row[0]))
            else:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.price_zones
                      (center_lat, center_lon,
                       zone1_radius, zone1_factor, zone1_label, zone1_points,
                       zone2_radius, zone2_factor, zone2_label, zone2_points,
                       zone3_radius, zone3_factor, zone3_label, zone3_points,
                       zone4_radius, zone4_factor, zone4_label, zone4_points, active)
                    VALUES (%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s::jsonb,%s,%s,%s,%s::jsonb,%s,%s,%s,%s::jsonb,%s)
                """, vals)

            conn.commit()
            return ok({'success': True})

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()
