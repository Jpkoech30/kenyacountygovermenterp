import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '../api/axios';

export const useHealthStore = defineStore('health', () => {
  // ── State ────────────────────────────────────────────────────
  const loading = ref(false);
  const error = ref(null);

  // Inventory
  const inventoryItems = ref([]);
  const inventoryPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const stockAlerts = ref({ lowStockItems: [], expiringItems: [] });
  const suppliers = ref([]);

  // Patients
  const patients = ref([]);
  const patientsPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const currentPatient = ref(null);

  // Visits
  const visits = ref([]);
  const visitsPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // Appointments
  const appointments = ref([]);
  const appointmentsPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // Campaigns
  const campaigns = ref([]);
  const campaignsPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const campaignCoverage = ref(null);

  // Ambulance
  const ambulanceRequests = ref([]);
  const ambulancePagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // Dashboard
  const dashboardMetrics = ref(null);

  // ── Helpers ──────────────────────────────────────────────────
  function handleError(err) {
    error.value = err.response?.data?.message || err.message || 'An error occurred';
    console.error('Health Store Error:', error.value);
    throw err;
  }

  // ── Dashboard ────────────────────────────────────────────────
  async function fetchDashboardMetrics() {
    loading.value = true;
    try {
      const response = await api.get('/health/dashboard');
      dashboardMetrics.value = response.data;
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Inventory ────────────────────────────────────────────────
  async function fetchInventoryItems(params = {}) {
    loading.value = true;
    try {
      const response = await api.get('/health/inventory', { params });
      inventoryItems.value = response.data.items;
      inventoryPagination.value = response.data.pagination;
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createInventoryItem(data) {
    loading.value = true;
    try {
      const response = await api.post('/health/inventory/items', data);
      return response.data.item;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateInventoryItem(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/health/inventory/items/${id}`, data);
      return response.data.item;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function recordTransaction(data) {
    loading.value = true;
    try {
      const response = await api.post('/health/inventory/transactions', data);
      return response.data.transaction;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchStockAlerts() {
    loading.value = true;
    try {
      const response = await api.get('/health/inventory/stock-alerts');
      stockAlerts.value = response.data;
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Suppliers ────────────────────────────────────────────────
  async function fetchSuppliers() {
    try {
      const response = await api.get('/health/suppliers');
      suppliers.value = response.data.suppliers;
      return response.data.suppliers;
    } catch (err) {
      handleError(err);
    }
  }

  async function createSupplier(data) {
    try {
      const response = await api.post('/health/suppliers', data);
      return response.data.supplier;
    } catch (err) {
      handleError(err);
    }
  }

  // ── Patients ─────────────────────────────────────────────────
  async function fetchPatients(params = {}) {
    loading.value = true;
    try {
      const response = await api.get('/health/patients', { params });
      patients.value = response.data.patients;
      patientsPagination.value = response.data.pagination;
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function registerPatient(data) {
    loading.value = true;
    try {
      const response = await api.post('/health/patients', data);
      return response.data.patient;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchPatient(id) {
    loading.value = true;
    try {
      const response = await api.get(`/health/patients/${id}`);
      currentPatient.value = response.data.patient;
      return response.data.patient;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updatePatient(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/health/patients/${id}`, data);
      return response.data.patient;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Visits ───────────────────────────────────────────────────
  async function fetchVisits(params = {}) {
    loading.value = true;
    try {
      const response = await api.get('/health/visits', { params });
      visits.value = response.data.visits;
      visitsPagination.value = response.data.pagination;
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function recordVisit(data) {
    loading.value = true;
    try {
      const response = await api.post('/health/visits', data);
      return response.data.visit;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Appointments ─────────────────────────────────────────────
  async function fetchAppointments(params = {}) {
    loading.value = true;
    try {
      const response = await api.get('/health/appointments', { params });
      appointments.value = response.data.appointments;
      appointmentsPagination.value = response.data.pagination;
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createAppointment(data) {
    loading.value = true;
    try {
      const response = await api.post('/health/appointments', data);
      return response.data.appointment;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Campaigns ────────────────────────────────────────────────
  async function fetchCampaigns(params = {}) {
    loading.value = true;
    try {
      const response = await api.get('/health/campaigns', { params });
      campaigns.value = response.data.campaigns;
      campaignsPagination.value = response.data.pagination;
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createCampaign(data) {
    loading.value = true;
    try {
      const response = await api.post('/health/campaigns', data);
      return response.data.campaign;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCampaignCoverage(id) {
    loading.value = true;
    try {
      const response = await api.get(`/health/campaigns/${id}/coverage`);
      campaignCoverage.value = response.data;
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function addCampaignParticipant(campaignId, data) {
    loading.value = true;
    try {
      const response = await api.post(`/health/campaigns/${campaignId}/participants`, data);
      return response.data.participant;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Ambulance ────────────────────────────────────────────────
  async function fetchAmbulanceRequests(params = {}) {
    loading.value = true;
    try {
      const response = await api.get('/health/ambulance/requests', { params });
      ambulanceRequests.value = response.data.requests;
      ambulancePagination.value = response.data.pagination;
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function requestAmbulance(data) {
    loading.value = true;
    try {
      const response = await api.post('/health/ambulance/requests', data);
      return response.data.request;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateAmbulanceStatus(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/health/ambulance/requests/${id}/status`, data);
      return response.data.request;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    loading,
    error,
    inventoryItems,
    inventoryPagination,
    stockAlerts,
    suppliers,
    patients,
    patientsPagination,
    currentPatient,
    visits,
    visitsPagination,
    appointments,
    appointmentsPagination,
    campaigns,
    campaignsPagination,
    campaignCoverage,
    ambulanceRequests,
    ambulancePagination,
    dashboardMetrics,

    // Dashboard
    fetchDashboardMetrics,

    // Inventory
    fetchInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    recordTransaction,
    fetchStockAlerts,

    // Suppliers
    fetchSuppliers,
    createSupplier,

    // Patients
    fetchPatients,
    registerPatient,
    fetchPatient,
    updatePatient,

    // Visits
    fetchVisits,
    recordVisit,

    // Appointments
    fetchAppointments,
    createAppointment,

    // Campaigns
    fetchCampaigns,
    createCampaign,
    fetchCampaignCoverage,
    addCampaignParticipant,

    // Ambulance
    fetchAmbulanceRequests,
    requestAmbulance,
    updateAmbulanceStatus,
  };
});
