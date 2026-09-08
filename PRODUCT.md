# Snackyzz

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Clientes que seleccionan productos, realizan un pedido y adjuntan su comprobante SINPE.
- Clientes que buscan ubicaciones físicas donde comprar Snackyzz.
- Administradores que revisan pedidos y comprobantes, y confirman las órdenes.

## Product Purpose

Permitir comprar productos Snackyzz mediante un catálogo y carrito, registrar pedidos con comprobante SINPE y confirmar cada pedido por correo tras la revisión del administrador.

## Operating Context

1. El cliente selecciona entre tres productos y puede abrir una ventana con imagen y descripción breve.
2. El carrito muestra los productos seleccionados, sus cantidades y el total.
3. Al pulsar Comprar, el cliente completa el flujo de pedido. Adjuntar una imagen del comprobante SINPE es obligatorio; sin ella no se puede enviar el pedido.
4. Solo cuando la orden se haya registrado correctamente, se muestra una pantalla de éxito que informa que, tras revisar el SINPE, se enviará un correo con la confirmación del pedido. El registro del pedido no equivale a confirmar el pago.
5. La sección Órdenes del panel de administración muestra los pedidos y permite revisar su comprobante.
6. El administrador pulsa Confirmar y se envía al cliente un correo de orden confirmada.

La pantalla Punto de venta muestra ubicaciones donde comprar; no es una caja para ventas presenciales.

## Capabilities and Constraints

- Catálogo inicial de exactamente tres opciones de producto.
- Carrito con cantidades y detalle del producto en ventana emergente.
- Checkout con imagen del comprobante SINPE obligatoria y correo del cliente necesario para la confirmación.
- Persistencia real de órdenes y comprobantes, revisión administrativa y envío de correo requeridos para completar el flujo solicitado.
- El proyecto actual es una base frontend en JavaScript, HTML y CSS, con carrito en localStorage. No tiene backend, autenticación administrativa, almacenamiento de comprobantes ni servicio de correo conectados.
- Las capacidades adicionales del administrador, como editar precios o inventario, siguen por definir; no son requisitos confirmados.

### Decisiones abiertas

- Nombres, precios, moneda, imágenes y descripciones reales de los tres productos.
- Número SINPE y nombre del destinatario que se mostrarán al comprar.
- Entrega o retiro, cobertura, costos y datos del cliente necesarios para entregar.
- Ubicaciones reales, direcciones y horarios de los puntos de venta.
- Proveedor de backend, almacenamiento, autenticación administrativa, correo y despliegue.
- Tratamiento de comprobantes rechazados, cancelaciones y fallos de correo.
- Redes sociales específicas que deben enlazarse.
- Ubicación de los mockups mencionados por el usuario.

## Brand Commitments

- Nombre: Snackyzz.
- Colores indicados por el usuario: crema `#F9EDE0`, café chocolate `#3C1907`, naranja Snackyzz `#ED781A` y naranja oscuro `#D95907`.
- Identificador de redes: `Snackyzz.cookies`.
- Correo de contacto: `Snackyzz.cookies@gmail.com`.
- Mostrar redes y correo en el footer.
- Usar los mockups existentes como guía cuando se localicen. La paleta explícita actual tiene prioridad sobre las paletas de documentos anteriores.

## Evidence on Hand

- `src/`: base navegable con inicio, tienda, carrito, ubicaciones e información.
- `src/data/products.js`: cuatro productos de ejemplo; no representan el catálogo confirmado de tres opciones.
- `src/data/salesPoints.js`: ubicaciones de ejemplo sin confirmación del usuario.
- `docs/superpowers/specs/2026-07-14-snackyzz-mockup-design.md`: descripción de un mockup anterior. Su paleta y alcance sin backend no sustituyen los requisitos actuales.
- No se localizaron archivos de imagen de mockups o fotografías de producto en el listado del proyecto. El usuario confirma que existen mockups, pero falta su ubicación.
- Ingredientes, calidad, horarios y otras afirmaciones presentes en el starter no están confirmados como datos reales del negocio.

## Product Principles

- Mostrar con claridad qué productos y cantidades contiene cada pedido.
- Exigir el comprobante SINPE antes de registrar la orden.
- Distinguir pedido recibido de pedido confirmado tras la revisión del pago.
- Mantener conectadas la revisión administrativa y la confirmación por correo.
- Publicar datos del negocio confirmados; conservar los datos de ejemplo como tales.
