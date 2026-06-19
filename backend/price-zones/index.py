"""
Ценовые зоны: 3 кольца с глобальными радиусами.
GET  / — получить (публичный)
POST / — сохранить (admin)

Структура work_points: [{lat, lon, address}]
Глобальные r1_km, r2_km, r3_km, factor и label для каждого кольца.
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
    """3 ценовых кольца (зелёный/жёлтый/красный) с гибкими радиусами на точку"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            cur.execute(f"""
                SELECT ring1_factor, ring1_label,
                       ring2_factor, ring2_label,
                       ring3_factor, ring3_label,
                       work_points, active,
                       r1_km, r2_km, r3_km
                FROM {SCHEMA}.price_zones ORDER BY id LIMIT 1
            """)
            row = cur.fetchone()
            if not row:
                return ok(None)
            return ok({
                'ring1_factor': row[0], 'ring1_label': row[1],
                'ring2_factor': row[2], 'ring2_label': row[3],
                'ring3_factor': row[4], 'ring3_label': row[5],
                'points': row[6] or [],
                'active': row[7],
                'r1_km': float(row[8] or 10),
                'r2_km': float(row[9] or 25),
                'r3_km': float(row[10] or 50),
            })

        if not check_admin(event):
            return err('Unauthorized', 401)

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            cur.execute(f"SELECT id FROM {SCHEMA}.price_zones ORDER BY id LIMIT 1")
            row = cur.fetchone()

            vals = (
                body.get('ring1_factor', 1.0), body.get('ring1_label', 'Рядом'),
                body.get('ring2_factor', 1.5), body.get('ring2_label', 'Недалеко'),
                body.get('ring3_factor', 2.0), body.get('ring3_label', 'Далеко'),
                json.dumps(body.get('points', []), ensure_ascii=False),
                body.get('active', True),
                body.get('r1_km', 10), body.get('r2_km', 25), body.get('r3_km', 50),
            )

            if row:
                cur.execute(f"""
                    UPDATE {SCHEMA}.price_zones SET
                      ring1_factor=%s, ring1_label=%s,
                      ring2_factor=%s, ring2_label=%s,
                      ring3_factor=%s, ring3_label=%s,
                      work_points=%s::jsonb, active=%s,
                      r1_km=%s, r2_km=%s, r3_km=%s,
                      updated_at=NOW()
                    WHERE id=%s
                """, (*vals, row[0]))
            else:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.price_zones
                      (ring1_factor, ring1_label, ring2_factor, ring2_label,
                       ring3_factor, ring3_label, work_points, active,
                       r1_km, r2_km, r3_km)
                    VALUES (%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s)
                """, vals)

            conn.commit()
            return ok({'success': True})

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()