"""
Site Settings API — настройки сайта, FAQ, квиз.
GET  /              — все настройки + FAQ + квиз (публичный)
POST /?section=settings  — сохранить настройки (admin)
POST /?section=faq       — создать/обновить/удалить FAQ
POST /?section=quiz      — создать/обновить/удалить вопрос квиза
POST /?section=results   — обновить результаты квиза
"""
import json, os
import psycopg2

SCHEMA = 't_p51549197_aqua_terra_project'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def check_admin(event):
    token = (event.get('headers') or {}).get('X-Admin-Token', '')
    return token == os.environ.get('ADMIN_TOKEN', '')

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
        # GET — всё публично
        if method == 'GET':
            # Settings
            cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings")
            settings = {r[0]: r[1] for r in cur.fetchall()}

            # FAQ
            cur.execute(f"SELECT id, question, answer, sort_order FROM {SCHEMA}.faq WHERE active=TRUE ORDER BY sort_order")
            faq = [{'id': r[0], 'q': r[1], 'a': r[2], 'sort_order': r[3]} for r in cur.fetchall()]

            # Quiz questions + answers
            cur.execute(f"SELECT id, question, sort_order FROM {SCHEMA}.quiz_questions WHERE active=TRUE ORDER BY sort_order")
            questions = []
            for qr in cur.fetchall():
                cur2 = conn.cursor()
                cur2.execute(f"SELECT id, text, type, sort_order FROM {SCHEMA}.quiz_answers WHERE question_id=%s ORDER BY sort_order", (qr[0],))
                answers = [{'id': r[0], 'text': r[1], 'type': r[2]} for r in cur2.fetchall()]
                cur2.close()
                questions.append({'id': qr[0], 'question': qr[1], 'sort_order': qr[2], 'answers': answers})

            # Quiz results
            cur.execute(f"SELECT type, title, description, tip FROM {SCHEMA}.quiz_results")
            results = {r[0]: {'title': r[1], 'desc': r[2], 'tip': r[3]} for r in cur.fetchall()}

            return ok({'settings': settings, 'faq': faq, 'quiz': questions, 'quiz_results': results})

        # POST — только admin
        if method == 'POST':
            if not check_admin(event):
                return err('Unauthorized', 401)

            section = params.get('section', '')
            action = body.get('action', '')

            # --- SETTINGS ---
            if section == 'settings':
                for key, value in body.items():
                    if key == 'action':
                        continue
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.site_settings (key, value, updated_at)
                        VALUES (%s, %s, NOW())
                        ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
                    """, (key, str(value)))
                conn.commit()
                return ok({'success': True})

            # --- FAQ ---
            if section == 'faq':
                if action == 'create':
                    cur.execute(f"INSERT INTO {SCHEMA}.faq (question, answer, sort_order) VALUES (%s, %s, %s) RETURNING id",
                        (body['question'], body['answer'], body.get('sort_order', 99)))
                    new_id = cur.fetchone()[0]
                    conn.commit()
                    return ok({'id': new_id, 'success': True})
                if action == 'update':
                    cur.execute(f"UPDATE {SCHEMA}.faq SET question=%s, answer=%s, sort_order=%s WHERE id=%s",
                        (body['question'], body['answer'], body.get('sort_order', 0), body['id']))
                    conn.commit()
                    return ok({'success': True})
                if action == 'toggle':
                    cur.execute(f"UPDATE {SCHEMA}.faq SET active=NOT active WHERE id=%s RETURNING active", (body['id'],))
                    row = cur.fetchone()
                    conn.commit()
                    return ok({'active': row[0]})

            # --- QUIZ QUESTIONS ---
            if section == 'quiz':
                if action == 'create_question':
                    cur.execute(f"INSERT INTO {SCHEMA}.quiz_questions (question, sort_order) VALUES (%s, %s) RETURNING id",
                        (body['question'], body.get('sort_order', 99)))
                    qid = cur.fetchone()[0]
                    for i, ans in enumerate(body.get('answers', [])):
                        cur.execute(f"INSERT INTO {SCHEMA}.quiz_answers (question_id, text, type, sort_order) VALUES (%s, %s, %s, %s)",
                            (qid, ans['text'], ans['type'], i))
                    conn.commit()
                    return ok({'id': qid, 'success': True})
                if action == 'update_question':
                    cur.execute(f"UPDATE {SCHEMA}.quiz_questions SET question=%s WHERE id=%s", (body['question'], body['id']))
                    # Обновляем ответы: удаляем старые, вставляем новые
                    cur.execute(f"UPDATE {SCHEMA}.quiz_answers SET text=%s, type=%s WHERE id=%s",
                        (body['text'], body['type'], body['answer_id'])) if 'answer_id' in body else None
                    conn.commit()
                    return ok({'success': True})
                if action == 'toggle_question':
                    cur.execute(f"UPDATE {SCHEMA}.quiz_questions SET active=NOT active WHERE id=%s RETURNING active", (body['id'],))
                    row = cur.fetchone()
                    conn.commit()
                    return ok({'active': row[0]})
                if action == 'update_answer':
                    cur.execute(f"UPDATE {SCHEMA}.quiz_answers SET text=%s, type=%s WHERE id=%s",
                        (body['text'], body['type'], body['id']))
                    conn.commit()
                    return ok({'success': True})

            # --- QUIZ RESULTS ---
            if section == 'results':
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.quiz_results (type, title, description, tip)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (type) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, tip=EXCLUDED.tip
                """, (body['type'], body['title'], body['description'], body['tip']))
                conn.commit()
                return ok({'success': True})

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()
