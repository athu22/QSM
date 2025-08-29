import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';

const POContext = createContext();

export function usePO() {
  return useContext(POContext);
}

export function POProvider({ children }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    supplier: '',
    material: '',
    dateRange: null
  });

  // Fetch all purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'purchaseOrders'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const poData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPurchaseOrders(poData);
      setError(null);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setError('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener for purchase orders
  useEffect(() => {
    const q = query(
      collection(db, 'purchaseOrders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const poData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPurchaseOrders(poData);
      setLoading(false);
    }, (error) => {
      console.error('Error in real-time PO listener:', error);
      setError('Failed to listen to purchase orders');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Get PO by number
  const getPOByNumber = (poNumber) => {
    return purchaseOrders.find(po => po.poNumber === poNumber);
  };

  // Get POs by status
  const getPOsByStatus = (status) => {
    return purchaseOrders.filter(po => po.status === status);
  };

  // Get POs by supplier
  const getPOsBySupplier = (supplierName) => {
    return purchaseOrders.filter(po => 
      po.supplierName.toLowerCase().includes(supplierName.toLowerCase())
    );
  };

  // Get POs by material
  const getPOsByMaterial = (material) => {
    return purchaseOrders.filter(po => 
      po.material.toLowerCase().includes(material.toLowerCase())
    );
  };

  // Search POs with multiple criteria
  const searchPOs = (searchTerm) => {
    if (!searchTerm) return purchaseOrders;
    
    return purchaseOrders.filter(po => 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.material.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get filtered POs based on current filters
  const getFilteredPOs = () => {
    let filtered = [...purchaseOrders];

    if (filters.status) {
      filtered = filtered.filter(po => po.status === filters.status);
    }

    if (filters.supplier) {
      filtered = filtered.filter(po => 
        po.supplierName.toLowerCase().includes(filters.supplier.toLowerCase())
      );
    }

    if (filters.material) {
      filtered = filtered.filter(po => 
        po.material.toLowerCase().includes(filters.material.toLowerCase())
      );
    }

    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter(po => {
        const poDate = new Date(po.orderDate);
        return poDate >= filters.dateRange.start && poDate <= filters.dateRange.end;
      });
    }

    return filtered;
  };

  // Get unique suppliers for filtering
  const getUniqueSuppliers = () => {
    const suppliers = [...new Set(purchaseOrders.map(po => po.supplierName))];
    return suppliers.filter(Boolean).sort();
  };

  // Get unique materials for filtering
  const getUniqueMaterials = () => {
    const materials = [...new Set(purchaseOrders.map(po => po.material))];
    return materials.filter(Boolean).sort();
  };

  // Get PO statistics
  const getPOStats = () => {
    const total = purchaseOrders.length;
    const pending = purchaseOrders.filter(po => po.status === 'Pending').length;
    const approved = purchaseOrders.filter(po => po.status === 'Approved').length;
    const rejected = purchaseOrders.filter(po => po.status === 'Rejected').length;
    const completed = purchaseOrders.filter(po => po.status === 'Completed').length;

    return {
      total,
      pending,
      approved,
      rejected,
      completed
    };
  };

  const value = {
    purchaseOrders,
    loading,
    error,
    filters,
    setFilters,
    getPOByNumber,
    getPOsByStatus,
    getPOsBySupplier,
    getPOsByMaterial,
    searchPOs,
    getFilteredPOs,
    getUniqueSuppliers,
    getUniqueMaterials,
    getPOStats,
    fetchPurchaseOrders
  };

  return (
    <POContext.Provider value={value}>
      {children}
    </POContext.Provider>
  );
}
