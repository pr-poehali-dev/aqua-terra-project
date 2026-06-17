import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """
    Публичное API каталога товаров.
    GET /              → все товары в наличии
    GET /?cat=animals  → фильтр по категории (animals / food / supplies)
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

    conn = get_conn()
    cur = conn.cursor()

    if cat and cat != 'all':
        cur.execute(
            "SELECT id, name, price, category, tag, icon, photo_url, description FROM products "
            "WHERE in_stock = true AND category = %s ORDER BY created_at DESC",
            (cat,)
        )
    else:
        cur.execute(
            "SELECT id, name, price, category, tag, icon, photo_url, description FROM products "
            "WHERE in_stock = true ORDER BY created_at DESC"
        )

    rows = cur.fetchall()
    conn.close()

    keys = ['id', 'name', 'price', 'category', 'tag', 'icon', 'photo_url', 'description']
    products = [dict(zip(keys, row)) for row in rows]

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps(products, ensure_ascii=False),
    }