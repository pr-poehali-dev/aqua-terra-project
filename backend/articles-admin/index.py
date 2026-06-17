import json
import os
import re
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def slugify(text: str) -> str:
    trans = str.maketrans('абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
                          'abvgdeejzijklmnoprstufhcchshhjyleeyuaabvgdeejzijklmnoprstufhcchshhjyleeyua')
    slug = text.lower().translate(trans)
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')
    return slug[:80]


def check_auth(event: dict) -> bool:
    token = (event.get('headers') or {}).get('X-Admin-Token', '')
    return token == os.environ.get('ADMIN_TOKEN', '')


def handler(event: dict, context) -> dict:
    """
    Админ API для управления статьями (создание, редактирование, удаление, публикация).
    Требует заголовок X-Admin-Token.
    GET /            → все статьи (включая черновики)
    POST /           → создать статью
    PUT /?id=N       → обновить статью
    DELETE /?id=N    → удалить статью
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
    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':
        cur.execute("SELECT id, title, slug, excerpt, category, cover_url, published, created_at FROM articles ORDER BY created_at DESC")
        rows = cur.fetchall()
        conn.close()
        keys = ['id', 'title', 'slug', 'excerpt', 'category', 'cover_url', 'published', 'created_at']
        articles = []
        for row in rows:
            a = dict(zip(keys, row))
            a['created_at'] = a['created_at'].isoformat()
            articles.append(a)
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(articles, ensure_ascii=False)}

    if method == 'POST':
        data = json.loads(event.get('body') or '{}')
        title = data.get('title', '').strip()
        if not title:
            conn.close()
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'title required'})}
        slug = slugify(title)
        cur.execute(
            "INSERT INTO articles (title, slug, excerpt, content, category, cover_url, published) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, slug",
            (title, slug, data.get('excerpt', ''), data.get('content', ''),
             data.get('category', 'Общее'), data.get('cover_url'), data.get('published', False))
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'id': row[0], 'slug': row[1]})}

    article_id = params.get('id')
    if not article_id:
        conn.close()
        return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'id required'})}

    if method == 'PUT':
        data = json.loads(event.get('body') or '{}')
        cur.execute(
            "UPDATE articles SET title=%s, excerpt=%s, content=%s, category=%s, cover_url=%s, published=%s, updated_at=NOW() "
            "WHERE id=%s",
            (data.get('title'), data.get('excerpt'), data.get('content'),
             data.get('category'), data.get('cover_url'), data.get('published', False), article_id)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    if method == 'DELETE':
        cur.execute("DELETE FROM articles WHERE id=%s", (article_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    conn.close()
    return {'statusCode': 405, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Method not allowed'})}
