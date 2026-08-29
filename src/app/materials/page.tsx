'use client';

import React, { useState, useEffect } from 'react';
import styles from './materials.module.css';

interface Material {
  id: string;
  code: string;
  category: string;
  description: string;
  unit: string;
  cost_ex_gst: number;
  default_markup: number;
  selling_price_ex_gst: number;
  supplier: string;
  active: boolean;
}

const CATEGORIES = [
  'Adhesives & Sealants',
  'Building Materials',
  'Copper & Press Fittings',
  'Drainage & DWV',
  'Fixings & Clamps',
  'Hot Water — Continuous Flow',
  'Hot Water — Electric',
  'Hot Water — Heat Pump',
  'Hot Water — Solar',
  'Rehau Pipe & Fittings',
  'Stormwater',
  'Tools & Abrasives',
  'Valves & Brassware',
  'Water Supply Fittings',
];

const MaterialsCataloguePage = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => {
    fetchMaterials();
  }, [search, category, page]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });

      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const response = await fetch(`/api/materials?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setMaterials(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className={styles.container}>
      <h1>Materials Catalogue</h1>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by code or description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ flex: 1 }}
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading materials...</p>
      ) : materials.length === 0 ? (
        <div className="card">
          <p>No materials found. Try adjusting your search filters.</p>
        </div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Cost Ex GST</th>
                <th>Markup</th>
                <th>Selling Price</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id}>
                  <td>
                    <strong>{material.code}</strong>
                  </td>
                  <td>{material.description}</td>
                  <td>
                    <span className={styles.category}>{material.category}</span>
                  </td>
                  <td>{material.unit}</td>
                  <td>${parseFloat(material.cost_ex_gst as any).toFixed(2)}</td>
                  <td>{parseFloat(material.default_markup as any).toFixed(0)}%</td>
                  <td className={styles.sellingPrice}>
                    ${parseFloat(material.selling_price_ex_gst as any).toFixed(2)}
                  </td>
                  <td>{material.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="secondary"
            >
              ← Previous
            </button>
            <span>
              Page {page} of {totalPages} ({total} total)
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="secondary"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MaterialsCataloguePage;
