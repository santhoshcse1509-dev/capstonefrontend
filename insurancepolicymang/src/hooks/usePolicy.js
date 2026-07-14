import { useState, useEffect } from 'react';
import policyService from '../services/policyService';
import { normalizeList } from '../utils/helpers';

export const usePolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPoliciesAndTypes();
  }, []);

  const fetchPoliciesAndTypes = async () => {
    setLoading(true);
    try {
      const policyRes = await policyService.getAllPolicies();
      const typeRes = await policyService.getPolicyTypes();
      setPolicies(normalizeList(policyRes));
      setTypes(normalizeList(typeRes));
    } catch (err) {
      setError(err.message || 'Error fetching policy data');
    } finally {
      setLoading(false);
    }
  };

  const purchase = async (policyId, nomineeData) => {
    setLoading(true);
    try {
      const res = await policyService.purchasePolicy({ policyId, ...nomineeData });
      return res;
    } catch (err) {
      setError(err.message || 'Error purchasing policy');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { policies, types, loading, error, purchase, refresh: fetchPoliciesAndTypes };
};
