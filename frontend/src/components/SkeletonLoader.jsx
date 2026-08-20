import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const CardSkeleton = () => (
    <div className="card p-3">
      <div className="skeleton mb-2" style={{ height: 14, width: '40%' }} />
      <div className="skeleton mb-1" style={{ height: 28, width: '60%' }} />
      <div className="skeleton" style={{ height: 12, width: '30%' }} />
    </div>
  );

  const RowSkeleton = () => (
    <div className="d-flex align-items-center gap-3 py-2 border-bottom">
      <div className="skeleton rounded-circle flex-shrink-0" style={{ width: 40, height: 40 }} />
      <div className="flex-grow-1">
        <div className="skeleton mb-1" style={{ height: 12, width: '50%' }} />
        <div className="skeleton" style={{ height: 10, width: '30%' }} />
      </div>
      <div className="skeleton" style={{ height: 16, width: 70 }} />
    </div>
  );

  const items = Array.from({ length: count });

  if (type === 'row') return <>{items.map((_, i) => <RowSkeleton key={i} />)}</>;
  return (
    <div className="row g-3">
      {items.map((_, i) => (
        <div key={i} className="col-12 col-sm-6 col-lg-3"><CardSkeleton /></div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
