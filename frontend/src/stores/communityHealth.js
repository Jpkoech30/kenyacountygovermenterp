import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '../api/axios';

export const useCommunityHealthStore = defineStore('communityHealth', () => {
  // ── State ────────────────────────────────────────────────────
  const loading = ref(false);
  const error = ref(null);

  // Dashboard
  const dashboardMetrics = ref(null);

  // Community Units
  const communityUnits = ref([]);
  const communityUnitsPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const currentCommunityUnit = ref(null);

  // Committees
  const committeeMembers = ref([]);

  // CHAs
  const assistants = ref([]);
  const assistantsPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // CHVs
  const volunteers = ref([]);
  const volunteersPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // Households
  const households = ref([]);
  const householdsPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const currentHousehold = ref(null);

  // Household Members
  const householdMembers = ref([]);

  // Visits
  const visits = ref([]);
  const visitsPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // Dialogues
  const dialogues = ref([]);
  const dialoguesPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // Action Days
  const actionDays = ref([]);
  const actionDaysPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // Kits
  const kits = ref([]);

  // Supply Requests
  const supplyRequests = ref([]);
  const supplyRequestsPagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // CHV-specific
  const chvDashboard = ref(null);
  const chvHouseholds = ref([]);
  const chvVisits = ref([]);

  // ── Helpers ──────────────────────────────────────────────────
  function handleError(err) {
    error.value = err.response?.data?.message || err.message || 'An error occurred';
    console.error('Community Health Store Error:', error.value);
    throw err;
  }

  // ── Dashboard ────────────────────────────────────────────────
  async function fetchDashboardMetrics() {
    loading.value = true;
    try {
      const res = await api.get('/health/community/dashboard');
      dashboardMetrics.value = res.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Community Units ──────────────────────────────────────────
  async function fetchCommunityUnits(params = {}) {
    loading.value = true;
    try {
      const res = await api.get('/health/community/units', { params });
      communityUnits.value = res.data.units;
      communityUnitsPagination.value = res.data.pagination;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createCommunityUnit(data) {
    loading.value = true;
    try {
      const res = await api.post('/health/community/units', data);
      communityUnits.value.unshift(res.data.unit);
      return res.data.unit;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCommunityUnit(id) {
    loading.value = true;
    try {
      const res = await api.get(`/health/community/units/${id}`);
      currentCommunityUnit.value = res.data.unit;
      return res.data.unit;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateCommunityUnit(id, data) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/units/${id}`, data);
      const idx = communityUnits.value.findIndex((u) => u.id === id);
      if (idx !== -1) communityUnits.value[idx] = res.data.unit;
      if (currentCommunityUnit.value?.id === id) currentCommunityUnit.value = res.data.unit;
      return res.data.unit;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function deleteCommunityUnit(id) {
    loading.value = true;
    try {
      await api.delete(`/health/community/units/${id}`);
      communityUnits.value = communityUnits.value.filter((u) => u.id !== id);
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Committee Members ───────────────────────────────────────
  async function fetchCommitteeMembers(unitId) {
    loading.value = true;
    try {
      const res = await api.get(`/health/community/units/${unitId}/committee`);
      committeeMembers.value = res.data.committee;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function addCommitteeMember(unitId, data) {
    loading.value = true;
    try {
      const res = await api.post(`/health/community/units/${unitId}/committee`, data);
      committeeMembers.value.push(res.data.member);
      return res.data.member;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateCommitteeMember(id, data) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/committee/${id}`, data);
      const idx = committeeMembers.value.findIndex((m) => m.id === id);
      if (idx !== -1) committeeMembers.value[idx] = res.data.member;
      return res.data.member;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function removeCommitteeMember(id) {
    loading.value = true;
    try {
      await api.delete(`/health/community/committee/${id}`);
      committeeMembers.value = committeeMembers.value.filter((m) => m.id !== id);
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── CHAs (Community Health Assistants) ──────────────────────
  async function fetchAssistants(params = {}) {
    loading.value = true;
    try {
      const res = await api.get('/health/community/assistants', { params });
      assistants.value = res.data.assistants;
      assistantsPagination.value = res.data.pagination;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createAssistant(data) {
    loading.value = true;
    try {
      const res = await api.post('/health/community/assistants', data);
      assistants.value.unshift(res.data.assistant);
      return res.data.assistant;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateAssistant(id, data) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/assistants/${id}`, data);
      const idx = assistants.value.findIndex((a) => a.id === id);
      if (idx !== -1) assistants.value[idx] = res.data.assistant;
      return res.data.assistant;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function deleteAssistant(id) {
    loading.value = true;
    try {
      await api.delete(`/health/community/assistants/${id}`);
      assistants.value = assistants.value.filter((a) => a.id !== id);
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── CHVs (Community Health Volunteers) ──────────────────────
  async function fetchVolunteers(params = {}) {
    loading.value = true;
    try {
      const res = await api.get('/health/community/volunteers', { params });
      volunteers.value = res.data.volunteers;
      volunteersPagination.value = res.data.pagination;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createVolunteer(data) {
    loading.value = true;
    try {
      const res = await api.post('/health/community/volunteers', data);
      volunteers.value.unshift(res.data.volunteer);
      return res.data.volunteer;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateVolunteer(id, data) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/volunteers/${id}`, data);
      const idx = volunteers.value.findIndex((v) => v.id === id);
      if (idx !== -1) volunteers.value[idx] = res.data.volunteer;
      return res.data.volunteer;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function deleteVolunteer(id) {
    loading.value = true;
    try {
      await api.delete(`/health/community/volunteers/${id}`);
      volunteers.value = volunteers.value.filter((v) => v.id !== id);
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Households ──────────────────────────────────────────────
  async function fetchHouseholds(params = {}) {
    loading.value = true;
    try {
      const res = await api.get('/health/community/households', { params });
      households.value = res.data.households;
      householdsPagination.value = res.data.pagination;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createHousehold(data) {
    loading.value = true;
    try {
      const res = await api.post('/health/community/households', data);
      households.value.unshift(res.data.household);
      return res.data.household;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchHousehold(id) {
    loading.value = true;
    try {
      const res = await api.get(`/health/community/households/${id}`);
      currentHousehold.value = res.data.household;
      return res.data.household;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateHousehold(id, data) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/households/${id}`, data);
      const idx = households.value.findIndex((h) => h.id === id);
      if (idx !== -1) households.value[idx] = res.data.household;
      if (currentHousehold.value?.id === id) currentHousehold.value = res.data.household;
      return res.data.household;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function deleteHousehold(id) {
    loading.value = true;
    try {
      await api.delete(`/health/community/households/${id}`);
      households.value = households.value.filter((h) => h.id !== id);
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Household Members ───────────────────────────────────────
  async function fetchHouseholdMembers(householdId) {
    loading.value = true;
    try {
      const res = await api.get(`/health/community/households/${householdId}/members`);
      householdMembers.value = res.data.members;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function addHouseholdMember(householdId, data) {
    loading.value = true;
    try {
      const res = await api.post(`/health/community/households/${householdId}/members`, data);
      householdMembers.value.push(res.data.member);
      return res.data.member;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateHouseholdMember(id, data) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/members/${id}`, data);
      const idx = householdMembers.value.findIndex((m) => m.id === id);
      if (idx !== -1) householdMembers.value[idx] = res.data.member;
      return res.data.member;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function removeHouseholdMember(id) {
    loading.value = true;
    try {
      await api.delete(`/health/community/members/${id}`);
      householdMembers.value = householdMembers.value.filter((m) => m.id !== id);
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Household Visits ────────────────────────────────────────
  async function fetchVisits(params = {}) {
    loading.value = true;
    try {
      const res = await api.get('/health/community/visits', { params });
      visits.value = res.data.visits;
      visitsPagination.value = res.data.pagination;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function recordVisit(data) {
    loading.value = true;
    try {
      const res = await api.post('/health/community/visits', data);
      visits.value.unshift(res.data.visit);
      return res.data.visit;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateVisit(id, data) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/visits/${id}`, data);
      const idx = visits.value.findIndex((v) => v.id === id);
      if (idx !== -1) visits.value[idx] = res.data.visit;
      return res.data.visit;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Community Dialogues ─────────────────────────────────────
  async function fetchDialogues(params = {}) {
    loading.value = true;
    try {
      const res = await api.get('/health/community/dialogues', { params });
      dialogues.value = res.data.dialogues;
      dialoguesPagination.value = res.data.pagination;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createDialogue(data) {
    loading.value = true;
    try {
      const res = await api.post('/health/community/dialogues', data);
      dialogues.value.unshift(res.data.dialogue);
      return res.data.dialogue;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateDialogue(id, data) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/dialogues/${id}`, data);
      const idx = dialogues.value.findIndex((d) => d.id === id);
      if (idx !== -1) dialogues.value[idx] = res.data.dialogue;
      return res.data.dialogue;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function deleteDialogue(id) {
    loading.value = true;
    try {
      await api.delete(`/health/community/dialogues/${id}`);
      dialogues.value = dialogues.value.filter((d) => d.id !== id);
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Community Action Days ───────────────────────────────────
  async function fetchActionDays(params = {}) {
    loading.value = true;
    try {
      const res = await api.get('/health/community/action-days', { params });
      actionDays.value = res.data.actionDays;
      actionDaysPagination.value = res.data.pagination;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createActionDay(data) {
    loading.value = true;
    try {
      const res = await api.post('/health/community/action-days', data);
      actionDays.value.unshift(res.data.actionDay);
      return res.data.actionDay;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateActionDay(id, data) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/action-days/${id}`, data);
      const idx = actionDays.value.findIndex((d) => d.id === id);
      if (idx !== -1) actionDays.value[idx] = res.data.actionDay;
      return res.data.actionDay;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function deleteActionDay(id) {
    loading.value = true;
    try {
      await api.delete(`/health/community/action-days/${id}`);
      actionDays.value = actionDays.value.filter((d) => d.id !== id);
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── CHV Kits ────────────────────────────────────────────────
  async function fetchKits() {
    loading.value = true;
    try {
      const res = await api.get('/health/community/kits');
      kits.value = res.data.kits;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createKit(data) {
    loading.value = true;
    try {
      const res = await api.post('/health/community/kits', data);
      kits.value.push(res.data.kit);
      return res.data.kit;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateKit(id, data) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/kits/${id}`, data);
      const idx = kits.value.findIndex((k) => k.id === id);
      if (idx !== -1) kits.value[idx] = res.data.kit;
      return res.data.kit;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Supply Requests ─────────────────────────────────────────
  async function fetchSupplyRequests(params = {}) {
    loading.value = true;
    try {
      const res = await api.get('/health/community/supply-requests', { params });
      supplyRequests.value = res.data.supplyRequests;
      supplyRequestsPagination.value = res.data.pagination;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function createSupplyRequest(data) {
    loading.value = true;
    try {
      const res = await api.post('/health/community/supply-requests', data);
      supplyRequests.value.unshift(res.data.supplyRequest);
      return res.data.supplyRequest;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function approveSupplyRequest(id) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/supply-requests/${id}/approve`);
      const idx = supplyRequests.value.findIndex((r) => r.id === id);
      if (idx !== -1) supplyRequests.value[idx] = res.data.supplyRequest;
      return res.data.supplyRequest;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fulfillSupplyRequest(id) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/supply-requests/${id}/fulfill`);
      const idx = supplyRequests.value.findIndex((r) => r.id === id);
      if (idx !== -1) supplyRequests.value[idx] = res.data.supplyRequest;
      return res.data.supplyRequest;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function rejectSupplyRequest(id) {
    loading.value = true;
    try {
      const res = await api.put(`/health/community/supply-requests/${id}/reject`);
      const idx = supplyRequests.value.findIndex((r) => r.id === id);
      if (idx !== -1) supplyRequests.value[idx] = res.data.supplyRequest;
      return res.data.supplyRequest;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── CHV-specific ────────────────────────────────────────────
  async function fetchChvDashboard() {
    loading.value = true;
    try {
      const res = await api.get('/health/community/chv/dashboard');
      chvDashboard.value = res.data;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchChvHouseholds(params = {}) {
    loading.value = true;
    try {
      const res = await api.get('/health/community/chv/households', { params });
      chvHouseholds.value = res.data.households;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchChvVisits(params = {}) {
    loading.value = true;
    try {
      const res = await api.get('/health/community/chv/visits', { params });
      chvVisits.value = res.data.visits;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Exports ─────────────────────────────────────────────────
  return {
    loading,
    error,

    // Dashboard
    dashboardMetrics,
    fetchDashboardMetrics,

    // Community Units
    communityUnits,
    communityUnitsPagination,
    currentCommunityUnit,
    fetchCommunityUnits,
    createCommunityUnit,
    fetchCommunityUnit,
    updateCommunityUnit,
    deleteCommunityUnit,

    // Committees
    committeeMembers,
    fetchCommitteeMembers,
    addCommitteeMember,
    updateCommitteeMember,
    removeCommitteeMember,

    // CHAs
    assistants,
    assistantsPagination,
    fetchAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,

    // CHVs
    volunteers,
    volunteersPagination,
    fetchVolunteers,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,

    // Households
    households,
    householdsPagination,
    currentHousehold,
    fetchHouseholds,
    createHousehold,
    fetchHousehold,
    updateHousehold,
    deleteHousehold,

    // Household Members
    householdMembers,
    fetchHouseholdMembers,
    addHouseholdMember,
    updateHouseholdMember,
    removeHouseholdMember,

    // Visits
    visits,
    visitsPagination,
    fetchVisits,
    recordVisit,
    updateVisit,

    // Dialogues
    dialogues,
    dialoguesPagination,
    fetchDialogues,
    createDialogue,
    updateDialogue,
    deleteDialogue,

    // Action Days
    actionDays,
    actionDaysPagination,
    fetchActionDays,
    createActionDay,
    updateActionDay,
    deleteActionDay,

    // Kits
    kits,
    fetchKits,
    createKit,
    updateKit,

    // Supply Requests
    supplyRequests,
    supplyRequestsPagination,
    fetchSupplyRequests,
    createSupplyRequest,
    approveSupplyRequest,
    fulfillSupplyRequest,
    rejectSupplyRequest,

    // CHV-specific
    chvDashboard,
    chvHouseholds,
    chvVisits,
    fetchChvDashboard,
    fetchChvHouseholds,
    fetchChvVisits,
  };
});
