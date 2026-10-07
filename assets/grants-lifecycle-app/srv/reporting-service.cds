using grants.db as db from '../db/schema';

// Read-only reporting service for compliance and finance officers
service ReportingService @(path: '/reporting') {

  @(restrict: [{ grant: 'READ', to: ['ComplianceOfficer','FinanceOfficer','ProgramManager'] }])
  @cds.redirection.target
  entity AllApplications as projection on db.GrantApplications;

  @(restrict: [{ grant: 'READ', to: ['ComplianceOfficer','FinanceOfficer','ProgramManager'] }])
  view GrantSummaryByStatus as
    select from db.GrantApplications {
      status,
      count(ID)             as count          : Integer,
      sum(requestedAmount)  as totalRequested  : Decimal,
      sum(case when status = 'awarded' then requestedAmount else 0 end) as totalAwarded : Decimal
    }
    group by status;

  @(restrict: [{ grant: 'READ', to: ['ComplianceOfficer','FinanceOfficer','ProgramManager'] }])
  entity PaymentHistory as projection on db.PaymentRecords {
    *,
    application.grantId        as grantId,
    application.applicantName  as applicantName,
    application.orgName        as orgName,
    application.status         as applicationStatus
  };
}
