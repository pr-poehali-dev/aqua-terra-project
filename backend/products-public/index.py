import json
import os
import psycopg2

SCHEMA = 't_p51549197_aqua_terra_project'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """
    Публичное API товаров.
    GET /                    → все товары в наличии
    GET /?cat=animals        → фильтр по старому полю category
    GET /?category_id=5      → фильтр по category_id из каталога
    GET /?section_id=2       → фильтр по разделу каталога
    """
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    params = event.get('queryStringParameters') or {}
    cat = params.get('cat')
    category_id = params.get('category_id')
    section_id = params.get('section_id')

    conn = get_conn()
    cur = conn.cursor()

    where = [f"p.in_stock = TRUE"]
    if category_id:
        where.append(f"p.category_id = {int(category_id)}")
    elif section_id:
        where.append(f"p.section_id = {int(section_id)}")
    elif cat and cat != 'all':
        where.append(f"p.category = '{cat}'")

    where_sql = ' AND '.join(where)

    cur.execute(f"""
        SELECT p.id, p.name, p.price, p.category, p.tag, p.icon, p.photo_url, p.description,
               p.section_id, p.category_id,
               c.slug as category_slug, c.title as category_title,
               s.slug as section_slug, s.title as section_title
        FROM {SCHEMA}.products p
        LEFT JOIN {SCHEMA}.shop_categories c ON c.id = p.category_id
        LEFT JOIN {SCHEMA}.shop_sections s ON s.id = p.section_id
        WHERE {where_sql}
        ORDER BY p.sort_order, p.created_at DESC
    """)

    rows = cur.fetchall()
    conn.close()

    keys = ['id', 'name', 'price', 'category', 'tag', 'icon', 'photo_url', 'description',
            'section_id', 'category_id', 'category_slug', 'category_title', 'section_slug', 'section_title']
    products = [dict(zip(keys, row)) for row in rows]

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps(products, ensure_ascii=False, default=str),
    }
