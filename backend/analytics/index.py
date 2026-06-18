import json
import os
import psycopg2

SCHEMA = 't_p51549197_aqua_terra_project'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def check_auth(event):
    return (event.get('headers') or {}).get('X-Admin-Token', '') == os.environ.get('ADMIN_TOKEN', '')

def handler(event: dict, context) -> dict:
    '''
    Аналитика и управление заявками.
    GET /?type=stats       — статистика
    GET /?type=leads       — активные заявки
    GET /?type=archived    — архивные заявки
    PUT /?id=N             — отметить прочитанной
    PUT /?id=N&action=archive   — в архив
    PUT /?id=N&action=unarchive — из архива
    DELETE /?id=N          — удалить заявку
    '''
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    def ok(data):
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if not check_auth(event):
        return {'statusCode': 401, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Unauthorized'})}

    params = event.get('queryStringParameters') or {}
    conn = get_conn()
    cur = conn.cursor()

    # DELETE — удалить заявку
    if method == 'DELETE':
        lead_id = params.get('id')
        if lead_id:
            cur.execute(f"DELETE FROM {SCHEMA}.leads WHERE id=%s", (lead_id,))
            conn.commit()
        conn.close()
        return ok({'success': True})

    # PUT — обновить заявку
    if method == 'PUT':
        lead_id = params.get('id')
        action = params.get('action', 'read')
        if lead_id:
            if action == 'archive':
                cur.execute(f"UPDATE {SCHEMA}.leads SET archived=true, read=true WHERE id=%s", (lead_id,))
            elif action == 'unarchive':
                cur.execute(f"UPDATE {SCHEMA}.leads SET archived=false WHERE id=%s", (lead_id,))
            else:
                cur.execute(f"UPDATE {SCHEMA}.leads SET read=true WHERE id=%s", (lead_id,))
            conn.commit()
        conn.close()
        return ok({'success': True})

    kind = params.get('type', 'stats')

    # Архивные заявки
    if kind == 'archived':
        cur.execute(f"""
            SELECT id, name, contact, message, source, read, created_at, archived
            FROM {SCHEMA}.leads WHERE archived=true ORDER BY created_at DESC LIMIT 200
        """)
        rows = cur.fetchall()
        conn.close()
        keys = ['id', 'name', 'contact', 'message', 'source', 'read', 'created_at', 'archived']
        leads = [dict(zip(keys, row)) for row in rows]
        return ok(leads)

    # Активные заявки
    if kind == 'leads':
        cur.execute(f"""
            SELECT id, name, contact, message, source, read, created_at, archived
            FROM {SCHEMA}.leads WHERE archived=false ORDER BY read ASC, created_at DESC LIMIT 200
        """)
        rows = cur.fetchall()
        conn.close()
        keys = ['id', 'name', 'contact', 'message', 'source', 'read', 'created_at', 'archived']
        leads = [dict(zip(keys, row)) for row in rows]
        return ok(leads)

    # Статистика
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.leads WHERE archived=false")
    total_leads = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.leads WHERE read=false AND archived=false")
    unread = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.leads WHERE created_at >= NOW() - INTERVAL '30 days' AND archived=false")
    leads_30d = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.leads WHERE created_at >= NOW() - INTERVAL '7 days' AND archived=false")
    leads_7d = cur.fetchone()[0]

    cur.execute(f"""
        SELECT DATE(created_at) as day, COUNT(*) as cnt
        FROM {SCHEMA}.leads WHERE created_at >= NOW() - INTERVAL '30 days' AND archived=false
        GROUP BY day ORDER BY day
    """)
    chart = [{'day': str(r[0]), 'count': r[1]} for r in cur.fetchall()]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.products WHERE in_stock=true")
    products_count = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.articles WHERE published=true")
    articles_count = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.portfolio WHERE active=true")
    portfolio_count = cur.fetchone()[0]

    conn.close()
    return ok({
        'total_leads': total_leads,
        'unread': unread,
        'leads_30d': leads_30d,
        'leads_7d': leads_7d,
        'chart': chart,
        'products_count': products_count,
        'articles_count': articles_count,
        'portfolio_count': portfolio_count,
    })
