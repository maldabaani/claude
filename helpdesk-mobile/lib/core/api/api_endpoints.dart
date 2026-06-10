class ApiEndpoints {
  // Use 10.0.2.2 for Android emulator (maps to localhost)
  // Use localhost for iOS simulator
  static const String _baseUrl = 'http://localhost:8080/api/v1';
  static String get base => _baseUrl;

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static String twoFaSetup = '/auth/2fa/setup';
  static String twoFaEnable = '/auth/2fa/enable';
  static String twoFaVerify = '/auth/2fa/verify';

  // Users
  static const String users = '/users';
  static const String me = '/users/me';
  static String user(String id) => '/users/$id';
  static String twoFaStatus = '/users/me/2fa-status';

  // Tickets
  static const String tickets = '/tickets';
  static String ticket(String id) => '/tickets/$id';
  static String ticketStatus(String id) => '/tickets/$id/status';
  static String ticketAssign(String id) => '/tickets/$id/assign';
  static String ticketComments(String id) => '/tickets/$id/comments';
  static String ticketAttachments(String id) => '/tickets/$id/attachments';
  static String ticketWatchers(String id) => '/tickets/$id/watchers';
  static String ticketWatcher(String id, String email) => '/tickets/$id/watchers/$email';
  static String ticketTasks(String id) => '/tickets/$id/tasks';
  static String ticketTask(String ticketId, String taskId) => '/tickets/$ticketId/tasks/$taskId';
  static String ticketTaskToggle(String ticketId, String taskId) => '/tickets/$ticketId/tasks/$taskId/toggle';
  static String ticketMerge(String id) => '/tickets/$id/merge';
  static String ticketDueDate(String id) => '/tickets/$id/due-date';
  static const String ticketsBulk = '/tickets/bulk';

  // Departments
  static const String departments = '/departments';
  static String department(String id) => '/departments/$id';

  // Organizations
  static const String organizations = '/organizations';

  // Help topics
  static const String helpTopics = '/help-topics';

  // Templates
  static const String templates = '/ticket-templates';

  // Knowledge Base
  static const String kbCategories = '/kb/categories';
  static const String kbArticles = '/kb/articles';
  static String kbArticle(String id) => '/kb/articles/$id';

  // Canned Responses
  static const String cannedResponses = '/canned-responses';

  // Custom Fields
  static const String customFields = '/custom-fields';
  static String customFieldValues(String ticketId) => '/tickets/$ticketId/custom-field-values';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationsMarkRead = '/notifications/mark-all-read';
  static const String notificationsUnreadCount = '/notifications/unread-count';

  // Notification Preferences
  static const String notificationPreferences = '/notification-preferences';
  static String notificationPreference(String eventType) => '/notification-preferences/$eventType';

  // Analytics
  static const String analytics = '/analytics';

  // SLA
  static const String slaPolicies = '/sla-policies';
  static const String slaEscalations = '/sla-escalations';

  // Issues
  static const String issues = '/issues';
  static String issue(String id) => '/issues/$id';
  static String issueTickets(String id) => '/issues/$id/tickets';
  static String issuesByTicket(String ticketId) => '/issues/by-ticket/$ticketId';

  // Saved Views
  static const String savedViews = '/saved-views';
  static String savedView(String id) => '/saved-views/$id';

  // CSAT
  static String csatRating(String ticketId) => '/csat/$ticketId';

  // Attachments
  static String attachmentDownload(String id) => '/attachments/$id/download';

  // Webhooks
  static const String webhooks = '/webhooks';

  // API Keys
  static const String apiKeys = '/api-keys';

  // Settings
  static const String settings = '/settings';

  // Audit Log
  static const String auditLog = '/audit-logs';

  // Email Inboxes
  static const String emailInboxes = '/email-inboxes';
}
