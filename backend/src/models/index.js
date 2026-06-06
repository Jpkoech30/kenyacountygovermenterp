/**
 * Model associations index.
 * Central place to define all relationships between models.
 */
const Role = require('./Role');
const Department = require('./Department');
const User = require('./User');

// CMS Models
const Content = require('./Content');
const ContentTranslation = require('./ContentTranslation');
const ContentMeta = require('./ContentMeta');
const ContentWorkflowLog = require('./ContentWorkflowLog');
const ContentVersion = require('./ContentVersion');
const Media = require('./Media');
const ContentMedia = require('./ContentMedia');
const Taxonomy = require('./Taxonomy');
const ContentTaxonomy = require('./ContentTaxonomy');
const Person = require('./Person');
const Fact = require('./Fact');
const HeroSlide = require('./HeroSlide');
const Setting = require('./Setting');
const LlmUsageLog = require('./LlmUsageLog');
const ContactMessage = require('./ContactMessage');
const NewsletterSubscriber = require('./NewsletterSubscriber');
const Menu = require('./Menu');
const MenuItem = require('./MenuItem');

// Community Health Extension Models
const HealthCommunityUnit = require('./HealthCommunityUnit');
const HealthCommunityCommittee = require('./HealthCommunityCommittee');
const HealthCommunityAssistant = require('./HealthCommunityAssistant');
const HealthCommunityVolunteer = require('./HealthCommunityVolunteer');
const HealthHousehold = require('./HealthHousehold');
const HealthHouseholdMember = require('./HealthHouseholdMember');
const HealthHouseholdVisit = require('./HealthHouseholdVisit');
const HealthCommunityDialogue = require('./HealthCommunityDialogue');
const HealthCommunityActionDay = require('./HealthCommunityActionDay');
const HealthChvKit = require('./HealthChvKit');
const HealthCommunitySupplyRequest = require('./HealthCommunitySupplyRequest');

// Revenue & Business Licensing Models
const PermitType = require('./PermitType');
const Permit = require('./Permit');
const Transaction = require('./Transaction');
const PermitAssignment = require('./PermitAssignment');
const CitizenRepresentation = require('./CitizenRepresentation');

// Human Capital Management (HR) Models
const Position = require('./Position');
const Employee = require('./Employee');
const EmploymentHistory = require('./EmploymentHistory');
const LeaveRequest = require('./LeaveRequest');
const LeaveBalance = require('./LeaveBalance');
const AttendanceLog = require('./AttendanceLog');
const RecruitmentVacancy = require('./RecruitmentVacancy');
const RecruitmentApplication = require('./RecruitmentApplication');
const PerformanceReview = require('./PerformanceReview');
const DisciplinaryCase = require('./DisciplinaryCase');
const VacancyRequest = require('./VacancyRequest');
const InterviewPanel = require('./InterviewPanel');
const PanelMember = require('./PanelMember');
const InterviewScore = require('./InterviewScore');
const AppointmentLetter = require('./AppointmentLetter');

// Health Facility Management Models
const HealthInventoryItem = require('./HealthInventoryItem');
const HealthInventoryTransaction = require('./HealthInventoryTransaction');
const HealthSupplier = require('./HealthSupplier');
const HealthPatient = require('./HealthPatient');
const HealthPatientVisit = require('./HealthPatientVisit');
const HealthAppointment = require('./HealthAppointment');
const HealthCampaign = require('./HealthCampaign');
const HealthCampaignParticipant = require('./HealthCampaignParticipant');
const HealthAmbulanceRequest = require('./HealthAmbulanceRequest');

// ============================================================
// Core User & Role Associations (existing)
// ============================================================

// User belongs to a Role
User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role',
});

// Role has many Users
Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users',
});

// User belongs to a Department (optional)
User.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});

// Department has many Users
Department.hasMany(User, {
  foreignKey: 'department_id',
  as: 'users',
});

// ============================================================
// CMS Content Associations
// ============================================================

// Content -> User (author)
Content.belongsTo(User, {
  foreignKey: 'author_id',
  as: 'author',
});
User.hasMany(Content, {
  foreignKey: 'author_id',
  as: 'authoredContent',
});

// Content -> User (reviewer)
Content.belongsTo(User, {
  foreignKey: 'reviewer_id',
  as: 'reviewer',
});

// Content -> User (publisher)
Content.belongsTo(User, {
  foreignKey: 'publisher_id',
  as: 'publisher',
});

// Content -> ContentTranslations
Content.hasMany(ContentTranslation, {
  foreignKey: 'content_id',
  as: 'translations',
  onDelete: 'CASCADE',
});
ContentTranslation.belongsTo(Content, {
  foreignKey: 'content_id',
  as: 'content',
});

// ContentTranslation -> Media (featured image)
ContentTranslation.belongsTo(Media, {
  foreignKey: 'featured_image_id',
  as: 'featuredImage',
});

// Content -> ContentMeta
Content.hasMany(ContentMeta, {
  foreignKey: 'content_id',
  as: 'meta',
  onDelete: 'CASCADE',
});
ContentMeta.belongsTo(Content, {
  foreignKey: 'content_id',
  as: 'content',
});

// Content -> ContentWorkflowLogs
Content.hasMany(ContentWorkflowLog, {
  foreignKey: 'content_id',
  as: 'workflowLogs',
  onDelete: 'CASCADE',
});
ContentWorkflowLog.belongsTo(Content, {
  foreignKey: 'content_id',
  as: 'content',
});

// ContentWorkflowLog -> User
ContentWorkflowLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Content -> ContentVersions
Content.hasMany(ContentVersion, {
  foreignKey: 'content_id',
  as: 'versions',
  onDelete: 'CASCADE',
});
ContentVersion.belongsTo(Content, {
  foreignKey: 'content_id',
  as: 'content',
});

// ContentVersion -> User
ContentVersion.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'createdBy',
});

// Content <-> Media (many-to-many via ContentMedia)
Content.belongsToMany(Media, {
  through: ContentMedia,
  foreignKey: 'content_id',
  otherKey: 'media_id',
  as: 'media',
});
Media.belongsToMany(Content, {
  through: ContentMedia,
  foreignKey: 'media_id',
  otherKey: 'content_id',
  as: 'content',
});

// ContentMedia
ContentMedia.belongsTo(Content, {
  foreignKey: 'content_id',
  as: 'content',
});
ContentMedia.belongsTo(Media, {
  foreignKey: 'media_id',
  as: 'media',
});

// Media -> User (uploader)
Media.belongsTo(User, {
  foreignKey: 'uploaded_by',
  as: 'uploadedBy',
});
User.hasMany(Media, {
  foreignKey: 'uploaded_by',
  as: 'uploadedMedia',
});

// Content <-> Taxonomy (many-to-many via ContentTaxonomy)
Content.belongsToMany(Taxonomy, {
  through: ContentTaxonomy,
  foreignKey: 'content_id',
  otherKey: 'taxonomy_id',
  as: 'taxonomies',
});
Taxonomy.belongsToMany(Content, {
  through: ContentTaxonomy,
  foreignKey: 'taxonomy_id',
  otherKey: 'content_id',
  as: 'content',
});

// ContentTaxonomy
ContentTaxonomy.belongsTo(Content, {
  foreignKey: 'content_id',
  as: 'content',
});
ContentTaxonomy.belongsTo(Taxonomy, {
  foreignKey: 'taxonomy_id',
  as: 'taxonomy',
});

// Taxonomy self-referencing (parent/children) - defined in Taxonomy.js

// Person -> Content (optional)
Person.belongsTo(Content, {
  foreignKey: 'content_id',
  as: 'content',
});
Content.hasOne(Person, {
  foreignKey: 'content_id',
  as: 'person',
});

// Person -> User (optional ERP login)
Person.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});
User.hasOne(Person, {
  foreignKey: 'user_id',
  as: 'profile',
});

// Person -> Media (photo)
Person.belongsTo(Media, {
  foreignKey: 'photo_id',
  as: 'photo',
});

// HeroSlide -> Media (image)
HeroSlide.belongsTo(Media, {
  foreignKey: 'image_id',
  as: 'image',
});
Media.hasMany(HeroSlide, {
  foreignKey: 'image_id',
  as: 'heroSlides',
});

// LlmUsageLog -> User
LlmUsageLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});
User.hasMany(LlmUsageLog, {
  foreignKey: 'user_id',
  as: 'llmUsageLogs',
});

// LlmUsageLog -> Content
LlmUsageLog.belongsTo(Content, {
  foreignKey: 'content_id',
  as: 'content',
});
Content.hasMany(LlmUsageLog, {
  foreignKey: 'content_id',
  as: 'llmUsageLogs',
});

// ============================================================
// Revenue & Business Licensing Associations
// ============================================================

// PermitType -> Permits
PermitType.hasMany(Permit, {
  foreignKey: 'permit_type_id',
  as: 'permits',
});
Permit.belongsTo(PermitType, {
  foreignKey: 'permit_type_id',
  as: 'permitType',
});

// Permit -> User (issued_by)
Permit.belongsTo(User, {
  foreignKey: 'issued_by',
  as: 'issuer',
});
User.hasMany(Permit, {
  foreignKey: 'issued_by',
  as: 'issuedPermits',
});

// Permit -> Transaction
Permit.hasMany(Transaction, {
  foreignKey: 'permit_id',
  as: 'transactions',
  onDelete: 'CASCADE',
});
Transaction.belongsTo(Permit, {
  foreignKey: 'permit_id',
  as: 'permit',
});

// Permit -> PermitAssignment
Permit.hasOne(PermitAssignment, {
  foreignKey: 'permit_id',
  as: 'assignment',
  onDelete: 'CASCADE',
});
PermitAssignment.belongsTo(Permit, {
  foreignKey: 'permit_id',
  as: 'permit',
});

// PermitAssignment -> User (clerk)
PermitAssignment.belongsTo(User, {
  foreignKey: 'clerk_user_id',
  as: 'clerk',
});
User.hasMany(PermitAssignment, {
  foreignKey: 'clerk_user_id',
  as: 'clerkAssignments',
});

// PermitAssignment -> User (assigned_by)
PermitAssignment.belongsTo(User, {
  foreignKey: 'assigned_by',
  as: 'assigner',
});

// CitizenRepresentation -> User (provider)
CitizenRepresentation.belongsTo(User, {
  foreignKey: 'provider_user_id',
  as: 'provider',
});
User.hasMany(CitizenRepresentation, {
  foreignKey: 'provider_user_id',
  as: 'representations',
});

// CitizenRepresentation -> Permit
CitizenRepresentation.belongsTo(Permit, {
  foreignKey: 'permit_id',
  as: 'permit',
});
Permit.hasOne(CitizenRepresentation, {
  foreignKey: 'permit_id',
  as: 'representation',
});

// Permit self-referencing for renewals
Permit.belongsTo(Permit, {
  foreignKey: 'renewed_from_id',
  as: 'renewedFrom',
});
Permit.hasOne(Permit, {
  foreignKey: 'renewed_from_id',
  as: 'renewedTo',
});

// ============================================================
// Human Capital Management (HR) Associations
// ============================================================

// Position -> Department
Position.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});
Department.hasMany(Position, {
  foreignKey: 'department_id',
  as: 'positions',
});

// Employee -> User (optional)
Employee.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});
User.hasOne(Employee, {
  foreignKey: 'user_id',
  as: 'employee',
});

// Employee -> Position
Employee.belongsTo(Position, {
  foreignKey: 'position_id',
  as: 'position',
});
Position.hasMany(Employee, {
  foreignKey: 'position_id',
  as: 'employees',
});

// Employee -> Department
Employee.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});
Department.hasMany(Employee, {
  foreignKey: 'department_id',
  as: 'employees',
});

// Employee self-referencing (supervisor)
Employee.belongsTo(Employee, {
  foreignKey: 'supervisor_id',
  as: 'supervisor',
});
Employee.hasMany(Employee, {
  foreignKey: 'supervisor_id',
  as: 'subordinates',
});

// Employee -> Media (profile photo)
Employee.belongsTo(Media, {
  foreignKey: 'profile_photo_id',
  as: 'profilePhoto',
});

// Employee -> EmploymentHistory
Employee.hasMany(EmploymentHistory, {
  foreignKey: 'employee_id',
  as: 'employmentHistory',
  onDelete: 'CASCADE',
});
EmploymentHistory.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee',
});

// EmploymentHistory -> Position
EmploymentHistory.belongsTo(Position, {
  foreignKey: 'position_id',
  as: 'position',
});

// EmploymentHistory -> Department
EmploymentHistory.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});

// EmploymentHistory -> Employee (supervisor at that time)
EmploymentHistory.belongsTo(Employee, {
  foreignKey: 'supervisor_id',
  as: 'supervisor',
});

// EmploymentHistory -> Media (document attachment)
EmploymentHistory.belongsTo(Media, {
  foreignKey: 'document_attachment_id',
  as: 'documentAttachment',
});

// EmploymentHistory -> User (created_by)
EmploymentHistory.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'createdBy',
});

// Employee -> LeaveRequest
Employee.hasMany(LeaveRequest, {
  foreignKey: 'employee_id',
  as: 'leaveRequests',
  onDelete: 'CASCADE',
});
LeaveRequest.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee',
});

// LeaveRequest -> User (approved_by)
LeaveRequest.belongsTo(User, {
  foreignKey: 'approved_by',
  as: 'approvedBy',
});

// Employee -> LeaveBalance
Employee.hasMany(LeaveBalance, {
  foreignKey: 'employee_id',
  as: 'leaveBalances',
  onDelete: 'CASCADE',
});
LeaveBalance.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee',
});

// Employee -> AttendanceLog
Employee.hasMany(AttendanceLog, {
  foreignKey: 'employee_id',
  as: 'attendanceLogs',
  onDelete: 'CASCADE',
});
AttendanceLog.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee',
});

// RecruitmentVacancy -> Department
RecruitmentVacancy.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});
Department.hasMany(RecruitmentVacancy, {
  foreignKey: 'department_id',
  as: 'recruitmentVacancies',
});

// RecruitmentVacancy -> Position
RecruitmentVacancy.belongsTo(Position, {
  foreignKey: 'position_id',
  as: 'position',
});

// RecruitmentVacancy -> User (created_by)
RecruitmentVacancy.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'createdBy',
});

// RecruitmentVacancy -> RecruitmentApplication
RecruitmentVacancy.hasMany(RecruitmentApplication, {
  foreignKey: 'vacancy_id',
  as: 'applications',
  onDelete: 'CASCADE',
});
RecruitmentApplication.belongsTo(RecruitmentVacancy, {
  foreignKey: 'vacancy_id',
  as: 'vacancy',
});

// RecruitmentApplication -> Media (CV attachment)
RecruitmentApplication.belongsTo(Media, {
  foreignKey: 'cv_attachment_id',
  as: 'cvAttachment',
});

// RecruitmentApplication -> Media (offer letter)
RecruitmentApplication.belongsTo(Media, {
  foreignKey: 'offer_letter_id',
  as: 'offerLetter',
});

// RecruitmentApplication -> User (assigned_to)
RecruitmentApplication.belongsTo(User, {
  foreignKey: 'assigned_to',
  as: 'assignedTo',
});

// PerformanceReview -> Employee
PerformanceReview.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee',
});
Employee.hasMany(PerformanceReview, {
  foreignKey: 'employee_id',
  as: 'performanceReviews',
  onDelete: 'CASCADE',
});

// PerformanceReview -> User (reviewer)
PerformanceReview.belongsTo(User, {
  foreignKey: 'reviewer_id',
  as: 'reviewer',
});

// DisciplinaryCase -> Employee
DisciplinaryCase.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee',
});
Employee.hasMany(DisciplinaryCase, {
  foreignKey: 'employee_id',
  as: 'disciplinaryCases',
  onDelete: 'CASCADE',
});

// DisciplinaryCase -> User (closed_by)
DisciplinaryCase.belongsTo(User, {
  foreignKey: 'closed_by',
  as: 'closedBy',
});

// ============================================================
// Recruitment Extension Associations (Phase 1)
// ============================================================

// VacancyRequest belongs to RecruitmentVacancy and User (requested_by)
VacancyRequest.belongsTo(RecruitmentVacancy, { foreignKey: 'vacancy_id', as: 'vacancy', onDelete: 'CASCADE' });
RecruitmentVacancy.hasMany(VacancyRequest, { foreignKey: 'vacancy_id', as: 'vacancyRequests' });

VacancyRequest.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });
User.hasMany(VacancyRequest, { foreignKey: 'requested_by', as: 'vacancyRequests' });

VacancyRequest.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// InterviewPanel belongs to RecruitmentVacancy
InterviewPanel.belongsTo(RecruitmentVacancy, { foreignKey: 'vacancy_id', as: 'vacancy', onDelete: 'CASCADE' });
RecruitmentVacancy.hasMany(InterviewPanel, { foreignKey: 'vacancy_id', as: 'interviewPanels' });

InterviewPanel.belongsTo(User, { foreignKey: 'chairperson_id', as: 'chairperson' });
User.hasMany(InterviewPanel, { foreignKey: 'chairperson_id', as: 'chairedPanels' });

// PanelMember belongs to InterviewPanel and User
PanelMember.belongsTo(InterviewPanel, { foreignKey: 'panel_id', as: 'panel', onDelete: 'CASCADE' });
InterviewPanel.hasMany(PanelMember, { foreignKey: 'panel_id', as: 'members' });

PanelMember.belongsTo(User, { foreignKey: 'user_id', as: 'member' });
User.hasMany(PanelMember, { foreignKey: 'user_id', as: 'panelMemberships' });

// InterviewScore belongs to RecruitmentApplication and PanelMember
InterviewScore.belongsTo(RecruitmentApplication, { foreignKey: 'application_id', as: 'application', onDelete: 'CASCADE' });
RecruitmentApplication.hasMany(InterviewScore, { foreignKey: 'application_id', as: 'interviewScores' });

InterviewScore.belongsTo(PanelMember, { foreignKey: 'panel_member_id', as: 'panelMember', onDelete: 'CASCADE' });
PanelMember.hasMany(InterviewScore, { foreignKey: 'panel_member_id', as: 'scores' });

// AppointmentLetter belongs to RecruitmentApplication and User
AppointmentLetter.belongsTo(RecruitmentApplication, { foreignKey: 'application_id', as: 'application', onDelete: 'CASCADE' });
RecruitmentApplication.hasOne(AppointmentLetter, { foreignKey: 'application_id', as: 'appointmentLetter' });

AppointmentLetter.belongsTo(User, { foreignKey: 'issued_by', as: 'issuer' });
AppointmentLetter.belongsTo(User, { foreignKey: 'signed_by', as: 'signer' });

// ============================================================
// Health Facility Management Associations
// ============================================================

// HealthSupplier -> HealthInventoryItem
HealthSupplier.hasMany(HealthInventoryItem, {
  foreignKey: 'supplier_id',
  as: 'inventoryItems',
});
HealthInventoryItem.belongsTo(HealthSupplier, {
  foreignKey: 'supplier_id',
  as: 'supplier',
});

// HealthInventoryItem -> HealthInventoryTransaction
HealthInventoryItem.hasMany(HealthInventoryTransaction, {
  foreignKey: 'item_id',
  as: 'transactions',
  onDelete: 'CASCADE',
});
HealthInventoryTransaction.belongsTo(HealthInventoryItem, {
  foreignKey: 'item_id',
  as: 'item',
});

// HealthInventoryTransaction -> User (created_by)
HealthInventoryTransaction.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'createdBy',
});

// HealthPatient -> HealthPatientVisit
HealthPatient.hasMany(HealthPatientVisit, {
  foreignKey: 'patient_id',
  as: 'visits',
  onDelete: 'CASCADE',
});
HealthPatientVisit.belongsTo(HealthPatient, {
  foreignKey: 'patient_id',
  as: 'patient',
});

// HealthPatientVisit -> User (created_by)
HealthPatientVisit.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'createdBy',
});

// HealthPatient -> HealthAppointment
HealthPatient.hasMany(HealthAppointment, {
  foreignKey: 'patient_id',
  as: 'appointments',
  onDelete: 'CASCADE',
});
HealthAppointment.belongsTo(HealthPatient, {
  foreignKey: 'patient_id',
  as: 'patient',
});

// HealthAppointment -> Employee (doctor)
HealthAppointment.belongsTo(Employee, {
  foreignKey: 'doctor_id',
  as: 'doctor',
});

// HealthCampaign -> HealthCampaignParticipant
HealthCampaign.hasMany(HealthCampaignParticipant, {
  foreignKey: 'campaign_id',
  as: 'participants',
  onDelete: 'CASCADE',
});
HealthCampaignParticipant.belongsTo(HealthCampaign, {
  foreignKey: 'campaign_id',
  as: 'campaign',
});

// HealthPatient -> HealthCampaignParticipant
HealthPatient.hasMany(HealthCampaignParticipant, {
  foreignKey: 'patient_id',
  as: 'campaignParticipants',
  onDelete: 'CASCADE',
});
HealthCampaignParticipant.belongsTo(HealthPatient, {
  foreignKey: 'patient_id',
  as: 'patient',
});

// HealthPatient -> HealthAmbulanceRequest
HealthPatient.hasMany(HealthAmbulanceRequest, {
  foreignKey: 'patient_id',
  as: 'ambulanceRequests',
});
HealthAmbulanceRequest.belongsTo(HealthPatient, {
  foreignKey: 'patient_id',
  as: 'patient',
});

// HealthAmbulanceRequest -> Employee (driver)
HealthAmbulanceRequest.belongsTo(Employee, {
  foreignKey: 'assigned_driver_id',
  as: 'assignedDriver',
});

// ============================================================
// Community Health Extension Associations
// ============================================================

// HealthCommunityUnit -> HealthCommunityCommittee
HealthCommunityUnit.hasMany(HealthCommunityCommittee, {
  foreignKey: 'community_unit_id',
  as: 'committeeMembers',
  onDelete: 'CASCADE',
});
HealthCommunityCommittee.belongsTo(HealthCommunityUnit, {
  foreignKey: 'community_unit_id',
  as: 'communityUnit',
});

// HealthCommunityUnit -> HealthCommunityVolunteer
HealthCommunityUnit.hasMany(HealthCommunityVolunteer, {
  foreignKey: 'community_unit_id',
  as: 'volunteers',
  onDelete: 'CASCADE',
});
HealthCommunityVolunteer.belongsTo(HealthCommunityUnit, {
  foreignKey: 'community_unit_id',
  as: 'communityUnit',
});

// HealthCommunityUnit -> HealthHousehold
HealthCommunityUnit.hasMany(HealthHousehold, {
  foreignKey: 'community_unit_id',
  as: 'households',
  onDelete: 'CASCADE',
});
HealthHousehold.belongsTo(HealthCommunityUnit, {
  foreignKey: 'community_unit_id',
  as: 'communityUnit',
});

// HealthCommunityUnit -> HealthCommunityDialogue
HealthCommunityUnit.hasMany(HealthCommunityDialogue, {
  foreignKey: 'community_unit_id',
  as: 'dialogues',
  onDelete: 'CASCADE',
});
HealthCommunityDialogue.belongsTo(HealthCommunityUnit, {
  foreignKey: 'community_unit_id',
  as: 'communityUnit',
});

// HealthCommunityUnit -> HealthCommunityActionDay
HealthCommunityUnit.hasMany(HealthCommunityActionDay, {
  foreignKey: 'community_unit_id',
  as: 'actionDays',
  onDelete: 'CASCADE',
});
HealthCommunityActionDay.belongsTo(HealthCommunityUnit, {
  foreignKey: 'community_unit_id',
  as: 'communityUnit',
});

// HealthCommunityAssistant -> HealthCommunityVolunteer (supervisor)
HealthCommunityAssistant.hasMany(HealthCommunityVolunteer, {
  foreignKey: 'cha_id',
  as: 'supervisedVolunteers',
});
HealthCommunityVolunteer.belongsTo(HealthCommunityAssistant, {
  foreignKey: 'cha_id',
  as: 'supervisor',
});

// HealthCommunityVolunteer -> HealthHousehold (assigned)
HealthCommunityVolunteer.hasMany(HealthHousehold, {
  foreignKey: 'chv_id',
  as: 'assignedHouseholds',
});
HealthHousehold.belongsTo(HealthCommunityVolunteer, {
  foreignKey: 'chv_id',
  as: 'assignedChv',
});

// HealthHousehold -> HealthHouseholdMember
HealthHousehold.hasMany(HealthHouseholdMember, {
  foreignKey: 'household_id',
  as: 'members',
  onDelete: 'CASCADE',
});
HealthHouseholdMember.belongsTo(HealthHousehold, {
  foreignKey: 'household_id',
  as: 'household',
});

// HealthCommunityVolunteer -> HealthHouseholdVisit
HealthCommunityVolunteer.hasMany(HealthHouseholdVisit, {
  foreignKey: 'chv_id',
  as: 'visits',
  onDelete: 'CASCADE',
});
HealthHouseholdVisit.belongsTo(HealthCommunityVolunteer, {
  foreignKey: 'chv_id',
  as: 'chv',
});

// HealthHousehold -> HealthHouseholdVisit
HealthHousehold.hasMany(HealthHouseholdVisit, {
  foreignKey: 'household_id',
  as: 'visits',
  onDelete: 'CASCADE',
});
HealthHouseholdVisit.belongsTo(HealthHousehold, {
  foreignKey: 'household_id',
  as: 'household',
});

// HealthChvKit -> HealthCommunitySupplyRequest
HealthChvKit.hasMany(HealthCommunitySupplyRequest, {
  foreignKey: 'kit_id',
  as: 'supplyRequests',
});
HealthCommunitySupplyRequest.belongsTo(HealthChvKit, {
  foreignKey: 'kit_id',
  as: 'kit',
});

// HealthCommunityVolunteer -> HealthCommunitySupplyRequest
HealthCommunityVolunteer.hasMany(HealthCommunitySupplyRequest, {
  foreignKey: 'chv_id',
  as: 'supplyRequests',
  onDelete: 'CASCADE',
});
HealthCommunitySupplyRequest.belongsTo(HealthCommunityVolunteer, {
  foreignKey: 'chv_id',
  as: 'chv',
});

// HealthCommunitySupplyRequest -> User (approved_by)
HealthCommunitySupplyRequest.belongsTo(User, {
  foreignKey: 'approved_by',
  as: 'approver',
});

// HealthPatientVisit -> HealthCommunityVolunteer (referral source)
HealthPatientVisit.belongsTo(HealthCommunityVolunteer, {
  foreignKey: 'referral_source_chv_id',
  as: 'referralChv',
});
HealthCommunityVolunteer.hasMany(HealthPatientVisit, {
  foreignKey: 'referral_source_chv_id',
  as: 'referralVisits',
});

// ============================================================
// Menu & MenuItem Associations
// ============================================================

Menu.hasMany(MenuItem, {
  foreignKey: 'menu_id',
  as: 'items',
  onDelete: 'CASCADE',
});

MenuItem.belongsTo(Menu, {
  foreignKey: 'menu_id',
  as: 'menu',
});

MenuItem.belongsTo(MenuItem, {
  foreignKey: 'parent_id',
  as: 'parent',
  onDelete: 'SET NULL',
});

MenuItem.hasMany(MenuItem, {
  foreignKey: 'parent_id',
  as: 'children',
  onDelete: 'SET NULL',
});

module.exports = {
  // Core
  Role,
  Department,
  User,
  // CMS
  Content,
  ContentTranslation,
  ContentMeta,
  ContentWorkflowLog,
  ContentVersion,
  Media,
  ContentMedia,
  Taxonomy,
  ContentTaxonomy,
  Person,
  Fact,
  HeroSlide,
  Setting,
  LlmUsageLog,
  ContactMessage,
  NewsletterSubscriber,
  Menu,
  MenuItem,
  // Revenue & Business Licensing
  PermitType,
  Permit,
  Transaction,
  PermitAssignment,
  CitizenRepresentation,
  // Human Capital Management
  Position,
  Employee,
  EmploymentHistory,
  LeaveRequest,
  LeaveBalance,
  AttendanceLog,
  RecruitmentVacancy,
  RecruitmentApplication,
  PerformanceReview,
  DisciplinaryCase,
  VacancyRequest,
  InterviewPanel,
  PanelMember,
  InterviewScore,
  AppointmentLetter,
  // Health Facility Management
  HealthInventoryItem,
  HealthInventoryTransaction,
  HealthSupplier,
  HealthPatient,
  HealthPatientVisit,
  HealthAppointment,
  HealthCampaign,
  HealthCampaignParticipant,
  HealthAmbulanceRequest,
  // Community Health Extension
  HealthCommunityUnit,
  HealthCommunityCommittee,
  HealthCommunityAssistant,
  HealthCommunityVolunteer,
  HealthHousehold,
  HealthHouseholdMember,
  HealthHouseholdVisit,
  HealthCommunityDialogue,
  HealthCommunityActionDay,
  HealthChvKit,
  HealthCommunitySupplyRequest,
};
