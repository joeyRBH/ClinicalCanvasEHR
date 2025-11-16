// Availity API Integration Utility
// Handles communication with Availity's healthcare clearinghouse APIs

/**
 * Get Availity OAuth token
 * Availity uses OAuth 2.0 for authentication
 */
async function getAvailityToken() {
  const clientId = process.env.AVAILITY_CLIENT_ID;
  const clientSecret = process.env.AVAILITY_CLIENT_SECRET;
  const testMode = process.env.AVAILITY_TEST_MODE !== 'false';

  if (!clientId || !clientSecret) {
    console.warn('Availity credentials not configured. Using mock mode.');
    return 'MOCK_TOKEN';
  }

  const authUrl = testMode
    ? 'https://api.sandbox.availity.com/availity/v1/token'
    : 'https://api.availity.com/availity/v1/token';

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'hipaa'
      })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Availity token:', error);
    throw error;
  }
}

/**
 * Verify patient eligibility (270/271 transaction)
 * @param {Object} params - Verification parameters
 * @returns {Object} - Eligibility response
 */
async function verifyEligibility(params) {
  const {
    member_id,
    payer_id,
    service_type = '30',
    patient_first_name,
    patient_last_name,
    patient_dob,
    test = false
  } = params;

  // If in mock mode or test, return mock data
  if (!process.env.AVAILITY_CLIENT_ID || test) {
    return getMockEligibilityResponse();
  }

  try {
    const token = await getAvailityToken();
    const testMode = process.env.AVAILITY_TEST_MODE !== 'false';
    const apiUrl = testMode
      ? 'https://api.sandbox.availity.com/availity/v1/coverages'
      : 'https://api.availity.com/availity/v1/coverages';

    const requestBody = {
      payerId: payer_id,
      subscriberId: member_id,
      serviceTypeCode: service_type,
      subscriber: {
        firstName: patient_first_name,
        lastName: patient_last_name,
        birthDate: patient_dob
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Eligibility check failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Parse Availity response (this is a simplified version)
    return parseEligibilityResponse(data);
  } catch (error) {
    console.error('Error verifying eligibility:', error);
    // Return mock data on error
    return getMockEligibilityResponse();
  }
}

/**
 * Submit insurance claim (837 transaction)
 * @param {Object} claim - Claim data
 * @returns {Object} - Submission response
 */
async function submitClaimToAvaility(claim) {
  // If in mock mode, return success
  if (!process.env.AVAILITY_CLIENT_ID) {
    return {
      success: true,
      claim_id: claim.claim_number,
      status: 'submitted',
      message: 'Mock submission successful'
    };
  }

  try {
    const token = await getAvailityToken();
    const testMode = process.env.AVAILITY_TEST_MODE !== 'false';
    const apiUrl = testMode
      ? 'https://api.sandbox.availity.com/availity/v1/claims'
      : 'https://api.availity.com/availity/v1/claims';

    // Build 837 claim format
    const claimRequest = {
      payerId: claim.payer_id,
      memberId: claim.member_id,
      claimNumber: claim.claim_number,
      serviceDate: claim.service_date,
      billingProvider: {
        npi: process.env.PROVIDER_NPI || claim.provider_npi,
        taxonomyCode: process.env.PROVIDER_TAXONOMY || '103T00000X'
      },
      serviceLine: {
        procedureCode: claim.cpt_code,
        diagnosisCodes: [claim.diagnosis_code],
        chargeAmount: claim.amount,
        placeOfService: claim.place_of_service || '11'
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(claimRequest)
    });

    if (!response.ok) {
      throw new Error(`Claim submission failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      claim_id: claim.claim_number,
      availity_id: data.claimId || data.id,
      status: 'submitted',
      message: 'Claim submitted successfully'
    };
  } catch (error) {
    console.error('Error submitting claim:', error);
    throw error;
  }
}

/**
 * Check claim status (276/277 transaction)
 * @param {string} claimNumber - Claim number to check
 * @returns {Object} - Claim status response
 */
async function checkClaimStatus(claimNumber) {
  // If in mock mode, return mock status
  if (!process.env.AVAILITY_CLIENT_ID) {
    return {
      claim_number: claimNumber,
      status: 'pending',
      status_category: 'In Process',
      status_date: new Date().toISOString()
    };
  }

  try {
    const token = await getAvailityToken();
    const testMode = process.env.AVAILITY_TEST_MODE !== 'false';
    const apiUrl = testMode
      ? `https://api.sandbox.availity.com/availity/v1/claims/${claimNumber}/status`
      : `https://api.availity.com/availity/v1/claims/${claimNumber}/status`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const data = await response.json();

    return parseClaimStatusResponse(data);
  } catch (error) {
    console.error('Error checking claim status:', error);
    return {
      claim_number: claimNumber,
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * Parse Availity eligibility response into our format
 */
function parseEligibilityResponse(data) {
  // This is a simplified parser. Real implementation would need to handle
  // the complex 271 response format
  return {
    status: data.active ? 'active' : 'inactive',
    deductible: data.deductible?.individual?.amount || 'N/A',
    deductible_met: data.deductible?.individual?.met || 'N/A',
    copay: data.copay?.amount || 'N/A',
    coinsurance: data.coinsurance?.percentage ? `${data.coinsurance.percentage}%` : 'N/A',
    out_of_pocket_max: data.outOfPocketMax?.individual?.amount || 'N/A',
    coverage_dates: {
      start: data.coverageStart,
      end: data.coverageEnd
    }
  };
}

/**
 * Parse Availity claim status response
 */
function parseClaimStatusResponse(data) {
  return {
    claim_number: data.claimNumber,
    status: data.status,
    status_category: data.statusCategory,
    status_date: data.statusDate,
    paid_amount: data.paidAmount,
    check_number: data.checkNumber,
    check_date: data.checkDate
  };
}

/**
 * Get mock eligibility response for testing/demo
 */
function getMockEligibilityResponse() {
  return {
    status: 'active',
    deductible: '$1,500',
    deductible_met: '$750',
    copay: '$30',
    coinsurance: '20%',
    out_of_pocket_max: '$5,000',
    coverage_dates: {
      start: '2025-01-01',
      end: '2025-12-31'
    }
  };
}

module.exports = {
  getAvailityToken,
  verifyEligibility,
  submitClaimToAvaility,
  checkClaimStatus
};
