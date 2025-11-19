import json
import os
import hashlib
import secrets
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    '''Get database connection using DATABASE_URL from environment'''
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL environment variable is not set')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def hash_password(password: str) -> str:
    '''Simple password hashing using SHA256'''
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session_token() -> str:
    '''Generate random session token'''
    return secrets.token_urlsafe(32)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage employees, groups and authentication - CRUD operations
    Args: event - dict with httpMethod, body, queryStringParameters, pathParams
          context - object with request_id, function_name attributes
    Returns: HTTP response dict with employee/group/auth data or error
    '''
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    resource = query_params.get('resource', 'employees')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if resource == 'groups':
            if method == 'GET':
                cur.execute('''
                    SELECT g.id, g.name, g.description, g.created_at,
                           COUNT(e.id) as employee_count
                    FROM employee_groups g
                    LEFT JOIN employees e ON e.group_id = g.id
                    GROUP BY g.id, g.name, g.description, g.created_at
                    ORDER BY g.name ASC
                ''')
                groups = cur.fetchall()
                
                groups_list = []
                for group in groups:
                    groups_list.append({
                        'id': str(group['id']),
                        'name': group['name'],
                        'description': group['description'],
                        'employeeCount': group['employee_count'],
                        'createdAt': group['created_at'].isoformat() if group['created_at'] else None
                    })
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'groups': groups_list}),
                    'isBase64Encoded': False
                }
            
            elif method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                name = body_data.get('name')
                description = body_data.get('description', '')
                
                if not name:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Group name is required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    'INSERT INTO employee_groups (name, description) VALUES (%s, %s) RETURNING id, name, description, created_at',
                    (name, description)
                )
                new_group = cur.fetchone()
                conn.commit()
                
                group_data = {
                    'id': str(new_group['id']),
                    'name': new_group['name'],
                    'description': new_group['description'],
                    'employeeCount': 0,
                    'createdAt': new_group['created_at'].isoformat() if new_group['created_at'] else None
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'group': group_data}),
                    'isBase64Encoded': False
                }
        
        elif resource == 'employees':
            if method == 'GET':
                query_params = event.get('queryStringParameters') or {}
                group_filter = query_params.get('group_id')
                
                query = '''
                    SELECT e.id, e.full_name, e.email, e.position, e.group_id, 
                           e.created_at, g.name as group_name
                    FROM employees e
                    LEFT JOIN employee_groups g ON e.group_id = g.id
                    WHERE 1=1
                '''
                params = []
                
                if group_filter and group_filter != 'all':
                    query += ' AND e.group_id = %s'
                    params.append(group_filter)
                
                query += ' ORDER BY e.full_name ASC'
                
                if params:
                    cur.execute(query, params)
                else:
                    cur.execute(query)
                
                employees = cur.fetchall()
                
                employees_list = []
                for emp in employees:
                    employees_list.append({
                        'id': str(emp['id']),
                        'fullName': emp['full_name'],
                        'email': emp['email'],
                        'position': emp['position'],
                        'groupId': str(emp['group_id']) if emp['group_id'] else None,
                        'groupName': emp['group_name'],
                        'createdAt': emp['created_at'].isoformat() if emp['created_at'] else None
                    })
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'employees': employees_list}),
                    'isBase64Encoded': False
                }
            
            elif method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                full_name = body_data.get('fullName')
                email = body_data.get('email')
                position = body_data.get('position')
                group_id = body_data.get('groupId')
                
                if not full_name:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Full name is required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    '''INSERT INTO employees (full_name, email, position, group_id) 
                       VALUES (%s, %s, %s, %s) 
                       RETURNING id, full_name, email, position, group_id, created_at''',
                    (full_name, email, position, group_id if group_id else None)
                )
                new_emp = cur.fetchone()
                conn.commit()
                
                group_name = None
                if new_emp['group_id']:
                    cur.execute('SELECT name FROM employee_groups WHERE id = %s', (new_emp['group_id'],))
                    group_result = cur.fetchone()
                    if group_result:
                        group_name = group_result['name']
                
                emp_data = {
                    'id': str(new_emp['id']),
                    'fullName': new_emp['full_name'],
                    'email': new_emp['email'],
                    'position': new_emp['position'],
                    'groupId': str(new_emp['group_id']) if new_emp['group_id'] else None,
                    'groupName': group_name,
                    'createdAt': new_emp['created_at'].isoformat() if new_emp['created_at'] else None
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'employee': emp_data}),
                    'isBase64Encoded': False
                }
            
            elif method == 'PUT':
                emp_id = path_params.get('id')
                
                if not emp_id:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Employee ID is required'}),
                        'isBase64Encoded': False
                    }
                
                body_data = json.loads(event.get('body', '{}'))
                
                update_fields = []
                params = []
                
                if 'fullName' in body_data:
                    update_fields.append('full_name = %s')
                    params.append(body_data['fullName'])
                if 'email' in body_data:
                    update_fields.append('email = %s')
                    params.append(body_data['email'])
                if 'position' in body_data:
                    update_fields.append('position = %s')
                    params.append(body_data['position'])
                if 'groupId' in body_data:
                    update_fields.append('group_id = %s')
                    params.append(body_data['groupId'] if body_data['groupId'] else None)
                
                params.append(emp_id)
                
                query = f"UPDATE employees SET {', '.join(update_fields)} WHERE id = %s RETURNING id, full_name, email, position, group_id, created_at"
                
                cur.execute(query, params)
                updated_emp = cur.fetchone()
                
                if not updated_emp:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Employee not found'}),
                        'isBase64Encoded': False
                    }
                
                conn.commit()
                
                group_name = None
                if updated_emp['group_id']:
                    cur.execute('SELECT name FROM employee_groups WHERE id = %s', (updated_emp['group_id'],))
                    group_result = cur.fetchone()
                    if group_result:
                        group_name = group_result['name']
                
                emp_data = {
                    'id': str(updated_emp['id']),
                    'fullName': updated_emp['full_name'],
                    'email': updated_emp['email'],
                    'position': updated_emp['position'],
                    'groupId': str(updated_emp['group_id']) if updated_emp['group_id'] else None,
                    'groupName': group_name,
                    'createdAt': updated_emp['created_at'].isoformat() if updated_emp['created_at'] else None
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'employee': emp_data}),
                    'isBase64Encoded': False
                }
        
        elif resource == 'auth':
            if method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                username = body_data.get('username')
                password = body_data.get('password')
                
                if not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Username and password are required'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                
                cur.execute(
                    '''SELECT u.id, u.username, u.full_name, u.role, u.employee_id,
                              e.full_name as employee_name, e.position
                       FROM users u
                       LEFT JOIN employees e ON u.employee_id = e.id
                       WHERE u.username = %s AND u.password_hash = %s''',
                    (username, password_hash)
                )
                user = cur.fetchone()
                
                if not user:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 401,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Invalid username or password'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    'UPDATE users SET last_login = NOW() WHERE id = %s',
                    (user['id'],)
                )
                conn.commit()
                
                session_token = generate_session_token()
                
                user_data = {
                    'id': str(user['id']),
                    'username': user['username'],
                    'fullName': user['full_name'],
                    'role': user['role'],
                    'employeeId': str(user['employee_id']) if user['employee_id'] else None,
                    'employeeName': user['employee_name'],
                    'position': user['position'],
                    'sessionToken': session_token
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'user': user_data}),
                    'isBase64Encoded': False
                }
        
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