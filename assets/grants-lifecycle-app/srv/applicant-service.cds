using grants.db as db from '../db/schema';

// Service for external grant applicants
service ApplicantService @(path: '/applicant') {

  // Applicants can only see and manage their own applications
  @(restrict: [{ grant: ['READ', 'WRITE'], to: 'GrantApplicant' }])
  entity Applications as projection on db.GrantApplications
    excluding { reviewedBy, reviewedAt, rejectionReason, s4GrantId, budgetCheckResult }
    where applicantEmail = $user.id;

  @(restrict: [{ grant: ['READ', 'WRITE'], to: 'GrantApplicant' }])
  entity Documents as projection on db.ApplicationDocuments;

  // Submit a draft application for review
  @(restrict: [{ to: 'GrantApplicant' }])
  action submitApplication(applicationId: UUID) returns {
    success    : Boolean;
    reference  : String;
    message    : String;
  };

  // Withdraw a submitted or under-review application
  @(restrict: [{ to: 'GrantApplicant' }])
  action withdrawApplication(applicationId: UUID) returns {
    success : Boolean;
    message : String;
  };
}
