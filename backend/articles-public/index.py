import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """
    Публичное API статей: список опубликованных и одна статья по slug.
    GET /          → список статей (id, title, slug, excerpt, category, cover_url, created_at)
    GET /?slug=... → полная статья по slug
    """
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    params = event.get('queryStringParameters') or {}
    slug = params.get('slug')

    conn = get_conn()
    cur = conn.cursor()

    if slug:
        cur.execute(
            "SELECT id, title, slug, excerpt, content, category, cover_url, created_at "
            "FROM articles WHERE slug = %s AND published = true",
            (slug,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Not found'})}
        keys = ['id', 'title', 'slug', 'excerpt', 'content', 'category', 'cover_url', 'created_at']
        article = dict(zip(keys, row))
        article['created_at'] = article['created_at'].isoformat()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(article, ensure_ascii=False)}

    cur.execute(
        "SELECT id, title, slug, excerpt, category, cover_url, created_at "
        "FROM articles WHERE published = true ORDER BY created_at DESC"
    )
    rows = cur.fetchall()
    conn.close()
    keys = ['id', 'title', 'slug', 'excerpt', 'category', 'cover_url', 'created_at']
    articles = []
    for row in rows:
        a = dict(zip(keys, row))
        a['created_at'] = a['created_at'].isoformat()
        articles.append(a)

    return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(articles, ensure_ascii=False)}
