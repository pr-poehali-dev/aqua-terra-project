import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def check_auth(event):
    return (event.get('headers') or {}).get('X-Admin-Token', '') == os.environ.get('ADMIN_TOKEN', '')


def handler(event: dict, context) -> dict:
    '''
    Аналитика и управление заявками для админки.
    GET /?type=stats    — общая статистика + заявки за 30 дней по дням
    GET /?type=leads    — список заявок (непрочитанные первыми)
    PUT /?id=N          — отметить заявку прочитанной
    Требует X-Admin-Token.
    '''
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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

    if method == 'PUT':
        lead_id = params.get('id')
        if lead_id:
            cur.execute("UPDATE leads SET read=true WHERE id=%s", (lead_id,))
            conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

    kind = params.get('type', 'stats')

    if kind == 'leads':
        cur.execute("""
            SELECT id, name, contact, message, source, read, created_at
            FROM leads ORDER BY read ASC, created_at DESC LIMIT 100
        """)
        rows = cur.fetchall()
        conn.close()
        keys = ['id', 'name', 'contact', 'message', 'source', 'read', 'created_at']
        leads = []
        for row in rows:
            d = dict(zip(keys, row))
            d['created_at'] = d['created_at'].isoformat()
            leads.append(d)
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(leads, ensure_ascii=False)}

    # stats
    cur.execute("SELECT COUNT(*) FROM leads")
    total_leads = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM leads WHERE read=false")
    unread = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '30 days'")
    leads_30d = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '7 days'")
    leads_7d = cur.fetchone()[0]

    cur.execute("""
        SELECT DATE(created_at) as day, COUNT(*) as cnt
        FROM leads WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day ORDER BY day
    """)
    chart = [{'day': str(r[0]), 'count': r[1]} for r in cur.fetchall()]

    cur.execute("SELECT COUNT(*) FROM products WHERE in_stock=true")
    products_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM articles WHERE published=true")
    articles_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM portfolio WHERE active=true")
    portfolio_count = cur.fetchone()[0]

    conn.close()
    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({
            'total_leads': total_leads,
            'unread': unread,
            'leads_30d': leads_30d,
            'leads_7d': leads_7d,
            'chart': chart,
            'products_count': products_count,
            'articles_count': articles_count,
            'portfolio_count': portfolio_count,
        }, ensure_ascii=False)
    }
