'use strict';
const cds = require('@sap/cds');
const s4 = require('./s4-integration');

module.exports = cds.service.impl(async function (srv) {
  const { GrantApplications, PaymentRecords } = cds.entities('grants.db');

  /**
   * Check S/4HANA budget availability before awarding a grant.
   */
  srv.on('checkBudget', async (req) => {
    const { grantId, requestedAmount } = req.data;
    try {
      const result = await s4.getBudgetAvailability(grantId, requestedAmount);
      return result;
    } catch (err) {
      return req.error(502, `Budget check failed: ${err.message}`);
    }
  });

  /**
   * Approve a grant application and record the reviewer decision.
   */
  srv.on('approveApplication', async (req) => {
    const { applicationId, budgetFund } = req.data;
    const reviewerEmail = req.user?.id;

    const app = await SELECT.one.from(GrantApplications).where({ ID: applicationId });
    if (!app) return req.error(404, `Application ${applicationId} not found.`);
    if (!['submitted', 'under_review'].includes(app.status)) {
      return req.error(400, `Application ${applicationId} cannot be approved in status "${app.status}".`);
    }

    await UPDATE(GrantApplications).set({
      status: 'approved',
      reviewedBy: reviewerEmail,
      reviewedAt: new Date().toISOString(),
      budgetCheckResult: budgetFund ? 'sufficient' : 'pending'
    }).where({ ID: applicationId });

    return {
      success: true,
      message: `Application ${applicationId} has been approved by ${reviewerEmail}.`
    };
  });

  /**
   * Reject a grant application with a mandatory reason.
   */
  srv.on('rejectApplication', async (req) => {
    const { applicationId, reason } = req.data;
    const reviewerEmail = req.user?.id;

    if (!reason || reason.trim().length < 10) {
      return req.error(400, 'A rejection reason of at least 10 characters is required.');
    }

    const app = await SELECT.one.from(GrantApplications).where({ ID: applicationId });
    if (!app) return req.error(404, `Application ${applicationId} not found.`);
    if (!['submitted', 'under_review', 'approved'].includes(app.status)) {
      return req.error(400, `Application ${applicationId} cannot be rejected in status "${app.status}".`);
    }

    await UPDATE(GrantApplications).set({
      status: 'rejected',
      reviewedBy: reviewerEmail,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason
    }).where({ ID: applicationId });

    return {
      success: true,
      message: `Application ${applicationId} has been rejected.`
    };
  });

  /**
   * Trigger payment disbursement via S/4HANA earmarked fund creation.
   */
  srv.on('triggerPayment', async (req) => {
    const { applicationId, amount, currency } = req.data;

    const app = await SELECT.one.from(GrantApplications).where({ ID: applicationId });
    if (!app) return req.error(404, `Application ${applicationId} not found.`);
    if (app.status !== 'approved') {
      return req.error(400, `Application ${applicationId} must be in "approved" status to trigger payment. Current status: "${app.status}".`);
    }

    try {
      const efDoc = await s4.createEarmarkedFund({
        applicationId,
        grantId: app.grantId,
        amount,
        currency: currency || app.currency || 'EUR'
      });

      const earmarkedFundDoc = efDoc.EarmarkedFunds || efDoc.DocumentNumber || `EF-${Date.now()}`;

      // Record payment in local database
      await INSERT.into(PaymentRecords).entries({
        application_ID: applicationId,
        earmarkedFundDoc,
        amount,
        currency: currency || app.currency || 'EUR',
        disbursedAt: new Date().toISOString(),
        s4Reference: efDoc.FiscalYear ? `${efDoc.EarmarkedFunds}/${efDoc.FiscalYear}` : earmarkedFundDoc,
        status: 'processed'
      });

      // Update application to awarded
      await UPDATE(GrantApplications).set({ status: 'awarded' }).where({ ID: applicationId });

      return {
        success: true,
        earmarkedFundDoc,
        message: `Payment of ${amount} ${currency} triggered successfully. Earmarked Fund Document: ${earmarkedFundDoc}`
      };
    } catch (err) {
      return req.error(502, `Payment disbursement failed: ${err.message}`);
    }
  });
});
