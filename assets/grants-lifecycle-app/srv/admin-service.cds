using grants.db as db from '../db/schema';

// Service for grant administrators, finance officers and compliance officers
service AdminService @(path: '/admin') {

  @(restrict: [{ grant: 'READ', to: ['GrantAdmin','FinanceOfficer','ComplianceOfficer','ProgramManager'] },
               { grant: 'WRITE', to: ['GrantAdmin','FinanceOfficer'] }])
  entity Applications as projection on db.GrantApplications;

  @(restrict: [{ grant: ['READ','WRITE'], to: ['GrantAdmin','FinanceOfficer','ComplianceOfficer','ProgramManager'] }])
  entity Comments as projection on db.ReviewComments;

  @(restrict: [{ grant: 'READ', to: ['FinanceOfficer','ComplianceOfficer','ProgramManager'] }])
  entity Payments as projection on db.PaymentRecords;

  // Check S/4HANA budget availability before awarding
  @(restrict: [{ to: ['GrantAdmin','FinanceOfficer'] }])
  function checkBudget(grantId: String, requestedAmount: Decimal) returns {
    available        : Decimal;
    committed        : Decimal;
    requested        : Decimal;
    sufficient       : Boolean;
    budgetAccountId  : String;
  };

  // Approve an application and record the approval
  @(restrict: [{ to: ['GrantAdmin'] }])
  action approveApplication(applicationId: UUID, budgetFund: String) returns {
    success : Boolean;
    message : String;
  };

  // Reject an application with a reason
  @(restrict: [{ to: ['GrantAdmin'] }])
  action rejectApplication(applicationId: UUID, reason: String) returns {
    success : Boolean;
    message : String;
  };

  // Trigger payment disbursement via S/4HANA earmarked funds
  @(restrict: [{ to: ['FinanceOfficer'] }])
  action triggerPayment(applicationId: UUID, amount: Decimal, currency: String) returns {
    success          : Boolean;
    earmarkedFundDoc : String;
    message          : String;
  };
}
