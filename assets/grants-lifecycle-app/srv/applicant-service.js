'use strict';
const cds = require('@sap/cds');
const axios = require('axios');

module.exports = cds.service.impl(async function (srv) {
  const { GrantApplications, ApplicationDocuments } = cds.entities('grants.db');

  /**
   * Submit a draft application for review.
   * Sets status to 'submitted', triggers n8n workflow for review routing.
   */
  srv.on('submitApplication', async (req) => {
    const { applicationId } = req.data;
    const userEmail = req.user?.id;

    // Load the application to verify ownership and current status
    const app = await SELECT.one.from(GrantApplications).where({
      ID: applicationId,
      applicantEmail: userEmail
    });

    if (!app) return req.error(404, `Application ${applicationId} not found or not owned by current user.`);
    if (app.status !== 'draft') return req.error(400, `Application ${applicationId} is already ${app.status} and cannot be submitted again.`);

    // Validate required fields
    if (!app.grantId || !app.applicantName || !app.orgName || !app.requestedAmount || !app.purpose) {
      return req.error(400, 'Application is incomplete. Please fill in all required fields before submitting.');
    }

    const submittedAt = new Date().toISOString();

    // Update status to submitted
    await UPDATE(GrantApplications).set({
      status: 'submitted',
      submittedAt
    }).where({ ID: applicationId });

    // Trigger n8n workflow for review routing (fire and forget)
    const workflowEndpoint = process.env.WORKFLOW_ENDPOINT;
    if (workflowEndpoint) {
      try {
        await axios.post(workflowEndpoint, {
          applicationId,
          applicantEmail: app.applicantEmail,
          grantId: app.grantId,
          requestedAmount: app.requestedAmount,
          submittedAt
        }, { timeout: 10000 });
      } catch (err) {
        console.warn(`[applicant-service] Workflow trigger failed for application ${applicationId}:`, err.message);
        // Do not fail the submission — application is recorded regardless
      }
    } else {
      console.warn('[applicant-service] WORKFLOW_ENDPOINT not configured — skipping workflow trigger.');
    }

    return {
      success: true,
      reference: applicationId,
      message: `Application ${applicationId} submitted successfully. You will be notified when a decision is made.`
    };
  });

  /**
   * Withdraw a submitted or under-review application.
   */
  srv.on('withdrawApplication', async (req) => {
    const { applicationId } = req.data;
    const userEmail = req.user?.id;

    const app = await SELECT.one.from(GrantApplications).where({
      ID: applicationId,
      applicantEmail: userEmail
    });

    if (!app) return req.error(404, `Application ${applicationId} not found or not owned by current user.`);
    if (!['submitted', 'under_review'].includes(app.status)) {
      return req.error(400, `Application ${applicationId} cannot be withdrawn in status "${app.status}".`);
    }

    await UPDATE(GrantApplications).set({ status: 'draft' }).where({ ID: applicationId });

    return {
      success: true,
      message: `Application ${applicationId} has been withdrawn and returned to draft status.`
    };
  });

  /**
   * Ensure applicants only see their own applications.
   */
  srv.before('READ', 'Applications', (req) => {
    const userEmail = req.user?.id;
    req.query.where({ applicantEmail: userEmail });
  });
});
