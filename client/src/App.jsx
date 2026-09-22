import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import Products from './pages/Products.jsx';
import Warehouses from './pages/Warehouses.jsx';
import WarehouseDetail from './pages/WarehouseDetail.jsx';
import Operations from './pages/Operations.jsx';

export default function App() {
  return (
    <>
      <nav>
        <NavLink to="/warehouses">Склады</NavLink>
        <NavLink to="/products">Номенклатура</NavLink>
        <NavLink to="/receipts">Поступления</NavLink>
        <NavLink to="/transfers">Перемещения</NavLink>
        <NavLink to="/sales">Реализация</NavLink>
        <NavLink to="/writeoffs">Списание</NavLink>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<Products />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/warehouses/:id" element={<WarehouseDetail />} />
          <Route path="/receipts" element={<Operations type="receipt" />} />
          <Route path="/transfers" element={<Operations type="transfer" />} />
          <Route path="/sales" element={<Operations type="sale" />} />
          <Route path="/writeoffs" element={<Operations type="writeoff" />} />
        </Routes>
      </div>
    </>
  );
}
