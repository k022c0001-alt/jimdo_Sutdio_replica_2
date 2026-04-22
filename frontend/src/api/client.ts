import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; tenantName: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Pages
export const pagesApi = {
  list: () => api.get('/pages'),
  get: (id: string) => api.get(`/pages/${id}`),
  create: (data: any) => api.post('/pages', data),
  update: (id: string, data: any) => api.put(`/pages/${id}`, data),
  delete: (id: string) => api.delete(`/pages/${id}`),
  saveComponents: (pageId: string, components: any[]) =>
    api.put(`/pages/${pageId}/components`, { components }),
};

// Backoffice
export const backofficeApi = {
  getEmployees: () => api.get('/backoffice/hr/employees'),
  createEmployee: (data: any) => api.post('/backoffice/hr/employees', data),
  updateEmployee: (id: string, data: any) => api.put(`/backoffice/hr/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/backoffice/hr/employees/${id}`),
  getBudgets: () => api.get('/backoffice/finance/budgets'),
  createBudget: (data: any) => api.post('/backoffice/finance/budgets', data),
  getExpenses: () => api.get('/backoffice/finance/expenses'),
  createExpense: (data: any) => api.post('/backoffice/finance/expenses', data),
  approveExpense: (id: string) => api.patch(`/backoffice/finance/expenses/${id}/approve`),
  getStats: () => api.get('/backoffice/stats'),
};

// Front office
export const frontofficeApi = {
  getCustomers: (params?: any) => api.get('/frontoffice/crm/customers', { params }),
  createCustomer: (data: any) => api.post('/frontoffice/crm/customers', data),
  updateCustomer: (id: string, data: any) => api.put(`/frontoffice/crm/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/frontoffice/crm/customers/${id}`),
  getDeals: () => api.get('/frontoffice/crm/deals'),
  createDeal: (data: any) => api.post('/frontoffice/crm/deals', data),
  updateDeal: (id: string, data: any) => api.put(`/frontoffice/crm/deals/${id}`, data),
  getPipeline: () => api.get('/frontoffice/crm/pipeline'),
};

// Supply chain
export const supplyChainApi = {
  getInventory: (params?: any) => api.get('/supplychain/inventory', { params }),
  createItem: (data: any) => api.post('/supplychain/inventory', data),
  updateItem: (id: string, data: any) => api.put(`/supplychain/inventory/${id}`, data),
  deleteItem: (id: string) => api.delete(`/supplychain/inventory/${id}`),
  getStats: () => api.get('/supplychain/inventory/stats'),
  getLowStock: () => api.get('/supplychain/inventory/alerts/low-stock'),
};

// Operations
export const operationsApi = {
  getTasks: (params?: any) => api.get('/operations/tasks', { params }),
  createTask: (data: any) => api.post('/operations/tasks', data),
  updateTask: (id: string, data: any) => api.put(`/operations/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/operations/tasks/${id}`),
  getTaskStats: () => api.get('/operations/tasks/stats'),
};

// Governance
export const governanceApi = {
  getAuditLogs: (params?: any) => api.get('/governance/audit-logs', { params }),
  getUsers: () => api.get('/governance/users'),
  updateUserRole: (id: string, role: string) => api.patch(`/governance/users/${id}/role`, { role }),
  toggleUser: (id: string) => api.patch(`/governance/users/${id}/toggle`),
  getAnalyticsOverview: () => api.get('/governance/analytics/overview'),
  getEsgMetrics: () => api.get('/governance/esg/metrics'),
};

// Plugins
export const pluginsApi = {
  list: () => api.get('/plugins'),
  install: (data: any) => api.post('/plugins', data),
  toggle: (id: string) => api.patch(`/plugins/${id}/toggle`),
  remove: (id: string) => api.delete(`/plugins/${id}`),
};
