export interface User {
  id: number;
  company_id: number;
  name: string;
  email: string;
  role: 'admin_master' | 'admin_company' | 'admin' | 'gerente' | 'atendente';
  active: boolean;
  avatar?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  name: string;
  email: string;
  phone?: string;
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  max_instances: number;
  max_users: number;
  billing_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppInstance {
  id: number;
  company_id: number;
  instance_name: string;
  phone?: string;
  evolution_url: string;
  evolution_token: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrcode?: string;
  last_connected_at?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  company_id: number;
  whatsapp: string;
  name?: string;
  email?: string;
  tags?: string[];
  notes?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  company_id: number;
  contact_id: number;
  instance_id: number;
  assigned_user_id?: number;
  status: 'waiting' | 'ai' | 'human' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  started_at: string;
  last_message_at: string;
  closed_at?: string;
  closed_by_user_id?: number;
  rating?: number;
  rating_comment?: string;
  contact?: Contact;
  instance?: WhatsAppInstance;
  assigned_user?: User;
}

export interface Message {
  id: number;
  conversation_id: number;
  from_me: boolean;
  sender_id?: number;
  message: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
  media_url?: string;
  is_ai_response: boolean;
  read_at?: string;
  created_at: string;
  sender?: User;
}

export interface DashboardStats {
  active_conversations: number;
  total_contacts: number;
  total_instances: number;
  avg_response_time: number;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  message?: string;
}
