import json
import os
import base64
import uuid
import psycopg2
import boto3


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
    Админ API каталога товаров с загрузкой фото в S3.
    GET /         → все товары
    POST /        → создать товар (с опциональным фото в base64)
    PUT /?id=N    → обновить товар
    DELETE /?id=N → удалить товар
    POST /upload?id=N → загрузить фото для товара (body: {photo_base64, ext})
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
        cur.execute("SELECT id, name, price, category, tag, icon, photo_url, in_stock, created_at FROM products ORDER BY created_at DESC")
        rows = cur.fetchall()
        conn.close()
        keys = ['id', 'name', 'price', 'category', 'tag', 'icon', 'photo_url', 'in_stock', 'created_at']
        products = []
        for row in rows:
            p = dict(zip(keys, row))
            p['created_at'] = p['created_at'].isoformat()
            products.append(p)
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(products, ensure_ascii=False)}

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

        cur.execute("UPDATE products SET photo_url = %s WHERE id = %s", (cdn_url, product_id))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'photo_url': cdn_url})}

    if method == 'POST':
        data = json.loads(event.get('body') or '{}')
        name = (data.get('name') or '').strip()
        if not name:
            conn.close()
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'name required'})}
        cur.execute(
            "INSERT INTO products (name, price, category, tag, icon, photo_url, in_stock) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (name, int(data.get('price', 0)), data.get('category', 'animals'),
             data.get('tag', ''), data.get('icon', 'Package'), data.get('photo_url'), data.get('in_stock', True))
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
        cur.execute(
            "UPDATE products SET name=%s, price=%s, category=%s, tag=%s, icon=%s, in_stock=%s WHERE id=%s",
            (data.get('name'), int(data.get('price', 0)), data.get('category'), data.get('tag'), data.get('icon'), data.get('in_stock', True), product_id)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    if method == 'DELETE':
        cur.execute("DELETE FROM products WHERE id=%s", (product_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    conn.close()
    return {'statusCode': 405, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Method not allowed'})}
