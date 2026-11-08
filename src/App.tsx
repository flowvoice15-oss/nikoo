/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, TabType } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ReceiptModal } from './components/ReceiptModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { TableManagementView } from './views/TableManagementView';
import { POSView } from './views/POSView';
import { KitchenView } from './views/KitchenView';
import { MenuView } from './views/MenuView';
import { CRMView } from './views/CRMView';
import { ReservationsView } from './views/ReservationsView';
import { InventoryView } from './views/InventoryView';
import { SalesView } from './views/SalesView';
import { FinanceView } from './views/FinanceView';
import { StaffView } from './views/StaffView';
import { AIAgentView } from './views/AIAgentView';
import { SettingsView } from './views/SettingsView';

import { getStoredToken, getStoredUser, clearStoredAuth, api } from './services/api';
import { User, Order, CafeTable, CafeSettings } from './types/cafe';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Security modals
  const [isMandatoryPasswordChange, setIsMandatoryPasswordChange] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Shared Receipt Modal
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [cafeSettings, setCafeSettings] = useState<CafeSettings>({
    cafeName: 'نیکو کافه (NIKO CAFE)',
    cafeAddress: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۴',
    cafePhone: '021-88776655',
    workingHours: 'همه روزه از ساعت ۰۸:۰۰ صبح تا ۲۳:۳۰ شب',
    taxRatePercent: 0,
    serviceFeePercent: 0,
    loyaltyPointPerToman: 10000,
    loyaltyPointValueToman: 500,
    receiptFooterMessage: 'از حضور شما در نیکو کافه سپاسگزاریم. لحظاتتان پر از عطر خوش قهوه!',
  });

  // Table Pre-selection for POS
  const [selectedPOSTable, setSelectedPOSTable] = useState<CafeTable | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      setCurrentUser(storedUser);
      if (storedUser.mustChangePassword) {
        setIsMandatoryPasswordChange(true);
        setShowPasswordModal(true);
      }
      // Fetch latest profile & settings
      api
        .getMe()
        .then((u) => {
          setCurrentUser(u);
          if (u.mustChangePassword) {
            setIsMandatoryPasswordChange(true);
            setShowPasswordModal(true);
          }
        })
        .catch(() => {
          clearStoredAuth();
          setCurrentUser(null);
        });

      api
        .getSettings()
        .then(setCafeSettings)
        .catch(() => {});
    }
  }, []);

  const handleLoginSuccess = (user: User, mustChangePassword: boolean) => {
    setCurrentUser(user);
    if (mustChangePassword) {
      setIsMandatoryPasswordChange(true);
      setShowPasswordModal(true);
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleOpenPOSForTable = (table: CafeTable) => {
    setSelectedPOSTable(table);
    setActiveTab('pos');
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C1810] flex" dir="rtl">
      {/* Sidebar (Desktop fixed right, mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-64 transition-all">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          currentUser={currentUser}
          onOpenPasswordModal={() => {
            setIsMandatoryPasswordChange(false);
            setShowPasswordModal(true);
          }}
          onQuickAction={(tab) => {
            setSelectedPOSTable(null);
            setActiveTab(tab);
          }}
        />

        {/* Dynamic View Router */}
        <main className="flex-1 pb-12">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenReceipt={(order) => setActiveReceiptOrder(order)}
            />
          )}

          {activeTab === 'tables' && (
            <TableManagementView
              onOpenPOSForTable={handleOpenPOSForTable}
              onOpenReceipt={(order) => setActiveReceiptOrder(order)}
            />
          )}

          {activeTab === 'pos' && (
            <POSView
              initialTable={selectedPOSTable}
              onOpenReceipt={(order) => setActiveReceiptOrder(order)}
              onClearInitialTable={() => setSelectedPOSTable(null)}
            />
          )}

          {activeTab === 'kitchen' && <KitchenView />}

          {activeTab === 'menu' && <MenuView />}

          {activeTab === 'customers' && <CRMView />}

          {activeTab === 'reservations' && <ReservationsView />}

          {activeTab === 'inventory' && <InventoryView />}

          {activeTab === 'sales' && (
            <SalesView onOpenReceipt={(order) => setActiveReceiptOrder(order)} />
          )}

          {activeTab === 'finance' && <FinanceView />}

          {activeTab === 'staff' && <StaffView />}

          {activeTab === 'ai' && <AIAgentView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Official Cafe Thermal Receipt Modal */}
      <ReceiptModal
        order={activeReceiptOrder}
        settings={cafeSettings}
        isOpen={Boolean(activeReceiptOrder)}
        onClose={() => setActiveReceiptOrder(null)}
      />

      {/* Change Password Modal (Mandatory or Profile) */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        isMandatory={isMandatoryPasswordChange}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setIsMandatoryPasswordChange(false);
          if (currentUser) {
            setCurrentUser({ ...currentUser, mustChangePassword: false });
          }
          alert('رمز عبور شما با موفقیت به‌روزرسانی گردید.');
        }}
      />
    </div>
  );
}
