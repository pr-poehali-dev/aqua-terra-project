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


def check_auth(event):
    return (event.get('headers') or {}).get('X-Admin-Token', '') == os.environ.get('ADMIN_TOKEN', '')


def handler(event: dict, context) -> dict:
    """
    API портфолио: публичный GET и полный CRUD для админа.
    GET /           → активные работы (публично)
    GET /?admin=1   → все работы (требует X-Admin-Token)
    POST /          → создать работу
    PUT /?id=N      → обновить работу
    DELETE /?id=N   → удалить работу
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

    params = event.get('queryStringParameters') or {}
    path = event.get('path', '/')
    conn = get_conn()
    cur = conn.cursor()
    keys = ['id', 'title', 'tag', 'description', 'icon', 'photo_url', 'sort_order', 'active']

    if method == 'GET':
        is_admin = params.get('admin') == '1' and check_auth(event)
        if is_admin:
            cur.execute("SELECT id,title,tag,description,icon,photo_url,sort_order,active FROM portfolio ORDER BY sort_order,id")
        else:
            cur.execute("SELECT id,title,tag,description,icon,photo_url,sort_order,active FROM portfolio WHERE active=true ORDER BY sort_order,id")
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps([dict(zip(keys, r)) for r in rows], ensure_ascii=False)}

    if not check_auth(event):
        conn.close()
        return {'statusCode': 401, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Unauthorized'})}

    if method == 'POST' and 'upload' in path:
        pid = params.get('id')
        if not pid:
            conn.close()
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'id required'})}
        data = json.loads(event.get('body') or '{}')
        ext = data.get('ext', 'jpg').lower().strip('.')
        if ext not in ('jpg', 'jpeg', 'png', 'webp'): ext = 'jpg'
        img = base64.b64decode(data.get('photo_base64', ''))
        key = f'portfolio/{uuid.uuid4()}.{ext}'
        ct = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}
        get_s3().put_object(Bucket='files', Key=key, Body=img, ContentType=ct.get(ext, 'image/jpeg'))
        cdn = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{key}"
        cur.execute("UPDATE portfolio SET photo_url=%s WHERE id=%s", (cdn, pid))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'photo_url': cdn})}

    if method == 'POST':
        data = json.loads(event.get('body') or '{}')
        title = (data.get('title') or '').strip()
        if not title:
            conn.close()
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'title required'})}
        cur.execute(
            "INSERT INTO portfolio (title,tag,description,icon,sort_order,active) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
            (title, data.get('tag',''), data.get('description',''), data.get('icon','Fish'),
             int(data.get('sort_order', 99)), data.get('active', True))
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'id': new_id})}

    pid = params.get('id')
    if not pid:
        conn.close()
        return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'id required'})}

    if method == 'PUT':
        data = json.loads(event.get('body') or '{}')
        cur.execute(
            "UPDATE portfolio SET title=%s,tag=%s,description=%s,icon=%s,sort_order=%s,active=%s WHERE id=%s",
            (data.get('title'), data.get('tag'), data.get('description'),
             data.get('icon'), int(data.get('sort_order', 99)), data.get('active', True), pid)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    if method == 'DELETE':
        cur.execute("DELETE FROM portfolio WHERE id=%s", (pid,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    conn.close()
    return {'statusCode': 405, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Method not allowed'})}
