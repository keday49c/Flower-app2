from flask import Blueprint, request, jsonify
import base64
import requests
import os
from datetime import datetime
from src.models.user import db, User
from src.models.verification import Verification
import jwt

verification_bp = Blueprint('verification', __name__)

# Configurações das APIs (em produção, usar variáveis de ambiente)
FACE_API_CONFIG = {
    'provider': 'mock',  # Para demonstração, usar mock. Em produção: 'aws', 'azure', etc.
    'aws_access_key': os.getenv('AWS_ACCESS_KEY_ID'),
    'aws_secret_key': os.getenv('AWS_SECRET_ACCESS_KEY'),
    'aws_region': 'us-east-1'
}

OCR_API_CONFIG = {
    'provider': 'mock',  # Para demonstração, usar mock. Em produção: 'azure', 'aws', etc.
    'azure_endpoint': os.getenv('AZURE_OCR_ENDPOINT'),
    'azure_key': os.getenv('AZURE_OCR_KEY')
}

def verify_token(token):
    """Verifica se o token JWT é válido"""
    try:
        payload = jwt.decode(token, 'asdf#FGSgvasgf$5$WGT', algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def analyze_face_gender(image_base64):
    """
    Analisa uma imagem facial para detectar gênero
    Em produção, integrar com APIs reais como AWS Rekognition ou Azure Face API
    """
    if FACE_API_CONFIG['provider'] == 'mock':
        # Mock response para demonstração
        return {
            'success': True,
            'gender': 'female',  # Simulando detecção feminina
            'confidence': 0.85,
            'face_detected': True,
            'liveness_check': True
        }
    
    # Implementação real seria aqui
    # Exemplo para AWS Rekognition:
    # import boto3
    # client = boto3.client('rekognition', region_name=FACE_API_CONFIG['aws_region'])
    # response = client.detect_faces(
    #     Image={'Bytes': base64.b64decode(image_base64)},
    #     Attributes=['Gender']
    # )
    
    return {'success': False, 'error': 'API não configurada'}

def extract_rg_data(image_base64):
    """
    Extrai dados do RG usando OCR
    Em produção, integrar com APIs reais como Azure Document Intelligence ou AWS Textract
    """
    if OCR_API_CONFIG['provider'] == 'mock':
        # Mock response para demonstração
        return {
            'success': True,
            'extracted_data': {
                'name': 'Maria Silva Santos',
                'rg_number': '12.345.678-9',
                'birth_date': '15/03/1990',
                'gender': 'F',  # Feminino
                'issuing_organ': 'SSP/SP',
                'document_type': 'RG'
            },
            'document_authentic': True,
            'face_in_document': True
        }
    
    # Implementação real seria aqui
    # Exemplo para Azure Document Intelligence:
    # headers = {
    #     'Ocp-Apim-Subscription-Key': OCR_API_CONFIG['azure_key'],
    #     'Content-Type': 'application/json'
    # }
    # data = {'base64Source': image_base64}
    # response = requests.post(OCR_API_CONFIG['azure_endpoint'], headers=headers, json=data)
    
    return {'success': False, 'error': 'API não configurada'}

def compare_faces(selfie_base64, rg_photo_base64):
    """
    Compara a selfie com a foto do RG para verificar se é a mesma pessoa
    """
    if FACE_API_CONFIG['provider'] == 'mock':
        # Mock response para demonstração
        return {
            'success': True,
            'match': True,
            'confidence': 0.92
        }
    
    # Implementação real seria aqui
    return {'success': False, 'error': 'API não configurada'}

@verification_bp.route('/verify-identity', methods=['POST'])
def verify_identity():
    """
    Endpoint principal para verificação de identidade e gênero
    Recebe selfie e fotos do RG, realiza todas as verificações
    """
    try:
        # Verificar autenticação
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token de autorização necessário'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Obter dados da requisição
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        selfie_image = data.get('selfie_image')
        rg_front_image = data.get('rg_front_image')
        rg_back_image = data.get('rg_back_image')
        
        if not all([selfie_image, rg_front_image]):
            return jsonify({'error': 'Selfie e foto da frente do RG são obrigatórias'}), 400
        
        # Verificar se o usuário já foi verificado
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        existing_verification = Verification.query.filter_by(user_id=user_id, status='approved').first()
        if existing_verification:
            return jsonify({'error': 'Usuário já verificado'}), 400
        
        # 1. Análise da selfie para detecção de gênero
        face_analysis = analyze_face_gender(selfie_image)
        if not face_analysis['success']:
            return jsonify({'error': 'Erro na análise facial', 'details': face_analysis}), 500
        
        if not face_analysis['face_detected']:
            return jsonify({'error': 'Nenhum rosto detectado na selfie'}), 400
        
        if not face_analysis['liveness_check']:
            return jsonify({'error': 'Falha na verificação de vivacidade'}), 400
        
        # 2. OCR do RG
        rg_data = extract_rg_data(rg_front_image)
        if not rg_data['success']:
            return jsonify({'error': 'Erro na extração de dados do RG', 'details': rg_data}), 500
        
        if not rg_data['document_authentic']:
            return jsonify({'error': 'Documento não autêntico'}), 400
        
        # 3. Comparação facial (selfie vs foto do RG)
        face_comparison = compare_faces(selfie_image, rg_front_image)
        if not face_comparison['success']:
            return jsonify({'error': 'Erro na comparação facial', 'details': face_comparison}), 500
        
        if not face_comparison['match']:
            return jsonify({'error': 'A pessoa na selfie não corresponde à foto do RG'}), 400
        
        # 4. Verificação de gênero
        face_gender = face_analysis['gender']
        rg_gender = rg_data['extracted_data'].get('gender', '').upper()
        
        # Mapear gêneros para comparação
        gender_mapping = {'F': 'female', 'M': 'male', 'FEMININO': 'female', 'MASCULINO': 'male'}
        rg_gender_normalized = gender_mapping.get(rg_gender, rg_gender.lower())
        
        # Verificar se ambos indicam gênero feminino
        is_female_face = face_gender == 'female'
        is_female_rg = rg_gender_normalized == 'female'
        
        if not (is_female_face and is_female_rg):
            return jsonify({
                'error': 'Acesso negado: verificação de gênero não atendida',
                'details': {
                    'face_gender': face_gender,
                    'rg_gender': rg_gender_normalized
                }
            }), 403
        
        # 5. Salvar verificação no banco de dados
        verification = Verification(
            user_id=user_id,
            face_gender=face_gender,
            face_confidence=face_analysis['confidence'],
            rg_gender=rg_gender_normalized,
            rg_data=str(rg_data['extracted_data']),
            face_match_confidence=face_comparison['confidence'],
            status='approved',
            verified_at=datetime.utcnow()
        )
        
        db.session.add(verification)
        
        # Atualizar status do usuário
        user.is_verified = True
        user.verification_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Verificação concluída com sucesso',
            'verification_id': verification.id,
            'user_verified': True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor', 'details': str(e)}), 500

@verification_bp.route('/verification-status', methods=['GET'])
def get_verification_status():
    """
    Retorna o status de verificação do usuário atual
    """
    try:
        # Verificar autenticação
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token de autorização necessário'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Buscar verificação do usuário
        verification = Verification.query.filter_by(user_id=user_id).order_by(Verification.created_at.desc()).first()
        user = User.query.get(user_id)
        
        if not verification:
            return jsonify({
                'verified': False,
                'status': 'not_started',
                'message': 'Verificação não iniciada'
            }), 200
        
        return jsonify({
            'verified': user.is_verified if user else False,
            'status': verification.status,
            'verification_date': verification.verified_at.isoformat() if verification.verified_at else None,
            'message': 'Verificação concluída' if verification.status == 'approved' else 'Verificação pendente'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor', 'details': str(e)}), 500

@verification_bp.route('/test-apis', methods=['GET'])
def test_apis():
    """
    Endpoint para testar a conectividade com as APIs de terceiros
    """
    try:
        # Testar API de reconhecimento facial
        face_test = analyze_face_gender("test_image_base64")
        
        # Testar API de OCR
        ocr_test = extract_rg_data("test_image_base64")
        
        return jsonify({
            'face_api': {
                'status': 'ok' if face_test['success'] else 'error',
                'provider': FACE_API_CONFIG['provider'],
                'details': face_test
            },
            'ocr_api': {
                'status': 'ok' if ocr_test['success'] else 'error',
                'provider': OCR_API_CONFIG['provider'],
                'details': ocr_test
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro no teste das APIs', 'details': str(e)}), 500

