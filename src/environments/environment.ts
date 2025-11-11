/**
 * Production environment configuration for ChroniCaree Platform
 * @summary Provides production-specific configuration values with centralized API endpoints
 * @description All API endpoints are defined here to facilitate backend migration
 */
export const environment = {
  production: true,
  
  // Base API URL - Production backend
  apiBaseUrl: 'https://chronicaree-api.onrender.com',
  
  // === IAM Bounded Context ===
  usersEndpointPath: '/users',
  authEndpointPath: '/auth',
  
  // === Tenants Bounded Context ===
  tenantsEndpointPath: '/tenants',
  
  // === Doctors Bounded Context ===
  doctorsEndpointPath: '/doctors',
  appointmentsEndpointPath: '/appointments',
  medicalRecordsEndpointPath: '/records',
  
  // === Patients Bounded Context ===
  patientsEndpointPath: '/patients',
  
  // === Clinical Bounded Context ===
  symptomsEndpointPath: '/symptoms',
  diagnosesEndpointPath: '/diagnoses',
  
  // === Communication Bounded Context ===
  messagesEndpointPath: '/messages',
  threadsEndpointPath: '/threads',
  nudgesEndpointPath: '/nudges',
  uploadsEndpointPath: '/uploads',
  
  // === Alerts Bounded Context ===
  alertsEndpointPath: '/alerts',
  vitalSignsEndpointPath: '/vital-signs',
  
  // === Devices Bounded Context ===
  devicesEndpointPath: '/devices',
  bloodPressureEndpointPath: '/blood-pressure-readings',
  glucometerEndpointPath: '/glucose-readings',
  ecgEndpointPath: '/ecg-readings',
  oximeterEndpointPath: '/oximeter-readings',
  thermometerEndpointPath: '/temperature-readings',
  
  // === Medications Bounded Context ===
  medicationsEndpointPath: '/medications',
  prescriptionsEndpointPath: '/prescriptions',
  
  // === Subscriptions Bounded Context ===
  subscriptionsEndpointPath: '/subscriptions',
  plansEndpointPath: '/subscriptionPlans',
  
  // === Payments Bounded Context ===
  paymentsEndpointPath: '/payments',
  invoicesEndpointPath: '/invoices',
  
  // === Stripe Configuration ===
  stripePublishableKey: 'pk_test_51SRk5HBJEHGVCWjr5LcdmgQrDb0kklTxWvQxP6gCn5JVvGXiUFurJ8Vu9uT5Y3whMDrgDd0CWwFcRBZvmqD57DOR0042YrcU4O',
  
  // External APIs
  logoProviderApiBaseUrl: 'https://logo.clearbit.com/',
};
