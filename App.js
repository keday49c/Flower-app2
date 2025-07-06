import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  SafeAreaView,
  StatusBar,
  FlatList,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import VerificationScreen from './screens/VerificationScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// API Configuration
const API_BASE = 'https://5001-irl1xom9jo769f8lnpaqa-7f2f4372.manusvm.computer';

// API Service
const api = {
  async request(endpoint, options = {}) {
    const token = await AsyncStorage.getItem('flower_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na requisição');
    }

    return response.json();
  },

  auth: {
    login: (data) => api.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    register: (data) => api.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    verify: () => api.request('/api/auth/verify')
  },

  posts: {
    getAll: (page = 1) => api.request(`/api/posts?page=${page}`),
    create: (data) => api.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    like: (id) => api.request(`/api/posts/${id}/like`, { method: 'POST' }),
    getComments: (id) => api.request(`/api/posts/${id}/comments`),
    addComment: (id, data) => api.request(`/api/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  groups: {
    getAll: () => api.request('/api/groups'),
    getMy: () => api.request('/api/my-groups'),
    join: (id) => api.request(`/api/groups/${id}/join`, { method: 'POST' })
  },

  messages: {
    getConversations: () => api.request('/api/messages'),
    getWithUser: (userId) => api.request(`/api/messages/${userId}`),
    send: (data) => api.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getUnreadCount: () => api.request('/api/messages/unread-count')
  }
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #FF69B4, #800080)',
    color: '#FF69B4',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  authCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#FF69B4',
  },
  authSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF69B4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#FF69B4',
    textAlign: 'center',
    fontSize: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF69B4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  postAuthor: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111827',
  },
  postUsername: {
    color: '#6b7280',
    fontSize: 14,
  },
  postContent: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 24,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    marginLeft: 4,
    color: '#6b7280',
    fontSize: 14,
  },
  createPost: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  createPostInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createPostButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  publishButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  publishButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF69B4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  groupMembers: {
    fontSize: 14,
    color: '#6b7280',
  },
  groupDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  joinButton: {
    backgroundColor: '#FF69B4',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF69B4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileContainer: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF69B4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  profileBio: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

// Components
const Header = ({ title, user, onLogout, unreadCount }) => (
  <View style={styles.header}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginRight: 8 }}>🌸</Text>
      <Text style={styles.headerTitle}>{title || 'Flower'}</Text>
    </View>
    {user && (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
        <TouchableOpacity onPress={onLogout} style={{ marginLeft: 12 }}>
          <Ionicons name="log-out-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const LoginScreen = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.login(formData);
      await AsyncStorage.setItem('flower_token', response.token);
      onLogin(response.user);
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <View style={styles.authCard}>
        <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>🌸</Text>
        <Text style={styles.authTitle}>Bem-vinda de volta!</Text>
        <Text style={styles.authSubtitle}>Entre na sua conta Flower</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nome de usuário"
          value={formData.username}
          onChangeText={(text) => setFormData({...formData, username: text})}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={formData.password}
          onChangeText={(text) => setFormData({...formData, password: text})}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.5 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onSwitchToRegister}>
          <Text style={styles.linkText}>
            Não tem uma conta? Cadastre-se
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const RegisterScreen = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.register(formData);
      await AsyncStorage.setItem('flower_token', response.token);
      onRegister(response.user);
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <ScrollView>
        <View style={styles.authCard}>
          <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>🌸</Text>
          <Text style={styles.authTitle}>Junte-se ao Flower</Text>
          <Text style={styles.authSubtitle}>Um Espaço Seguro para Mulheres Florescerem</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={formData.full_name}
            onChangeText={(text) => setFormData({...formData, full_name: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Nome de usuário"
            value={formData.username}
            onChangeText={(text) => setFormData({...formData, username: text})}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
            secureTextEntry
          />
          
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Bio (opcional)"
            value={formData.bio}
            onChangeText={(text) => setFormData({...formData, bio: text})}
            multiline
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.5 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onSwitchToLogin}>
            <Text style={styles.linkText}>
              Já tem uma conta? Entrar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const response = await api.posts.create({ content });
      setContent('');
      onPostCreated(response.post);
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Aqui você pode implementar o upload da imagem
      Alert.alert('Info', 'Funcionalidade de imagem será implementada em breve!');
    }
  };

  return (
    <View style={styles.createPost}>
      <TextInput
        style={styles.createPostInput}
        placeholder="O que você está pensando?"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <View style={styles.createPostActions}>
        <View style={styles.createPostButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
            <Ionicons name="camera-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="happy-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.publishButton, (!content.trim() || loading) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={!content.trim() || loading}
        >
          <Text style={styles.publishButtonText}>
            {loading ? 'Publicando...' : 'Publicar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PostCard = ({ post, onLike }) => {
  const handleLike = async () => {
    try {
      await onLike(post.id);
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.author?.full_name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View>
          <Text style={styles.postAuthor}>{post.author?.full_name || 'Usuária'}</Text>
          <Text style={styles.postUsername}>@{post.author?.username || 'usuario'}</Text>
        </View>
      </View>
      
      <Text style={styles.postContent}>{post.content}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons name="heart-outline" size={20} color="#6b7280" />
          <Text style={styles.actionText}>{post.likes_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text style={styles.actionText}>{post.comments_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FeedScreen = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await api.posts.getAll();
      setPosts(response.posts);
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.posts.like(postId);
      loadPosts(); // Recarrega para atualizar os likes
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🌸</Text>
        <Text style={{ fontSize: 18, color: '#6b7280' }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<CreatePost onPostCreated={handlePostCreated} />}
        renderItem={({ item }) => <PostCard post={item} onLike={handleLike} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🌸</Text>
            <Text style={styles.emptyStateTitle}>Nenhum post ainda</Text>
            <Text style={styles.emptyStateText}>Seja a primeira a compartilhar algo!</Text>
          </View>
        }
      />
    </View>
  );
};

const GroupCard = ({ group, onJoin }) => (
  <View style={styles.groupCard}>
    <View style={styles.groupHeader}>
      <View style={styles.groupIcon}>
        <Text style={{ color: '#fff', fontSize: 20 }}>👥</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupMembers}>{group.members_count} membros</Text>
      </View>
    </View>
    <Text style={styles.groupDescription}>{group.description}</Text>
    <TouchableOpacity style={styles.joinButton} onPress={() => onJoin(group.id)}>
      <Text style={styles.joinButtonText}>Participar</Text>
    </TouchableOpacity>
  </View>
);

const GroupsScreen = () => {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('explore');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
    loadMyGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await api.groups.getAll();
      setGroups(response.groups);
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMyGroups = async () => {
    try {
      const response = await api.groups.getMy();
      setMyGroups(response.groups);
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await api.groups.join(groupId);
      loadGroups();
      loadMyGroups();
      Alert.alert('Sucesso', 'Você entrou no grupo!');
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
        <Text style={{ fontSize: 18, color: '#6b7280' }}>Carregando grupos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 16,
            alignItems: 'center',
            borderBottomWidth: activeTab === 'explore' ? 2 : 0,
            borderBottomColor: '#FF69B4'
          }}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={{ color: activeTab === 'explore' ? '#FF69B4' : '#6b7280', fontWeight: '600' }}>
            Explorar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 16,
            alignItems: 'center',
            borderBottomWidth: activeTab === 'my' ? 2 : 0,
            borderBottomColor: '#FF69B4'
          }}
          onPress={() => setActiveTab('my')}
        >
          <Text style={{ color: activeTab === 'my' ? '#FF69B4' : '#6b7280', fontWeight: '600' }}>
            Meus Grupos ({myGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'explore' ? groups : myGroups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <GroupCard 
            group={item} 
            onJoin={handleJoinGroup}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateTitle}>
              {activeTab === 'explore' ? 'Nenhum grupo disponível' : 'Nenhum grupo ainda'}
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'explore' 
                ? 'Novos grupos serão adicionados em breve!' 
                : 'Explore e participe de grupos que interessam você!'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

const MessagesScreen = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await api.messages.getConversations();
      setConversations(response.conversations);
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
        <Text style={{ fontSize: 18, color: '#6b7280' }}>Carregando mensagens...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.user.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.conversationItem}>
            <View style={styles.conversationAvatar}>
              <Text style={styles.avatarText}>
                {item.user.full_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.conversationInfo}>
              <Text style={styles.conversationName}>{item.user.full_name}</Text>
              <Text style={styles.conversationLastMessage} numberOfLines={1}>
                {item.last_message.content}
              </Text>
            </View>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💬</Text>
            <Text style={styles.emptyStateTitle}>Nenhuma conversa ainda</Text>
            <Text style={styles.emptyStateText}>Suas conversas aparecerão aqui</Text>
          </View>
        }
      />
    </View>
  );
};

const ProfileScreen = ({ user, onLogout }) => (
  <ScrollView style={styles.container}>
    <View style={styles.profileContainer}>
      <View style={styles.profileAvatar}>
        <Text style={styles.profileAvatarText}>
          {user.full_name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.profileName}>{user.full_name}</Text>
      <Text style={styles.profileUsername}>@{user.username}</Text>
      <Text style={styles.profileEmail}>{user.email}</Text>
      
      {user.bio && (
        <Text style={styles.profileBio}>{user.bio}</Text>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>0</Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Posts</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>0</Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Seguidoras</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>0</Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Seguindo</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const MainTabs = ({ user, onLogout, unreadCount }) => {
  const Stack = createStackNavigator();
  
  const TabNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Groups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Feed" 
        options={{ tabBarLabel: 'Feed' }}
      >
        {() => <FeedScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Groups" 
        component={GroupsScreen}
        options={{ tabBarLabel: 'Grupos' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{ 
          tabBarLabel: 'Mensagens',
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
        }}
      />
      <Tab.Screen 
        name="Profile"
        options={{ tabBarLabel: 'Perfil' }}
      >
        {() => <ProfileScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
    </Stack.Navigator>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState('login');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('flower_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.auth.verify();
      setUser(response.user);
    } catch (err) {
      await AsyncStorage.removeItem('flower_token');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.messages.getUnreadCount();
      setUnreadCount(response.unread_count);
    } catch (err) {
      console.error('Erro ao carregar contagem de mensagens:', err);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('flower_token');
    setUser(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🌸</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF69B4' }}>Flower</Text>
        <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 8 }}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        {authView === 'login' ? (
          <LoginScreen 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setAuthView('register')} 
          />
        ) : (
          <RegisterScreen 
            onRegister={handleLogin} 
            onSwitchToLogin={() => setAuthView('login')} 
          />
        )}
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header 
        user={user} 
        onLogout={handleLogout} 
        unreadCount={unreadCount}
      />
      <MainTabs 
        user={user} 
        onLogout={handleLogout} 
        unreadCount={unreadCount}
      />
    </NavigationContainer>
  );
}

