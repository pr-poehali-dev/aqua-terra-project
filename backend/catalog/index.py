"""
Catalog API — разделы, категории, товары магазина.
GET  /          — список разделов с категориями
GET  /?section=slug  — товары раздела (опц. &category=slug, &search=)
POST /          — создать раздел (admin)
PUT  /          — обновить раздел/категорию (admin)
POST /?action=add_product    — добавить товар
POST /?action=add_category   — добавить категорию
POST /?action=toggle_section — вкл/выкл раздел
POST /?action=order_form     — заявка на заказ
"""
import json, os, psycopg2

SCHEMA = 't_p51549197_aqua_terra_project'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET — разделы + категории
        if method == 'GET' and 'section' not in params:
            cur.execute(f"""
                SELECT s.id, s.slug, s.title, s.description, s.icon, s.sort_order, s.active, s.has_order_form,
                       json_agg(json_build_object(
                           'id', c.id, 'slug', c.slug, 'title', c.title,
                           'icon', c.icon, 'sort_order', c.sort_order, 'active', c.active
                       ) ORDER BY c.sort_order) FILTER (WHERE c.id IS NOT NULL) as categories
                FROM {SCHEMA}.shop_sections s
                LEFT JOIN {SCHEMA}.shop_categories c ON c.section_id = s.id AND c.active = TRUE
                GROUP BY s.id ORDER BY s.sort_order
            """)
            rows = cur.fetchall()
            sections = []
            for r in rows:
                sections.append({
                    'id': r[0], 'slug': r[1], 'title': r[2], 'description': r[3],
                    'icon': r[4], 'sort_order': r[5], 'active': r[6], 'has_order_form': r[7],
                    'categories': r[8] or []
                })
            return ok(sections)

        # GET ?section=slug — товары раздела
        if method == 'GET' and 'section' in params:
            section_slug = params['section']
            category_slug = params.get('category')
            search = params.get('search', '').strip().lower()

            where = [f"s.slug = '{section_slug}'", "p.in_stock = TRUE"]
            if category_slug:
                where.append(f"c.slug = '{category_slug}'")
            if search:
                where.append(f"(LOWER(p.name) LIKE '%{search}%' OR LOWER(p.description) LIKE '%{search}%')")

            where_sql = ' AND '.join(where)
            cur.execute(f"""
                SELECT p.id, p.name, p.price, p.tag, p.icon, p.photo_url, p.description,
                       p.in_stock, p.sort_order, c.id, c.slug, c.title, s.slug
                FROM {SCHEMA}.products p
                LEFT JOIN {SCHEMA}.shop_sections s ON s.id = p.section_id
                LEFT JOIN {SCHEMA}.shop_categories c ON c.id = p.category_id
                WHERE {where_sql}
                ORDER BY p.sort_order, p.id
            """)
            rows = cur.fetchall()
            products = []
            for r in rows:
                products.append({
                    'id': r[0], 'name': r[1], 'price': r[2], 'tag': r[3],
                    'icon': r[4], 'photo_url': r[5], 'description': r[6],
                    'in_stock': r[7], 'sort_order': r[8],
                    'category': {'id': r[9], 'slug': r[10], 'title': r[11]},
                    'section_slug': r[12]
                })
            return ok(products)

        # POST actions
        if method == 'POST':
            action = params.get('action', '')

            # Заявка на заказ
            if action == 'order_form':
                name = body.get('name', '').strip()
                contact = body.get('contact', '').strip()
                message = body.get('message', '').strip()
                section = body.get('section', '').strip()
                if not name or not contact:
                    return err('Заполните имя и контакт')
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.leads (name, contact, message, source, created_at)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (name, contact, f"Заказ ({section}): {message}", 'shop_order'))
                conn.commit()
                return ok({'success': True})

            # Добавить раздел
            if action == 'add_section':
                slug = body.get('slug', '').strip()
                title = body.get('title', '').strip()
                if not slug or not title:
                    return err('slug и title обязательны')
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.shop_sections (slug, title, description, icon, sort_order, has_order_form)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
                """, (slug, title, body.get('description',''), body.get('icon','Package'),
                      body.get('sort_order', 99), body.get('has_order_form', False)))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({'id': new_id, 'success': True})

            # Добавить категорию
            if action == 'add_category':
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.shop_categories (section_id, slug, title, icon, sort_order)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id
                """, (body['section_id'], body['slug'], body['title'],
                      body.get('icon','Tag'), body.get('sort_order', 99)))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({'id': new_id, 'success': True})

            # Вкл/выкл раздел
            if action == 'toggle_section':
                section_id = body.get('id')
                cur.execute(f"UPDATE {SCHEMA}.shop_sections SET active = NOT active WHERE id = %s RETURNING active", (section_id,))
                row = cur.fetchone()
                conn.commit()
                return ok({'active': row[0]})

            # Вкл/выкл категорию
            if action == 'toggle_category':
                cat_id = body.get('id')
                cur.execute(f"UPDATE {SCHEMA}.shop_categories SET active = NOT active WHERE id = %s RETURNING active", (cat_id,))
                row = cur.fetchone()
                conn.commit()
                return ok({'active': row[0]})

            # Редактировать категорию
            if action == 'update_category':
                cat_id = body.get('id')
                cur.execute(f"""
                    UPDATE {SCHEMA}.shop_categories
                    SET slug=%s, title=%s, icon=%s, sort_order=%s
                    WHERE id=%s
                """, (body['slug'], body['title'], body.get('icon', 'Tag'), body.get('sort_order', 0), cat_id))
                conn.commit()
                return ok({'success': True})

            # Удалить категорию
            if action == 'delete_category':
                cat_id = body.get('id')
                cur.execute(f"DELETE FROM {SCHEMA}.shop_categories WHERE id=%s", (cat_id,))
                conn.commit()
                return ok({'success': True})

            # Добавить товар
            if action == 'add_product':
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.products
                    (name, price, category, tag, icon, photo_url, description, section_id, category_id, in_stock, sort_order)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, %s) RETURNING id
                """, (body['name'], body['price'], body.get('category',''), body.get('tag',''),
                      body.get('icon','Package'), body.get('photo_url'), body.get('description',''),
                      body.get('section_id'), body.get('category_id'), body.get('sort_order', 99)))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({'id': new_id, 'success': True})

            # Обновить товар
            if action == 'update_product':
                pid = body.get('id')
                fields = []
                vals = []
                for f in ['name','price','tag','icon','photo_url','description','section_id','category_id','in_stock','sort_order']:
                    if f in body:
                        fields.append(f'{f} = %s')
                        vals.append(body[f])
                if fields:
                    vals.append(pid)
                    cur.execute(f"UPDATE {SCHEMA}.products SET {', '.join(fields)} WHERE id = %s", vals)
                    conn.commit()
                return ok({'success': True})

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()