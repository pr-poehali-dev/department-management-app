import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_db_connection():
    '''Get database connection using DATABASE_URL from environment'''
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL environment variable is not set')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage tasks - CRUD operations for task management system
    Args: event - dict with httpMethod, body, queryStringParameters, pathParams
          context - object with request_id, function_name attributes
    Returns: HTTP response dict with task data or error
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Role, X-User-Group-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            status_filter = query_params.get('status')
            priority_filter = query_params.get('priority')
            
            query = 'SELECT id, title, description, status, priority, assignee, due_date, created_at, updated_at, attachments FROM tasks WHERE 1=1'
            params = []
            
            if status_filter and status_filter != 'all':
                query += ' AND status = %s'
                params.append(status_filter)
            
            if priority_filter and priority_filter != 'all':
                query += ' AND priority = %s'
                params.append(priority_filter)
            
            query += ' ORDER BY due_date ASC'
            
            if params:
                cur.execute(query, params)
            else:
                cur.execute(query)
            
            tasks = cur.fetchall()
            
            tasks_list = []
            for task in tasks:
                tasks_list.append({
                    'id': str(task['id']),
                    'title': task['title'],
                    'description': task['description'],
                    'status': task['status'],
                    'priority': task['priority'],
                    'assignee': task['assignee'],
                    'dueDate': task['due_date'].isoformat() if task['due_date'] else None,
                    'createdAt': task['created_at'].isoformat() if task['created_at'] else None,
                    'updatedAt': task['updated_at'].isoformat() if task['updated_at'] else None,
                    'attachments': task['attachments'] if task['attachments'] else []
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'tasks': tasks_list}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            title = body_data.get('title')
            description = body_data.get('description', '')
            status = body_data.get('status', 'pending')
            priority = body_data.get('priority', 'medium')
            assignee = body_data.get('assignee')
            due_date = body_data.get('dueDate')
            attachments = body_data.get('attachments', [])
            
            if not title or not assignee or not due_date:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Missing required fields: title, assignee, dueDate'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                '''INSERT INTO tasks (title, description, status, priority, assignee, due_date, attachments) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, title, description, status, priority, assignee, due_date, created_at, updated_at, attachments''',
                (title, description, status, priority, assignee, due_date, json.dumps(attachments))
            )
            
            new_task = cur.fetchone()
            conn.commit()
            
            task_data = {
                'id': str(new_task['id']),
                'title': new_task['title'],
                'description': new_task['description'],
                'status': new_task['status'],
                'priority': new_task['priority'],
                'assignee': new_task['assignee'],
                'dueDate': new_task['due_date'].isoformat() if new_task['due_date'] else None,
                'createdAt': new_task['created_at'].isoformat() if new_task['created_at'] else None,
                'updatedAt': new_task['updated_at'].isoformat() if new_task['updated_at'] else None,
                'attachments': new_task['attachments'] if new_task['attachments'] else []
            }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'task': task_data}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            path_params = event.get('pathParams') or {}
            task_id = path_params.get('id')
            
            if not task_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Task ID is required'}),
                    'isBase64Encoded': False
                }
            
            headers = event.get('headers') or {}
            user_role = headers.get('X-User-Role') or headers.get('x-user-role')
            user_group_id = headers.get('X-User-Group-Id') or headers.get('x-user-group-id')
            
            if user_role == 'group_head' and user_group_id:
                cur.execute(
                    '''SELECT t.id FROM tasks t
                       JOIN employees e ON t.assignee = e.full_name
                       WHERE t.id = %s AND e.group_id = %s''',
                    (task_id, user_group_id)
                )
                task_check = cur.fetchone()
                if not task_check:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 403,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Access denied: task not in your group'}),
                        'isBase64Encoded': False
                    }
            elif user_role == 'employee':
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Access denied: employees cannot edit tasks'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            
            update_fields = []
            params = []
            
            if 'title' in body_data:
                update_fields.append('title = %s')
                params.append(body_data['title'])
            if 'description' in body_data:
                update_fields.append('description = %s')
                params.append(body_data['description'])
            if 'status' in body_data:
                update_fields.append('status = %s')
                params.append(body_data['status'])
            if 'priority' in body_data:
                update_fields.append('priority = %s')
                params.append(body_data['priority'])
            if 'assignee' in body_data:
                update_fields.append('assignee = %s')
                params.append(body_data['assignee'])
            if 'dueDate' in body_data:
                update_fields.append('due_date = %s')
                params.append(body_data['dueDate'])
            if 'attachments' in body_data:
                update_fields.append('attachments = %s')
                params.append(json.dumps(body_data['attachments']))
            
            update_fields.append('updated_at = NOW()')
            params.append(task_id)
            
            query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = %s RETURNING id, title, description, status, priority, assignee, due_date, created_at, updated_at, attachments"
            
            cur.execute(query, params)
            updated_task = cur.fetchone()
            
            if not updated_task:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Task not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            task_data = {
                'id': str(updated_task['id']),
                'title': updated_task['title'],
                'description': updated_task['description'],
                'status': updated_task['status'],
                'priority': updated_task['priority'],
                'assignee': updated_task['assignee'],
                'dueDate': updated_task['due_date'].isoformat() if updated_task['due_date'] else None,
                'createdAt': updated_task['created_at'].isoformat() if updated_task['created_at'] else None,
                'updatedAt': updated_task['updated_at'].isoformat() if updated_task['updated_at'] else None,
                'attachments': updated_task['attachments'] if updated_task['attachments'] else []
            }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'task': task_data}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            path_params = event.get('pathParams') or {}
            task_id = path_params.get('id')
            
            if not task_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Task ID is required'}),
                    'isBase64Encoded': False
                }
            
            headers = event.get('headers') or {}
            user_role = headers.get('X-User-Role') or headers.get('x-user-role')
            user_group_id = headers.get('X-User-Group-Id') or headers.get('x-user-group-id')
            
            if user_role == 'group_head' and user_group_id:
                cur.execute(
                    '''SELECT t.id FROM tasks t
                       JOIN employees e ON t.assignee = e.full_name
                       WHERE t.id = %s AND e.group_id = %s''',
                    (task_id, user_group_id)
                )
                task_check = cur.fetchone()
                if not task_check:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 403,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Access denied: task not in your group'}),
                        'isBase64Encoded': False
                    }
            elif user_role == 'employee':
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Access denied: employees cannot delete tasks'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('DELETE FROM tasks WHERE id = %s RETURNING id', (task_id,))
            deleted_task = cur.fetchone()
            
            if not deleted_task:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Task not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Task deleted successfully'}),
                'isBase64Encoded': False
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'}),
            'isBase64Encoded': False
        }