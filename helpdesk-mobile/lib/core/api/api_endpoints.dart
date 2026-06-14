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
  static String ticketSplit(String id) => '/tickets/$id/split';
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
  static String kbArticleView(String id) => '/kb/articles/$id/view';
  static String kbArticleRate(String id) => '/kb/articles/$id/rate';

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
  static String csatRating(String ticketId) => '/csat/tickets/$ticketId/rating';

  // Presence
  static String ticketPresenceJoin(String id) => '/tickets/$id/presence/join';
  static String ticketPresenceLeave(String id) => '/tickets/$id/presence/leave';
  static String ticketPresence(String id) => '/tickets/$id/presence';
  static String ticketSnooze(String id) => '/tickets/$id/snooze';
  static String ticketDraft(String id) => '/tickets/$id/draft';
  static String ticketTimeEntries(String id) => '/tickets/$id/time-entries';
  static String ticketTimeEntry(String ticketId, String entryId) => '/tickets/$ticketId/time-entries/$entryId';

  // Customer Profile
  static String customerProfile(String id) => '/users/$id/profile';
  static String customerNotes(String id) => '/users/$id/notes';
  static String customerNote(String userId, String noteId) => '/users/$userId/notes/$noteId';

  // Attachments
  static String attachmentDownload(String id) => '/attachments/$id/download';

  // Webhooks
  static const String webhooks = '/webhooks';

  // API Keys
  static const String apiKeys = '/api-keys';

  // Tags
  static const String tags = '/tags';
  static String tagSearch = '/tags/search';
  static String tag(String id) => '/tags/$id';
  static String tagMerge(String id) => '/tags/$id/merge';
  static String ticketTags(String id) => '/tickets/$id/tags';

  // Ticket Links
  static String ticketLinks(String id) => '/tickets/$id/links';
  static String ticketLink(String ticketId, String linkId) => '/tickets/$ticketId/links/$linkId';

  // Business Hours
  static const String businessHours = '/business-hours';
  static const String businessHolidays = '/business-hours/holidays';

  // Round Robin
  static const String roundRobin = '/round-robin/config';

  // Settings
  static const String settings = '/settings';

  // Audit Log
  static const String auditLog = '/audit-logs';

  // Email Inboxes
  static const String emailInboxes = '/email-inboxes';

  // Agent Performance
  static const String agentPerformance = '/analytics/agents';

  // Agent Availability
  static const String agentAvailability = '/agents/availability';
  static const String agentAvailabilityMe = '/agents/availability/me';

  // Macros
  static const String macros = '/macros';
  static String applyMacro(String macroId, String ticketId) => '/macros/$macroId/apply/$ticketId';

  // Parent-child tickets
  static String ticketChildren(String id) => '/tickets/$id/children';
  static String ticketParent(String id) => '/tickets/$id/parent';

  // Teams
  static const String teams = '/teams';
  static String team(String id) => '/teams/$id';
  static String teamMembers(String id) => '/teams/$id/members';
  static String teamMember(String teamId, String userId) => '/teams/$teamId/members/$userId';
  static String ticketTeam(String id) => '/tickets/$id/team';

  // NPS
  static const String npsScore = '/nps/score';
  static const String npsResponses = '/nps/responses';
  static String npsTicket(String ticketId) => '/nps/tickets/$ticketId';

  // AI Triage
  static String ticketAiSuggestions(String id) => '/tickets/$id/ai-suggestions';
  static String ticketAiSummary(String id) => '/tickets/$id/ai-summary';
  static String ticketAiSentiment(String id) => '/tickets/$id/ai-sentiment';
  static String ticketAiSmartReply(String id) => '/tickets/$id/ai-smart-reply';
  static String ticketAiAutoCategorize(String id) => '/tickets/$id/ai-auto-categorize';

  // Automation Rules
  static const String automationRules = '/automation-rules';
  static String automationRule(String id) => '/automation-rules/$id';
  static String automationRuleToggle(String id) => '/automation-rules/$id/toggle';
}