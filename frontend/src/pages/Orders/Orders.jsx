import { useState, useMemo, useEffect } from 'react';
import { Plus, Minus, X, ShoppingCart, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productAPI, tableAPI, orderAPI } from '../../services/api.js';
import { formatCurrency, calcGST } from '../../utils/helpers.js';
import { useToast } from '../../hooks/useToast.jsx';
import { PageLoader } from '../../components/Loader/Loader.jsx';
import './Orders.css';

const TYPE_TO_BACKEND = { 'Dine-In': 'dine-in', Takeaway: 'takeaway' };

export default function Orders() {
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [orderType, setOrderType] = useState('Dine-In');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [prodData, tableData] = await Promise.all([productAPI.getAll(), tableAPI.getAll()]);
        setProducts(prodData);
        setTables(tableData);
      } catch {
        toast.error('Failed to load menu/tables');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const availableTables = tables.filter((t) => t.status === 'available');
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

  const filteredProducts = useMemo(() =>
    products.filter((p) => {
      if (!p.available) return false;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || p.category === categoryFilter;
      return matchSearch && matchCat;
    }),
    [products, search, categoryFilter]
  );

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) => {
      const updated = prev.map((i) => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i);
      return updated.filter((i) => i.quantity > 0);
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const cartItemQty = (id) => cart.find((i) => i.id === id)?.quantity || 0;

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalGST = cart.reduce((s, i) => s + calcGST(i.price * i.quantity, i.gstPercent), 0);
  const discountAmt = Math.min(discount, subtotal);
  const grandTotal = subtotal + totalGST - discountAmt;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.error('Add at least one item to the cart'); return; }
    if (orderType === 'Dine-In' && !selectedTableId) { toast.error('Please select a table for Dine-In'); return; }

    const selectedTable = availableTables.find((t) => String(t.id) === String(selectedTableId));

    setPlacing(true);
    try {
      const res = await orderAPI.create({
        tableId: orderType === 'Dine-In' ? selectedTable?.id : null,
        orderType: TYPE_TO_BACKEND[orderType],
        discount: discountAmt,
        items: cart.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
      });

      const order = {
        orderId: res.id,
        orderNumber: res.order_number,
        type: orderType,
        table: orderType === 'Dine-In' ? selectedTable?.number : null,
        items: cart,
        subtotal,
        gst: totalGST,
        discount: discountAmt,
        total: res.total,
      };
      toast.success('Order placed successfully');
      navigate('/billing', { state: { order } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="orders-layout animate-fade-in">
      {/* Left: Menu */}
      <div className="orders-menu">
        <div className="orders-menu-header">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input className="form-control" placeholder="Search menu items..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <div className="category-pills">
            <button className={`category-pill${!categoryFilter ? ' active' : ''}`} onClick={() => setCategoryFilter('')}>All</button>
            {categories.map((c) => (
              <button key={c} className={`category-pill${categoryFilter === c ? ' active' : ''}`} onClick={() => setCategoryFilter(c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="menu-items-grid">
          {filteredProducts.map((p) => {
            const qty = cartItemQty(p.id);
            return (
              <div key={p.id} className="menu-item-card" onClick={() => addToCart(p)}>
                <div className="menu-item-image">
                  {p.image ? <img src={p.image} alt={p.name} /> : <div className="menu-item-placeholder">{p.name[0]}</div>}
                </div>
                <div className="menu-item-info">
                  <h4 className="menu-item-name">{p.name}</h4>
                  <span className="menu-item-price">{formatCurrency(p.price)}</span>
                </div>
                {qty > 0 && <div className="menu-item-qty-badge">{qty}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Cart/Billing Panel */}
      <div className="orders-panel">
        <div className="orders-panel-header">
          <h3><ShoppingCart size={18} /> Order Details</h3>
        </div>

        {/* Order Type */}
        <div className="order-type-tabs">
          {['Dine-In', 'Takeaway'].map((t) => (
            <button key={t} className={`order-type-tab${orderType === t ? ' active' : ''}`} onClick={() => { setOrderType(t); setSelectedTableId(''); }}>
              {t}
            </button>
          ))}
        </div>

        {/* Table Select */}
        {orderType === 'Dine-In' && (
          <div className="form-group" style={{ padding: '0 16px' }}>
            <label className="form-label">Select Table</label>
            <select className="form-control form-select" value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)}>
              <option value="">Choose table...</option>
              {availableTables.map((t) => (
                <option key={t.id} value={t.id}>{t.number} – {t.capacity} seats ({t.location})</option>
              ))}
            </select>
          </div>
        )}

        {/* Cart Items */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={32} />
              <p>Your cart is empty</p>
              <span>Click on menu items to add them</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">{formatCurrency(item.price)} × {item.quantity}</span>
                </div>
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}><Minus size={12} /></button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}><Plus size={12} /></button>
                  <button className="qty-btn remove-btn" onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}><X size={12} /></button>
                </div>
                <div className="cart-item-total">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="cart-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="total-row">
              <span>GST</span>
              <span>{formatCurrency(totalGST)}</span>
            </div>
            <div className="total-row">
              <span>Discount (₹)</span>
              <input
                type="number"
                className="form-control"
                style={{ width: 90, padding: '4px 8px', fontSize: 13 }}
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="divider" style={{ margin: '8px 0' }} />
            <div className="total-row grand">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <button className="btn btn-primary btn-lg w-full" style={{ marginTop: 12, justifyContent: 'center' }} onClick={handlePlaceOrder} disabled={placing}>
              {placing ? 'Placing Order...' : 'Proceed to Billing'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
