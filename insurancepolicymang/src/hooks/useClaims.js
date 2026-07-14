import { useState } from 'react';
import claimService from '../services/claimService';
import { normalizeList } from '../utils/helpers';

export const useClaims = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (claimData) => {
    setLoading(true);
    try {
      const res = await claimService.submitClaim(claimData);
      return res;
    } catch (err) {
      setError(err.message || 'Error submitting claim');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchMyClaims = async () => {
    setLoading(true);
    try {
      const res = await claimService.getMyClaims();
      return normalizeList(res);
    } catch (err) {
      setError(err.message || 'Error fetching claims');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { submit, fetchMyClaims, loading, error };
};
