namespace grants.db;

using { cuid, managed } from '@sap/cds/common';

// Grant Applications submitted by external applicants
entity GrantApplications : cuid, managed {
  grantId           : String(50)  @mandatory;
  applicantName     : String(200) @mandatory;
  applicantEmail    : String(200) @mandatory;
  orgName           : String(200) @mandatory;
  requestedAmount   : Decimal(15,2) @mandatory;
  currency          : String(3) default 'EUR';
  purpose           : String(2000) @mandatory;
  status            : String(30) default 'draft';
  // Status values: draft | submitted | under_review | approved | rejected | awarded
  submittedAt       : Timestamp;
  s4GrantId         : String(50);
  budgetCheckResult : String(20);
  // Budget check: sufficient | insufficient | pending
  reviewedBy        : String(200);
  reviewedAt        : Timestamp;
  rejectionReason   : String(1000);
  documents         : Composition of many ApplicationDocuments on documents.application = $self;
  comments          : Composition of many ReviewComments on comments.application = $self;
  payments          : Composition of many PaymentRecords on payments.application = $self;
}

// Documents attached to a grant application
entity ApplicationDocuments : cuid, managed {
  application  : Association to GrantApplications;
  fileName     : String(500) @mandatory;
  fileType     : String(100);
  fileSize     : Integer;
  storagePath  : String(1000);
  uploadedAt   : Timestamp;
}

// Reviewer comments and notes per application
entity ReviewComments : cuid, managed {
  application   : Association to GrantApplications;
  reviewerEmail : String(200) @mandatory;
  comment       : String(2000) @mandatory;
  createdAt     : Timestamp;
}

// Payment disbursement records
entity PaymentRecords : cuid, managed {
  application      : Association to GrantApplications;
  earmarkedFundDoc : String(50);
  amount           : Decimal(15,2) @mandatory;
  currency         : String(3) default 'EUR';
  disbursedAt      : Timestamp;
  s4Reference      : String(50);
  status           : String(20) default 'pending';
  // Status: pending | processed | failed
}
