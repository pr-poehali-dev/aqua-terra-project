"""
API услуг и категорий.
GET  /              → публичный список услуг (с категориями)
GET  /?admin=1      → все услуги (X-Admin-Token)
POST /              → создать услугу
PUT  /?id=N         → обновить услугу
DELETE /?id=N       → удалить услугу

GET  /?resource=categories          → список категорий (публичный)
POST /?resource=categories          → создать категорию
PUT  /?resource=categories&id=N     → обновить категорию
"""
import json, os
import psycopg2

SCHEMA = 't_p51549197_aqua_terra_project'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': msg})}

def check_auth(event):
    token = (event.get('headers') or {}).get('X-Admin-Token', '')
    return token == os.environ.get('ADMIN_TOKEN', '')

def handler(event: dict, context) -> dict:
    """API услуг с категориями для аквасервиса"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    resource = params.get('resource', '')
    conn = get_conn()
    cur = conn.cursor()

    # ── КАТЕГОРИИ ──────────────────────────────────────────────────────────
    if resource == 'categories':
        if method == 'GET':
            cur.execute(f"""
                SELECT id, name, slug, icon, sort_order, active
                FROM {SCHEMA}.service_categories
                ORDER BY sort_order
            """)
            rows = cur.fetchall()
            conn.close()
            cats = [{'id': r[0], 'name': r[1], 'slug': r[2], 'icon': r[3],
                     'sort_order': r[4], 'active': r[5]} for r in rows]
            return ok(cats)

        if not check_auth(event):
            conn.close(); return err('Unauthorized', 401)

        body = json.loads(event.get('body') or '{}')

        if method == 'POST':
            cur.execute(f"""
                INSERT INTO {SCHEMA}.service_categories (name, slug, icon, sort_order, active)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (body.get('name', ''), body.get('slug', ''), body.get('icon', 'Layers'),
                  int(body.get('sort_order', 99)), body.get('active', True)))
            new_id = cur.fetchone()[0]
            conn.commit(); conn.close()
            return ok({'id': new_id}, 201)

        if method == 'PUT':
            cat_id = params.get('id')
            if not cat_id:
                conn.close(); return err('id required')
            cur.execute(f"""
                UPDATE {SCHEMA}.service_categories
                SET name=%s, slug=%s, icon=%s, sort_order=%s, active=%s
                WHERE id=%s
            """, (body.get('name'), body.get('slug'), body.get('icon'),
                  int(body.get('sort_order', 99)), body.get('active', True), cat_id))
            conn.commit(); conn.close()
            return ok({'success': True})

        conn.close(); return err('Method not allowed', 405)

    # ── УСЛУГИ ─────────────────────────────────────────────────────────────
    KEYS = ['id', 'icon', 'title', 'description', 'price_from', 'price_unit',
            'tags', 'sort_order', 'active', 'category_id', 'category_name', 'category_slug', 'category_icon']

    if method == 'GET':
        is_admin = params.get('admin') == '1' and check_auth(event)
        where = '' if is_admin else 'WHERE s.active = true'
        cur.execute(f"""
            SELECT s.id, s.icon, s.title, s.description, s.price_from, s.price_unit,
                   s.tags, s.sort_order, s.active, s.category_id,
                   c.name, c.slug, c.icon
            FROM {SCHEMA}.services s
            LEFT JOIN {SCHEMA}.service_categories c ON c.id = s.category_id
            {where}
            ORDER BY c.sort_order NULLS LAST, s.sort_order
        """)
        rows = cur.fetchall()
        conn.close()
        services = []
        for row in rows:
            d = dict(zip(KEYS, row))
            d['category'] = {'id': d.pop('category_id'), 'name': d.pop('category_name'),
                             'slug': d.pop('category_slug'), 'icon': d.pop('category_icon')} \
                            if d.get('category_id') else None
            d.pop('category_id', None)
            services.append(d)
        return ok(services)

    if not check_auth(event):
        conn.close(); return err('Unauthorized', 401)

    body = json.loads(event.get('body') or '{}')

    def parse_tags(v):
        if isinstance(v, list): return v
        if isinstance(v, str): return [t.strip() for t in v.split(',') if t.strip()]
        return []

    if method == 'POST':
        cur.execute(f"""
            INSERT INTO {SCHEMA}.services
              (icon, title, description, price_from, price_unit, tags, sort_order, active, category_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (body.get('icon', 'Wrench'), body.get('title', ''), body.get('description', ''),
              int(body.get('price_from', 0)), body.get('price_unit', 'за работу'),
              parse_tags(body.get('tags', [])), int(body.get('sort_order', 99)),
              body.get('active', True), body.get('category_id') or None))
        new_id = cur.fetchone()[0]
        conn.commit(); conn.close()
        return ok({'id': new_id}, 201)

    svc_id = params.get('id')
    if not svc_id:
        conn.close(); return err('id required')

    if method == 'PUT':
        cur.execute(f"""
            UPDATE {SCHEMA}.services
            SET icon=%s, title=%s, description=%s, price_from=%s, price_unit=%s,
                tags=%s, sort_order=%s, active=%s, category_id=%s
            WHERE id=%s
        """, (body.get('icon'), body.get('title'), body.get('description'),
              int(body.get('price_from', 0)), body.get('price_unit'),
              parse_tags(body.get('tags', [])), int(body.get('sort_order', 99)),
              body.get('active', True), body.get('category_id') or None, svc_id))
        conn.commit(); conn.close()
        return ok({'success': True})

    if method == 'DELETE':
        cur.execute(f"UPDATE {SCHEMA}.services SET active=false WHERE id=%s", (svc_id,))
        conn.commit(); conn.close()
        return ok({'success': True})

    conn.close()
    return err('Method not allowed', 405)
