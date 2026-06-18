"""
Ценовые зоны: единые радиусы 4 колец + рабочие точки.
GET  / — получить (публичный)
POST / — сохранить (admin)
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
    """Рабочие точки + единые радиусы 4 ценовых колец"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            cur.execute(f"""
                SELECT ring1_km, ring1_factor, ring1_label,
                       ring2_km, ring2_factor, ring2_label,
                       ring3_km, ring3_factor, ring3_label,
                       ring4_km, ring4_factor, ring4_label,
                       work_points, active
                FROM {SCHEMA}.price_zones ORDER BY id LIMIT 1
            """)
            row = cur.fetchone()
            if not row:
                return ok(None)
            return ok({
                'ring1_km': row[0],  'ring1_factor': row[1],  'ring1_label': row[2],
                'ring2_km': row[3],  'ring2_factor': row[4],  'ring2_label': row[5],
                'ring3_km': row[6],  'ring3_factor': row[7],  'ring3_label': row[8],
                'ring4_km': row[9],  'ring4_factor': row[10], 'ring4_label': row[11],
                'points': row[12] or [],
                'active': row[13],
            })

        if not check_admin(event):
            return err('Unauthorized', 401)

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            cur.execute(f"SELECT id FROM {SCHEMA}.price_zones ORDER BY id LIMIT 1")
            row = cur.fetchone()

            vals = (
                body.get('ring1_km', 10),  body.get('ring1_factor', 1.0), body.get('ring1_label', 'Рядом'),
                body.get('ring2_km', 25),  body.get('ring2_factor', 1.3), body.get('ring2_label', 'Недалеко'),
                body.get('ring3_km', 45),  body.get('ring3_factor', 1.6), body.get('ring3_label', 'Далеко'),
                body.get('ring4_km', 70),  body.get('ring4_factor', 2.0), body.get('ring4_label', 'Очень далеко'),
                json.dumps(body.get('points', []), ensure_ascii=False),
                body.get('active', True),
            )

            if row:
                cur.execute(f"""
                    UPDATE {SCHEMA}.price_zones SET
                      ring1_km=%s, ring1_factor=%s, ring1_label=%s,
                      ring2_km=%s, ring2_factor=%s, ring2_label=%s,
                      ring3_km=%s, ring3_factor=%s, ring3_label=%s,
                      ring4_km=%s, ring4_factor=%s, ring4_label=%s,
                      work_points=%s::jsonb, active=%s, updated_at=NOW()
                    WHERE id=%s
                """, (*vals, row[0]))
            else:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.price_zones
                      (ring1_km, ring1_factor, ring1_label,
                       ring2_km, ring2_factor, ring2_label,
                       ring3_km, ring3_factor, ring3_label,
                       ring4_km, ring4_factor, ring4_label,
                       work_points, active)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s)
                """, vals)

            conn.commit()
            return ok({'success': True})

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()
