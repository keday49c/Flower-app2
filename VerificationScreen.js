import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://5001-irl1xom9jo769f8lnpaqa-7f2f4372.manusvm.computer';

const VerificationScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: Intro, 2: Selfie, 3: RG Front, 4: RG Back, 5: Processing, 6: Result
  const [selfieImage, setSelfieImage] = useState(null);
  const [rgFrontImage, setRgFrontImage] = useState(null);
  const [rgBackImage, setRgBackImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('flower_token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/verification/verification-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.verified) {
          setStep(6);
          setVerificationResult({ success: true, message: 'Verificação já concluída!' });
        }
      }
    } catch (error) {
      console.log('Erro ao verificar status:', error);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Precisamos de acesso à câmera para realizar a verificação de identidade.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async (type) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [4, 3],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const imageData = result.assets[0];
        
        switch (type) {
          case 'selfie':
            setSelfieImage(imageData);
            setStep(3);
            break;
          case 'rg_front':
            setRgFrontImage(imageData);
            setStep(4);
            break;
          case 'rg_back':
            setRgBackImage(imageData);
            processVerification();
            break;
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível capturar a imagem. Tente novamente.');
    }
  };

  const processVerification = async () => {
    setStep(5);
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('flower_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const verificationData = {
        selfie_image: selfieImage.base64,
        rg_front_image: rgFrontImage.base64,
        rg_back_image: rgBackImage?.base64 || null
      };

      const response = await fetch(`${API_BASE}/api/verification/verify-identity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(verificationData)
      });

      const result = await response.json();

      if (response.ok) {
        setVerificationResult({
          success: true,
          message: 'Verificação concluída com sucesso! Bem-vinda à Flower! 🌸'
        });
      } else {
        setVerificationResult({
          success: false,
          message: result.error || 'Falha na verificação. Tente novamente.'
        });
      }
    } catch (error) {
      setVerificationResult({
        success: false,
        message: 'Erro de conexão. Verifique sua internet e tente novamente.'
      });
    } finally {
      setIsLoading(false);
      setStep(6);
    }
  };

  const resetVerification = () => {
    setStep(1);
    setSelfieImage(null);
    setRgFrontImage(null);
    setRgBackImage(null);
    setVerificationResult(null);
  };

  const renderIntroStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark" size={80} color="#E91E63" />
      </View>
      
      <Text style={styles.title}>Verificação de Identidade</Text>
      <Text style={styles.subtitle}>
        Para garantir a segurança de todas as usuárias, precisamos verificar sua identidade.
      </Text>
      
      <View style={styles.stepsInfo}>
        <View style={styles.stepInfo}>
          <Ionicons name="camera" size={24} color="#E91E63" />
          <Text style={styles.stepText}>1. Tire uma selfie</Text>
        </View>
        <View style={styles.stepInfo}>
          <Ionicons name="card" size={24} color="#E91E63" />
          <Text style={styles.stepText}>2. Fotografe seu RG (frente)</Text>
        </View>
        <View style={styles.stepInfo}>
          <Ionicons name="card-outline" size={24} color="#E91E63" />
          <Text style={styles.stepText}>3. Fotografe seu RG (verso)</Text>
        </View>
      </View>

      <Text style={styles.privacyNote}>
        🔒 Seus dados são protegidos e utilizados apenas para verificação de identidade, 
        conforme nossa Política de Privacidade e a LGPD.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
        <Text style={styles.primaryButtonText}>Iniciar Verificação</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSelfieStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="camera" size={80} color="#E91E63" />
      </View>
      
      <Text style={styles.title}>Tire uma Selfie</Text>
      <Text style={styles.subtitle}>
        Posicione seu rosto no centro da tela e tire uma foto clara.
      </Text>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>Dicas para uma boa selfie:</Text>
        <Text style={styles.instruction}>• Boa iluminação no rosto</Text>
        <Text style={styles.instruction}>• Olhe diretamente para a câmera</Text>
        <Text style={styles.instruction}>• Remova óculos escuros ou chapéus</Text>
        <Text style={styles.instruction}>• Mantenha expressão neutra</Text>
      </View>

      {selfieImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selfieImage.uri }} style={styles.previewImage} />
          <Text style={styles.imageLabel}>Selfie capturada ✓</Text>
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={() => takePhoto('selfie')}>
        <Ionicons name="camera" size={24} color="white" style={styles.buttonIcon} />
        <Text style={styles.primaryButtonText}>
          {selfieImage ? 'Tirar Nova Selfie' : 'Tirar Selfie'}
        </Text>
      </TouchableOpacity>

      {selfieImage && (
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(3)}>
          <Text style={styles.secondaryButtonText}>Continuar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRgFrontStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="card" size={80} color="#E91E63" />
      </View>
      
      <Text style={styles.title}>Fotografe seu RG (Frente)</Text>
      <Text style={styles.subtitle}>
        Fotografe a frente do seu RG de forma clara e legível.
      </Text>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>Dicas para fotografar o RG:</Text>
        <Text style={styles.instruction}>• Coloque o RG em superfície plana</Text>
        <Text style={styles.instruction}>• Boa iluminação, evite reflexos</Text>
        <Text style={styles.instruction}>• Enquadre todo o documento</Text>
        <Text style={styles.instruction}>• Mantenha a câmera paralela ao documento</Text>
      </View>

      {rgFrontImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: rgFrontImage.uri }} style={styles.previewImage} />
          <Text style={styles.imageLabel}>RG (frente) capturado ✓</Text>
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={() => takePhoto('rg_front')}>
        <Ionicons name="camera" size={24} color="white" style={styles.buttonIcon} />
        <Text style={styles.primaryButtonText}>
          {rgFrontImage ? 'Fotografar Novamente' : 'Fotografar RG (Frente)'}
        </Text>
      </TouchableOpacity>

      {rgFrontImage && (
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(4)}>
          <Text style={styles.secondaryButtonText}>Continuar</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
        <Ionicons name="arrow-back" size={24} color="#666" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRgBackStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="card-outline" size={80} color="#E91E63" />
      </View>
      
      <Text style={styles.title}>Fotografe seu RG (Verso)</Text>
      <Text style={styles.subtitle}>
        Fotografe o verso do seu RG para completar a verificação.
      </Text>

      {rgBackImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: rgBackImage.uri }} style={styles.previewImage} />
          <Text style={styles.imageLabel}>RG (verso) capturado ✓</Text>
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={() => takePhoto('rg_back')}>
        <Ionicons name="camera" size={24} color="white" style={styles.buttonIcon} />
        <Text style={styles.primaryButtonText}>
          {rgBackImage ? 'Fotografar Novamente' : 'Fotografar RG (Verso)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={processVerification}>
        <Text style={styles.skipButtonText}>Pular (Opcional)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}>
        <Ionicons name="arrow-back" size={24} color="#666" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessingStep = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color="#E91E63" style={styles.loader} />
      <Text style={styles.title}>Processando Verificação</Text>
      <Text style={styles.subtitle}>
        Estamos analisando suas informações. Isso pode levar alguns segundos...
      </Text>
      
      <View style={styles.processingSteps}>
        <Text style={styles.processingStep}>✓ Analisando selfie</Text>
        <Text style={styles.processingStep}>✓ Extraindo dados do RG</Text>
        <Text style={styles.processingStep}>⏳ Verificando identidade</Text>
      </View>
    </View>
  );

  const renderResultStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={verificationResult?.success ? "checkmark-circle" : "close-circle"} 
          size={80} 
          color={verificationResult?.success ? "#4CAF50" : "#F44336"} 
        />
      </View>
      
      <Text style={styles.title}>
        {verificationResult?.success ? 'Verificação Concluída!' : 'Verificação Falhou'}
      </Text>
      <Text style={styles.subtitle}>
        {verificationResult?.message}
      </Text>

      {verificationResult?.success ? (
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('Feed')}
        >
          <Text style={styles.primaryButtonText}>Ir para o Feed</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.primaryButton} onPress={resetVerification}>
          <Text style={styles.primaryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderIntroStep();
      case 2: return renderSelfieStep();
      case 3: return renderRgFrontStep();
      case 4: return renderRgBackStep();
      case 5: return renderProcessingStep();
      case 6: return renderResultStep();
      default: return renderIntroStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificação</Text>
        <View style={styles.headerRight}>
          {step > 1 && step < 5 && (
            <Text style={styles.stepIndicator}>{step - 1}/3</Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 24,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  stepsInfo: {
    width: '100%',
    marginBottom: 30,
  },
  stepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  privacyNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 10,
  },
  imageLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    minWidth: 200,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E91E63',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#E91E63',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 5,
  },
  loader: {
    marginBottom: 20,
  },
  processingSteps: {
    marginTop: 30,
  },
  processingStep: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default VerificationScreen;

