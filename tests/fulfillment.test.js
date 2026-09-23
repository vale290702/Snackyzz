import test from "node:test";
import assert from "node:assert/strict";
import { createCartStore } from "../src/lib/cart.js";
import { renderCheckout, renderSuccess } from "../src/pages/checkout.js";
import { renderAdmin } from "../src/pages/admin.js";

const product = { id: "cookie", name: "Cookie", price: 2500, image: "/assets/choco-cloud.webp" };
function checkout(overrides = {}) {
  const cart = createCartStore({ products: [product], storage: { getItem:()=>null, setItem(){} } });
  cart.changeQuantity("cookie", 1);
  return renderCheckout({ cart, payment:{configured:true,number:"88888888",recipient:"Snackyzz"}, contact:{}, delivery:{uberEnabled:true,disclaimer:"El costo del servicio de mensajería por Uber corre por cuenta del cliente y se paga por separado."}, salesPoints:[], fulfillment:{type:"uber",pickupLocationId:"",deliveryAddress:""}, demoCatalog:false,catalogReady:true,draft:{name:"",email:"",phone:""},receipt:null,receiptPreview:"",checkoutError:"",submitting:false,validatingReceipt:false,...overrides });
}
test("checkout requires an address and explains that the customer pays Uber delivery", () => {
  const html = checkout();
  assert.match(html, /name="deliveryAddress" required/);
  assert.match(html, /corre por cuenta del cliente y se paga por separado/);
});
test("checkout lists admin-provided pickup locations", () => {
  const html = checkout({salesPoints:[{id:"loc-1",name:"Tienda Central",city:"San José",address:"Avenida 1",hours:"L-V"}],fulfillment:{type:"pickup",pickupLocationId:"loc-1",deliveryAddress:""}});
  assert.match(html, /Tienda Central — San José/);
  assert.match(html, /Avenida 1, San José/);
});
test("success offers WhatsApp with the order number", () => {
  const html = renderSuccess({lastOrder:{id:"order-123",email:"ana@example.test",demo:true},contact:{whatsapp:"+506 8888-8888"}});
  assert.match(html, /https:\/\/wa\.me\/50688888888/);
  assert.match(html, /order-123/);
  assert.match(html, /Contactar por WhatsApp/);
});
test("admin configuration exposes store and pickup controls plus email diagnosis", () => {
  const html = renderAdmin({authenticated:true,loading:false,busy:false,error:"",view:"settings",settings:{uber_delivery_enabled:true,uber_disclaimer:"El costo corre por cuenta del cliente."},locations:[],emailConfigured:false,orders:[],products:[]});
  assert.match(html, /Datos de la tienda/);
  assert.match(html, /WhatsApp con código de país/);
  assert.match(html, /Nuevo punto/);
  assert.match(html, /RESEND_API_KEY/);
});
