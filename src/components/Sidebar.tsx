'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { getAIConfig, AIConfig } from '@/lib/aiConfig';
import Logo from './Logo';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Building2,
  Smartphone,
  Settings,
  LogOut,
  BookOpen,
  UserPlus,
  Package,
  Megaphone,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin_master', 'admin_company', 'atendente'],
  },
  {
    label: 'Conversas',
    href: '/dashboard/conversations',
    icon: MessageSquare,
    roles: ['admin_master', 'admin_company', 'atendente'],
  },
  {
    label: 'Instâncias',
    href: '/dashboard/instances',
    icon: Smartphone,
    roles: ['admin_master', 'admin_company'],
  },
  {
    label: 'Usuários',
    href: '/dashboard/users',
    icon: Users,
    roles: ['admin_master', 'admin_company'],
  },
  {
    label: 'Clientes',
    href: '/dashboard/clients',
    icon: UserPlus,
    roles: ['admin_master', 'admin_company'],
  },
  {
    label: 'Produtos',
    href: '/dashboard/products',
    icon: Package,
    roles: ['admin_master', 'admin_company'],
  },
  {
    label: 'Campanhas',
    href: '/dashboard/campaigns',
    icon: Megaphone,
    roles: ['admin_master', 'admin_company'],
  },
  {
    label: 'Empresas',
    href: '/dashboard/companies',
    icon: Building2,
    roles: ['admin_master'],
  },
  {
    label: 'Base de Conhecimento',
    href: '/dashboard/knowledge-base',
    icon: BookOpen,
    roles: ['admin_master', 'admin_company'],
  },
  {
    label: 'Configurações',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin_master', 'admin_company'],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);

  useEffect(() => {
    (async () => {
      const cfg = await getAIConfig();
      setAiConfig(cfg);
    })();
  }, []);

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-gray-800">
        <Logo width={100} height={40} variant="light" />
        <p className="text-xs text-gray-400 mt-2">{user?.name}</p>
        {aiConfig?.enabled && (
          <div className="mt-2 inline-flex items-center space-x-2 px-2 py-1 rounded bg-primary-700 text-xs">
            <span>🤖</span>
            <span>{aiConfig.model}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full transition-colors"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
