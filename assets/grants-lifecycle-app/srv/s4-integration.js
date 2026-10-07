'use strict';
/**
 * S/4HANA Integration Module
 * Wraps OData API calls to SAP S/4HANA Cloud Public Edition via named destination.
 * All calls use @sap-cloud-sdk/http-client with destination S4HANA_DEST.
 */
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

const DESTINATION = process.env.S4HANA_DESTINATION || 'S4HANA_DEST';

/**
 * Fetch grant master data from S/4HANA (API_GRANTCORE)
 */
async function getGrantData(grantId) {
  try {
    const response = await executeHttpRequest(
      { destinationName: DESTINATION },
      {
        method: 'GET',
        url: `/sap/opu/odata/sap/API_GRANTCORE/Grant('${encodeURIComponent(grantId)}')`,
        headers: { Accept: 'application/json' }
      }
    );
    return response.data?.d || null;
  } catch (err) {
    console.error(`[s4-integration] getGrantData failed for grantId=${grantId}:`, err.message);
    throw new Error(`Failed to fetch grant data from S/4HANA: ${err.message}`);
  }
}

/**
 * Check budget availability from S/4HANA (API_BUDGETACCOUNTCORE)
 */
async function getBudgetAvailability(grantId, requestedAmount) {
  try {
    const response = await executeHttpRequest(
      { destinationName: DESTINATION },
      {
        method: 'GET',
        url: `/sap/opu/odata/sap/API_BUDGETACCOUNTCORE/BudgetAccount?$filter=GrantID eq '${encodeURIComponent(grantId)}'&$format=json`,
        headers: { Accept: 'application/json' }
      }
    );
    const budgetData = response.data?.d?.results?.[0];
    if (!budgetData) return { sufficient: false, available: 0, committed: 0 };
    const available = parseFloat(budgetData.AvailableAmount || 0);
    const committed = parseFloat(budgetData.CommittedAmount || 0);
    return {
      available,
      committed,
      requested: requestedAmount,
      sufficient: available >= requestedAmount,
      budgetAccountId: budgetData.BudgetAccount
    };
  } catch (err) {
    console.error(`[s4-integration] getBudgetAvailability failed for grantId=${grantId}:`, err.message);
    throw new Error(`Failed to check budget from S/4HANA: ${err.message}`);
  }
}

/**
 * Fetch sponsored programs from S/4HANA (CE_SPONSOREDPROGRAM_0001)
 */
async function getSponsoredPrograms() {
  try {
    const response = await executeHttpRequest(
      { destinationName: DESTINATION },
      {
        method: 'GET',
        url: '/sap/opu/odata/sap/CE_SPONSOREDPROGRAM_0001/SponsoredProgram?$format=json',
        headers: { Accept: 'application/json' }
      }
    );
    return response.data?.d?.results || [];
  } catch (err) {
    console.error('[s4-integration] getSponsoredPrograms failed:', err.message);
    throw new Error(`Failed to fetch sponsored programs from S/4HANA: ${err.message}`);
  }
}

/**
 * Create an earmarked fund document in S/4HANA to trigger payment (OP_API_EARMARKEDFUNDS_SRV)
 */
async function createEarmarkedFund(payload) {
  try {
    // First get CSRF token
    const tokenResponse = await executeHttpRequest(
      { destinationName: DESTINATION },
      {
        method: 'GET',
        url: '/sap/opu/odata/sap/OP_API_EARMARKEDFUNDS_SRV/$metadata',
        headers: { 'x-csrf-token': 'fetch' }
      }
    );
    const csrfToken = tokenResponse.headers?.['x-csrf-token'];

    // Post earmarked fund document
    const response = await executeHttpRequest(
      { destinationName: DESTINATION },
      {
        method: 'POST',
        url: '/sap/opu/odata/sap/OP_API_EARMARKEDFUNDS_SRV/A_EarmarkedFunds',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          DocumentType: 'EF',
          DocumentDate: new Date().toISOString().split('T')[0],
          CompanyCode: payload.companyCode || '1000',
          Currency: payload.currency || 'EUR',
          TotalAmount: String(payload.amount),
          DocumentHeaderText: `Grant Award: ${payload.applicationId}`,
          GrantID: payload.grantId,
          to_EarmarkedFundsItem: {
            results: [{
              EarmarkedFundsItem: '1',
              AmtInLocalCrcy: String(payload.amount),
              Currency: payload.currency || 'EUR',
              GrantID: payload.grantId,
              FundsCenter: payload.fundsCenter || '',
              Fund: payload.fund || ''
            }]
          }
        }
      }
    );
    return response.data?.d || {};
  } catch (err) {
    console.error('[s4-integration] createEarmarkedFund failed:', err.message);
    throw new Error(`Failed to create earmarked fund in S/4HANA: ${err.message}`);
  }
}

/**
 * Fetch statutory reporting tasks from S/4HANA (CE_STATUTORYREPORTINGTASK_0001)
 */
async function getReportingTasks() {
  try {
    const response = await executeHttpRequest(
      { destinationName: DESTINATION },
      {
        method: 'GET',
        url: '/sap/opu/odata/sap/CE_STATUTORYREPORTINGTASK_0001/StatutoryReportingTask?$format=json',
        headers: { Accept: 'application/json' }
      }
    );
    return response.data?.d?.results || [];
  } catch (err) {
    console.error('[s4-integration] getReportingTasks failed:', err.message);
    throw new Error(`Failed to fetch reporting tasks from S/4HANA: ${err.message}`);
  }
}

module.exports = {
  getGrantData,
  getBudgetAvailability,
  getSponsoredPrograms,
  createEarmarkedFund,
  getReportingTasks
};
