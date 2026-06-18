import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = 't_p51549197_aqua_terra_project'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def check_auth(event: dict) -> bool:
    token = (event.get('headers') or {}).get('X-Admin-Token', '')
    return token == os.environ.get('ADMIN_TOKEN', '')


def handler(event: dict, context) -> dict:
    """
    Админ API товаров.
    GET /         → все товары (с section_id, category_id)
    POST /        → создать товар
    PUT /?id=N    → обновить товар
    DELETE /?id=N → удалить товар
    POST /upload?id=N → загрузить фото
    """
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if not check_auth(event):
        return {'statusCode': 401, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Unauthorized'})}

    params = event.get('queryStringParameters') or {}
    path = event.get('path', '/')
    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(f"""
            SELECT p.id, p.name, p.price, p.category, p.tag, p.icon, p.photo_url,
                   p.in_stock, p.description, p.created_at, p.section_id, p.category_id, p.sort_order,
                   s.title as section_title, c.title as category_title
            FROM {SCHEMA}.products p
            LEFT JOIN {SCHEMA}.shop_sections s ON s.id = p.section_id
            LEFT JOIN {SCHEMA}.shop_categories c ON c.id = p.category_id
            ORDER BY p.created_at DESC
        """)
        rows = cur.fetchall()
        conn.close()
        keys = ['id', 'name', 'price', 'category', 'tag', 'icon', 'photo_url',
                'in_stock', 'description', 'created_at', 'section_id', 'category_id', 'sort_order',
                'section_title', 'category_title']
        products = []
        for row in rows:
            p = dict(zip(keys, row))
            p['created_at'] = p['created_at'].isoformat()
            products.append(p)
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(products, ensure_ascii=False, default=str)}

    if method == 'POST' and 'upload' in path:
        product_id = params.get('id')
        if not product_id:
            conn.close()
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'id required'})}

        data = json.loads(event.get('body') or '{}')
        photo_b64 = data.get('photo_base64', '')
        ext = data.get('ext', 'jpg').lower().strip('.')
        if ext not in ('jpg', 'jpeg', 'png', 'webp'):
            ext = 'jpg'

        img_data = base64.b64decode(photo_b64)
        key = f'products/{uuid.uuid4()}.{ext}'
        content_types = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}

        s3 = get_s3()
        s3.put_object(Bucket='files', Key=key, Body=img_data, ContentType=content_types.get(ext, 'image/jpeg'))

        access_key = os.environ['AWS_ACCESS_KEY_ID']
        cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/files/{key}'

        cur.execute(f"UPDATE {SCHEMA}.products SET photo_url = %s WHERE id = %s", (cdn_url, product_id))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'photo_url': cdn_url})}

    if method == 'POST':
        data = json.loads(event.get('body') or '{}')
        name = (data.get('name') or '').strip()
        if not name:
            conn.close()
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'name required'})}

        section_id = data.get('section_id') or None
        category_id = data.get('category_id') or None

        cur.execute(
            f"""INSERT INTO {SCHEMA}.products
                (name, price, category, tag, icon, photo_url, in_stock, description, section_id, category_id)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (name, int(data.get('price', 0)), data.get('category', ''),
             data.get('tag', ''), data.get('icon', 'Package'), data.get('photo_url'),
             data.get('in_stock', True), data.get('description', ''),
             section_id, category_id)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'id': new_id})}

    product_id = params.get('id')
    if not product_id:
        conn.close()
        return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'id required'})}

    if method == 'PUT':
        data = json.loads(event.get('body') or '{}')
        section_id = data.get('section_id') or None
        category_id = data.get('category_id') or None
        cur.execute(
            f"""UPDATE {SCHEMA}.products
                SET name=%s, price=%s, category=%s, tag=%s, icon=%s,
                    in_stock=%s, description=%s, section_id=%s, category_id=%s
                WHERE id=%s""",
            (data.get('name'), int(data.get('price', 0)), data.get('category', ''),
             data.get('tag'), data.get('icon'), data.get('in_stock', True),
             data.get('description', ''), section_id, category_id, product_id)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    if method == 'DELETE':
        cur.execute(f"DELETE FROM {SCHEMA}.products WHERE id=%s", (product_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    conn.close()
    return {'statusCode': 405, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Method not allowed'})}
