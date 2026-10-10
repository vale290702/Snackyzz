'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { products as previewProducts } from '../data/products';
import { createCartStore } from '../lib/cart';
import { api } from '../lib/api';
import { configured, supabase } from '../lib/supabase';
import { getRouteFromHash, navigateTo, type Route } from '../lib/router';
import { safeImage } from '../lib/html';
import { productBrandLabel } from '../lib/collections';
import { Nav, Footer, Icon, QuantityControl } from './store/ui';
import { StoreActionsProvider } from './store/actions';
import { Home } from '../features/pages/home';
import { Shop } from '../features/pages/shop';
import { Sales } from '../features/pages/sales';
import { About } from '../features/pages/about';
import { Checkout, Success } from '../features/pages/checkout';
import { Admin } from '../features/admin/Admin';
import { useAdmin } from '../features/admin/useAdmin';
import type { Product, SalesPoint, Contact, Delivery, Payment, Fulfillment, CheckoutDraft, StoreActions } from '../types/store';

type OrderResult = { id: string; email: string; demo?: boolean };
interface Catalog {
  products: Product[]; salesPoints: SalesPoint[]; demoCatalog: boolean;
  payment: Payment; contact: Contact; delivery: Delivery;
}
interface AppState extends Catalog {
  selectedCity: string; fulfillment: Fulfillment; catalogReady: boolean; catalogError: string;
  activePage: Route; draft: CheckoutDraft; receipt: File | null; receiptPreview: string;
  validatingReceipt: boolean; checkoutError: string; submitting: boolean;
  lastOrder: OrderResult | null; idempotencyKey: string; detailId: string | null;
}
const emptyFulfillment = (): Fulfillment => ({ type: 'pickup', pickupLocationId: '', deliveryAddress: '', deliveryDate: '', deliverySlotStart: '' });
const initialState = (): AppState => ({
  products: previewProducts, salesPoints: [], selectedCity: 'Todos', demoCatalog: true,
  payment: { configured: false, number: '', recipient: '' },
  contact: { whatsapp: '', email: 'Snackyzz.cookies@gmail.com', instagram: 'Snackyzz.cookies' },
  delivery: { uberEnabled: true, disclaimer: 'El costo del servicio de mensajería corre por cuenta del cliente y se paga por separado.', leadHours: 6, slotHours: 3, schedule: {} },
  fulfillment: emptyFulfillment(), catalogReady: false, catalogError: '', activePage: 'home',
  draft: { name: '', email: '', phone: '' }, receipt: null, receiptPreview: '', validatingReceipt: false,
  checkoutError: '', submitting: false, lastOrder: null, idempotencyKey: '', detailId: null,
});
const titles: Record<Route, string> = { home: 'Caer en el antojo nunca supo tan bien.', shop: 'Snackyzz', 'baking-stereo': 'Snackyzz X Baking Stereo', sales: 'Dónde encontrarnos', checkout: 'Completa tu pedido', success: 'Pedido recibido', admin: 'Administración', about: 'Sobre nosotros' };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

export default function AppShell() {
  const [state, setState] = useState<AppState>(initialState);
  const current = useRef(state);
  const [renderRevision, setRenderRevision] = useState(0);
  const patch = useCallback((value: Partial<AppState>) => {
    current.current = { ...current.current, ...value };
    setState(current.current);
    if (Object.keys(value).some(key => !['draft', 'idempotencyKey'].includes(key))) setRenderRevision(n => n + 1);
  }, []);
  const [cart, setCart] = useState(() => createCartStore({ products: previewProducts, storage: null }));
  const cartRef = useRef(cart);
  const [, updateCart] = useState(0);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const receiptVersion = useRef(0);
  const mounted = useRef(false);
  const catalogVersion = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const pendingFocus = useRef(false);
  const pendingQty = useRef<{ id: string; delta: number; dialog: boolean } | null>(null);
  const notify = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(''), 5000);
  }, []);
  const loadCatalog = useCallback(async () => {
    if (!configured) return;
    const version = ++catalogVersion.current;
    patch({ catalogError: '' });
    try {
      const catalog = await api<Catalog>('/catalog');
      if (!mounted.current || version !== catalogVersion.current) return;
      const next = createCartStore({ products: catalog.products });
      cartRef.current = next;
      setCart(next);
      patch({ ...catalog, catalogReady: true, fulfillment: !catalog.salesPoints.length && catalog.delivery.uberEnabled ? { ...current.current.fulfillment, type: 'uber' } : current.current.fulfillment });
    } catch (error) {
      if (mounted.current && version === catalogVersion.current) patch({ catalogReady: false, catalogError: errorMessage(error) });
    }
  }, [patch]);
  const admin = useAdmin({ notify, onCatalogChange: loadCatalog });
  const adminRef = useRef(admin);
  useLayoutEffect(() => { adminRef.current = admin; });

  useEffect(() => {
    mounted.current = true;
    const restored = createCartStore({ products: previewProducts });
    cartRef.current = restored;
    setCart(restored);
    const route = getRouteFromHash();
    patch({ activePage: route });
    const routeChanged = () => {
      dialog.current?.close();
      const activePage = getRouteFromHash();
      pendingFocus.current = true;
      patch({ activePage, detailId: null });
      if (activePage === 'admin' && !adminRef.current.state.loaded) void adminRef.current.load();
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (current.current.submitting) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('hashchange', routeChanged);
    window.addEventListener('beforeunload', beforeUnload);
    const subscription = supabase?.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') adminRef.current.reset();
    });
    void loadCatalog();
    if (route === 'admin') void adminRef.current.load();
    return () => {
      mounted.current = false;
      // Invalidate outstanding async work, rather than restoring a captured revision.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      catalogVersion.current++;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      receiptVersion.current++;
      window.removeEventListener('hashchange', routeChanged);
      window.removeEventListener('beforeunload', beforeUnload);
      subscription?.data.subscription.unsubscribe();
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (current.current.receiptPreview) URL.revokeObjectURL(current.current.receiptPreview);
    };
  }, [loadCatalog, patch]);
  useLayoutEffect(() => {
    document.title = `${titles[state.activePage]} | Snackyzz`;
    if (pendingFocus.current) {
      pendingFocus.current = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.getElementById('main')?.focus({ preventScroll: true });
    }
  }, [state.activePage, renderRevision]);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (state.detailId && element && !element.open) element.showModal();
    if (!state.detailId && element?.open) element.close();
    if (pendingQty.current) {
      const { id, delta, dialog: inDialog } = pendingQty.current;
      const scope = inDialog ? element : document.getElementById('app');
      scope?.querySelector<HTMLButtonElement>(`[data-product="${CSS.escape(id)}"][data-qty="${delta}"]:not(:disabled)`)?.focus({ preventScroll: !inDialog });
      pendingQty.current = null;
    }
  });
  const closeDialog = () => {
    dialog.current?.close();
    patch({ detailId: null });
    dialogTrigger.current?.focus({ preventScroll: true });
  };
  const changeQuantity = (id: string, delta: number) => {
    const product = current.current.products.find(p => p.id === id);
    if (!product) return;
    cartRef.current.changeQuantity(id, delta);
    updateCart(value => value + 1);
    patch({ idempotencyKey: '' });
    pendingQty.current = { id, delta, dialog: Boolean(current.current.detailId) };
    setRenderRevision(n => n + 1);
    notify(delta > 0 ? `${product.name} agregada. ${cartRef.current.getCount()} cookies en tu carrito.` : `Carrito actualizado. ${cartRef.current.getCount()} cookies.`);
    document.querySelector('.cart-button')?.classList.remove('bag-nudge');
    requestAnimationFrame(() => document.querySelector('.cart-button')?.classList.add('bag-nudge'));
  };
  const receiptChange = async (file: File | null, input: HTMLInputElement) => {
    // Legacy re-render replaced the input; allow selecting the same file again.
    input.value = "";
    if (!file) return;
    const version = ++receiptVersion.current;
    if (current.current.receiptPreview) URL.revokeObjectURL(current.current.receiptPreview);
    patch({ receipt: null, receiptPreview: '', idempotencyKey: '', validatingReceipt: true });
    let error = '';
    if (!['image/jpeg', 'image/png'].includes(file.type)) error = 'Selecciona una imagen JPG o PNG del comprobante.';
    else if (file.size > 5 * 1024 * 1024) error = 'La imagen supera 5 MB. Usa una imagen más pequeña.';
    else if (!file.size) error = 'La imagen está vacía. Selecciona otro comprobante.';
    else { try { const bitmap = await createImageBitmap(file); bitmap.close(); } catch { error = 'No pudimos leer la imagen. Selecciona otro JPG o PNG.'; } }
    if (!mounted.current || version !== receiptVersion.current) return;
    if (error) { patch({ validatingReceipt: false, receipt: null, receiptPreview: '', idempotencyKey: '', checkoutError: error }); return; }
    patch({ validatingReceipt: false, receipt: file, receiptPreview: URL.createObjectURL(file), checkoutError: '', idempotencyKey: '' });
  };
  const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = current.current;
    if (data.submitting || data.validatingReceipt) return;
    if (!data.receipt) { patch({ checkoutError: 'Adjunta tu comprobante SINPE para continuar.' }); return; }
    if (!data.catalogReady) { patch({ checkoutError: 'No pudimos cargar la tienda. Reintenta la conexión antes de enviar tu pedido.' }); return; }
    const body = new FormData();
    for (const [key, value] of Object.entries(data.draft)) body.set(key, value.trim());
    body.set('items', JSON.stringify(cartRef.current.getLines().map(({ product, quantity }) => ({ productId: product.id, quantity }))));
    body.set('receipt', data.receipt);
    body.set('fulfillmentType', data.fulfillment.type);
    body.set('pickupLocationId', data.fulfillment.pickupLocationId);
    body.set('deliveryAddress', data.fulfillment.deliveryAddress.trim());
    body.set('deliveryDate', data.fulfillment.deliveryDate);
    body.set('deliverySlotStart', data.fulfillment.deliverySlotStart);
    const idempotencyKey = data.idempotencyKey || crypto.randomUUID();
    patch({ idempotencyKey, submitting: true, checkoutError: '' });
    try {
      const { order } = await api<{ order: OrderResult }>('/orders', { method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey } });
      if (!order?.id) throw Error('No pudimos confirmar el registro. Intenta enviar el pedido de nuevo.');
      cartRef.current.clear(); updateCart(value => value + 1);
      if (current.current.receiptPreview) URL.revokeObjectURL(current.current.receiptPreview);
      patch({ lastOrder: { ...order, email: data.draft.email.trim(), demo: data.demoCatalog }, draft: { name: '', email: '', phone: '' }, fulfillment: { ...emptyFulfillment(), type: current.current.salesPoints.length ? 'pickup' : 'uber' }, receipt: null, receiptPreview: '', idempotencyKey: '' });
      adminRef.current.patch({ loaded: false });
      navigateTo('success');
    } catch (error) { patch({ checkoutError: errorMessage(error) }); }
    finally {
      patch({ submitting: false });
      requestAnimationFrame(() => { if (current.current.checkoutError) document.getElementById('checkout-error')?.scrollIntoView({ block: 'center' }); });
    }
  };
  const actions: StoreActions = {
    changeQuantity,
    openProduct(id) { dialogTrigger.current = document.activeElement as HTMLElement; patch({ detailId: id }); },
    clearCart() { cartRef.current.clear(); updateCart(value => value + 1); patch({ idempotencyKey: '' }); notify('Carrito vacío.'); },
    selectCity(selectedCity) { patch({ selectedCity }); },
    async copySinpe() { try { await navigator.clipboard.writeText(current.current.payment.number); notify('Número SINPE copiado.'); } catch { notify('No se pudo copiar. Selecciona el número SINPE y cópialo.'); } },
    checkoutChange(name, value) {
      const data = current.current;
      if (name === 'name' || name === 'email' || name === 'phone') patch({ draft: { ...data.draft, [name]: value }, idempotencyKey: '' });
      else {
        const key = name === 'fulfillmentType' ? 'type' : name;
        patch({ fulfillment: { ...data.fulfillment, [key]: value, ...(key === 'deliveryDate' ? { deliverySlotStart: '' } : {}) }, idempotencyKey: '' });
      }
    },
    receiptChange,
    submitCheckout,
  };
  const guardNavigation = (event: MouseEvent) => {
    const target = (event.target as Element).closest('a');
    if (target?.getAttribute('href') === '#main') { event.preventDefault(); document.getElementById('main')?.focus(); return; }
    if (current.current.submitting && target?.getAttribute('href')?.startsWith('#')) { event.preventDefault(); event.stopPropagation(); notify('Estamos registrando tu pedido. Espera un momento.'); }
  };
  const props = { ...state, cart };
  const view = state.activePage === 'home' ? <Home {...props} /> : state.activePage === 'shop' ? <Shop {...props} /> : state.activePage === 'baking-stereo' ? <Shop {...props} collection="baking-stereo" /> : state.activePage === 'sales' ? <Sales {...props} /> : state.activePage === 'about' ? <About /> : state.activePage === 'checkout' ? <Checkout {...props} /> : state.activePage === 'success' ? <Success {...props} /> : <Admin controller={admin} />;
  const product = state.products.find(p => p.id === state.detailId);
  return <StoreActionsProvider actions={actions}>
    <div id="app" onClickCapture={guardNavigation}>{state.activePage === 'admin' ? view : <><Nav activePage={state.activePage} cartCount={cart.getCount()} resetKey={renderRevision} />{state.catalogError ? <div className="app-notice" role="status">{state.catalogError} <button data-reload-catalog="" onClick={() => void loadCatalog()}>Reintentar</button></div> : !configured ? <div className="app-notice">Vista previa · Los pedidos estarán disponibles cuando se conecte la tienda.</div> : null}{view}<Footer contact={state.contact} /></>}</div>
    <dialog id="product-dialog" className="product-dialog" aria-labelledby="dialog-title" ref={dialog} onClose={() => patch({ detailId: null })} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
    }}>{product ? <div className="dialog-layout"><button className="icon-button dialog-close" data-close-dialog="" aria-label="Cerrar detalles" onClick={closeDialog}><Icon name="close" /></button><img className="dialog-photo" src={safeImage(product.image)} alt={`${product.name}, imagen de referencia`} width="640" height="640" /><div className="dialog-copy"><h2 id="dialog-title">{product.name}</h2><p className="product-brand">{productBrandLabel(product)}</p><p>{product.description}</p><p className="dialog-price">{new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(product.price)}</p><div id="dialog-quantity"><QuantityControl product={product} quantity={cart.getQuantity(product.id)} /></div><button className="button button-dark wide" data-dialog-add={product.id} onClick={() => changeQuantity(product.id, 1)}>Agregar al carrito <Icon name="plus" /></button><a href="#shop" className="button button-outline wide" data-close-dialog="" onClick={closeDialog}>Ver mi carrito <Icon name="bag" /></a>{state.demoCatalog ? <p className="demo-notice">Producto e imagen de referencia. Consulta ingredientes y alérgenos antes de comprar.</p> : null}</div></div> : null}</dialog>
    <div id="toast" className="toast" role="status" aria-live="polite" aria-atomic="true">{toast}</div>
  </StoreActionsProvider>;
}
